'use server';

// Lógica de Segurança Zero Trust: Emissão sob Demanda e Validação de Certidões com Fé Pública
import { z } from 'zod';
import { randomBytes } from 'crypto';
import { createClient } from '@/lib/supabase/server';
import { calculateSHA256 } from '@/lib/crypto';
import { maskCPF, maskEmail, formatCPF, sanitizeDatabaseError } from '@/lib/utils';
import { requireRole } from '@/lib/auth/rbac';
import type { ActionResponse } from '@/types/actions';
import type { CertificateData } from '@/components/certificate/CertificateDocument';

const issueSchema = z.object({
  registrationId: z.string().uuid('ID de inscrição inválido.'),
});

const revokeSchema = z.object({
  certificateId: z.string().uuid('ID de certificado inválido.'),
  reason: z.string().min(5, 'A justificativa de revogação deve ter no mínimo 5 caracteres.'),
});

interface CertificateEntity {
  id: string;
  validation_code: string;
  sha256_hash: string;
  issued_at: string;
  mandate_snapshot: any;
  is_revoked: boolean;
  revocation_reason?: string | null;
}

interface ParticipantEntity {
  participant_name: string;
  participant_cpf: string;
  participant_email: string;
}

interface EventEntity {
  title: string;
  description?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  workload_hours: number;
  location?: string | null;
  siga_id: string;
  system_type?: string | null;
}

/**
 * Função pura de mapeamento institucional de certidões.
 * Aplica mascaramento LGPD compulsório quando isPublicMasked = true.
 */
function buildCertificateData(
  cert: CertificateEntity,
  participant: ParticipantEntity,
  event: EventEntity,
  options: { isPublicMasked?: boolean } = {}
): CertificateData {
  const isMasked = options.isPublicMasked ?? false;
  return {
    certificateId: cert.id,
    validationCode: cert.validation_code,
    sha256Hash: cert.sha256_hash,
    issuedAt: cert.issued_at,
    participant: {
      fullName: participant.participant_name,
      cpfFormatted: isMasked ? maskCPF(participant.participant_cpf) : formatCPF(participant.participant_cpf),
      email: isMasked ? maskEmail(participant.participant_email) : participant.participant_email,
    },
    event: {
      title: event.title,
      description: event.description,
      startDate: event.start_date || cert.issued_at,
      endDate: event.end_date || cert.issued_at,
      workloadHours: event.workload_hours,
      location: event.location || 'UEMG Unidade Carangola',
      sigaId: event.siga_id,
      systemType: event.system_type || 'SIGA',
    },
    mandateSnapshot: cert.mandate_snapshot,
    isRevoked: cert.is_revoked,
    revocationReason: cert.revocation_reason || null,
  };
}

/**
 * Monta o snapshot temporal das autoridades vigentes com fallback seguro.
 */
function resolveMandateSnapshot(activeMandates: any[]) {
  const coordinator = activeMandates?.find((m: any) => m.role === 'coordenador_extensao');
  const director = activeMandates?.find((m: any) => m.role === 'diretor_unidade');

  return {
    coordinator: {
      name: coordinator?.authority_name || 'Prof. Coordenador de Extensão',
      roleTitle: 'Coordenador de Extensão (NUPEX)',
      masp: coordinator?.masp || '1.234.567-8',
      officialAct: coordinator?.official_act || 'Portaria UEMG Carangola nº 01/2026',
    },
    director: {
      name: director?.authority_name || 'Prof. Diretor da Unidade Carangola',
      roleTitle: 'Diretor da Unidade Acadêmica',
      masp: director?.masp || '8.765.432-1',
      officialAct: director?.official_act || 'Resolução CONUN/UEMG nº 123/2025',
    },
  };
}

/**
 * Gera um código verificador único e legível para a certidão
 * Exemplo: CAR-2026-A1B2-C3D4
 */
function generateValidationCode(): string {
  const year = new Date().getFullYear();
  const hex1 = randomBytes(2).toString('hex').toUpperCase();
  const hex2 = randomBytes(2).toString('hex').toUpperCase();
  return `CAR-${year}-${hex1}-${hex2}`;
}

/**
 * Emite ou recupera a certidão de extensão sob demanda para o participante com presença confirmada.
 * Custo de Storage = R$ 0,00 (Salva apenas os metadados e snapshot; a renderização ocorre em memória).
 */
export async function issueCertificateAction(
  registrationId: string
): Promise<ActionResponse<CertificateData>> {
  try {
    const validated = issueSchema.parse({ registrationId });
    const supabase = createClient();

    // 1. Localiza a inscrição e os dados do participante
    const { data: registration, error: regError } = await (supabase.from('registrations') as any)
      .select('id, event_id, participant_name, participant_cpf, participant_email, attended, checked_in_at')
      .eq('id', validated.registrationId)
      .single();

    if (regError || !registration) {
      return { success: false, error: 'Registro de inscrição não encontrado.' };
    }

    // 2. Regra de Conformidade: Presença é obrigatória para certificar
    if (!registration.attended) {
      return {
        success: false,
        error: 'Presença não registrada nesta ação extensionista. O certificado só é emitido para participantes com check-in homologado.',
      };
    }

    // 3. Localiza os dados da ação extensionista vinculada
    const { data: event, error: eventError } = await (supabase.from('events') as any)
      .select('id, title, description, start_date, end_date, workload_hours, location, status, siga_id, system_type')
      .eq('id', registration.event_id)
      .single();

    if (eventError || !event) {
      return { success: false, error: 'Ação extensionista não encontrada.' };
    }

    // 4. Regra de Cordão Umbilical: Evento deve estar homologado e com ID SIGA
    if (!['aprovado', 'encerrado'].includes(event.status)) {
      return {
        success: false,
        error: `O evento ainda não foi homologado pelo comitê de extensão. Status atual: ${event.status}.`,
      };
    }

    if (!event.siga_id || event.siga_id.trim() === '') {
      return {
        success: false,
        error: 'Violação de Fé Pública: A ação extensionista não possui código de registro institucional SIGA.',
      };
    }

    // 5. Verifica se já existe certidão emitida para esta inscrição (Idempotência)
    const { data: existingCert } = await (supabase.from('certificates') as any)
      .select('*')
      .eq('registration_id', registration.id)
      .maybeSingle();

    if (existingCert) {
      return {
        success: true,
        data: buildCertificateData(existingCert, registration, event),
      };
    }

    // 6. Obtém o snapshot temporal das autoridades signatárias vigentes
    const { data: activeMandates } = await (supabase.from('mandates') as any)
      .select('role, authority_name, masp, official_act')
      .eq('is_active', true);

    const mandateSnapshot = resolveMandateSnapshot(activeMandates);

    // 7. Gera código verificador e carimbo de integridade SHA-256
    const validationCode = generateValidationCode();
    const issuedAt = new Date().toISOString();

    const canonicalString = [
      `CODE:${validationCode}`,
      `REG:${registration.id}`,
      `EVENT:${event.id}`,
      `CPF:${registration.participant_cpf}`,
      `SIGA:${event.siga_id}`,
      `HOURS:${event.workload_hours}`,
      `ISSUED:${issuedAt}`,
    ].join('|');

    const sha256Hash = calculateSHA256(Buffer.from(canonicalString));

    // 8. Grava a certidão no banco de dados
    const { data: newCert, error: insertError } = await (supabase.from('certificates') as any)
      .insert({
        registration_id: registration.id,
        event_id: event.id,
        validation_code: validationCode,
        sha256_hash: sha256Hash,
        mandate_snapshot: mandateSnapshot,
        issued_at: issuedAt,
        is_revoked: false,
      })
      .select()
      .single();

    if (insertError || !newCert) {
      return {
        success: false,
        error: sanitizeDatabaseError(insertError) || 'Não foi possível expedir a certidão.',
      };
    }

    return {
      success: true,
      data: buildCertificateData(newCert, registration, event),
    };
  } catch (err: unknown) {
    if (err instanceof z.ZodError) {
      return { success: false, error: err.errors[0]?.message || 'Parâmetro inválido.' };
    }
    return {
      success: false,
      error: sanitizeDatabaseError(err),
    };
  }
}

/**
 * Consulta a certidão pelo ID de inscrição (para o aluno acessar diretamente)
 */
export async function getCertificateByRegistrationIdAction(
  registrationId: string
): Promise<ActionResponse<CertificateData>> {
  // Chamada transparente de emissão sob demanda
  return issueCertificateAction(registrationId);
}

/**
 * Consulta pública de validação de autenticidade (Sem autenticação requerida)
 * Aplica mascaramento compulsório de PII em conformidade com a LGPD.
 */
export async function getCertificateByValidationCodeAction(
  validationCode: string
): Promise<ActionResponse<CertificateData>> {
  try {
    const cleanCode = validationCode.trim().toUpperCase();
    if (!cleanCode) {
      return { success: false, error: 'Código de validação não informado.' };
    }

    const supabase = createClient();

    // 1. Busca a certidão pelo código
    const { data: cert, error: certError } = await (supabase.from('certificates') as any)
      .select('id, registration_id, event_id, validation_code, sha256_hash, mandate_snapshot, issued_at, is_revoked, revocation_reason')
      .eq('validation_code', cleanCode)
      .maybeSingle();

    if (certError || !cert) {
      return {
        success: false,
        error: 'Certidão não localizada. Verifique o código alfanumérico digitado ou escaneie o QR Code novamente.',
      };
    }

    // 2. Busca dados da inscrição e do evento
    const { data: registration } = await (supabase.from('registrations') as any)
      .select('participant_name, participant_cpf, participant_email')
      .eq('id', cert.registration_id)
      .single();

    const { data: event } = await (supabase.from('events') as any)
      .select('title, description, start_date, end_date, workload_hours, location, siga_id, system_type')
      .eq('id', cert.event_id)
      .single();

    if (!registration || !event) {
      return { success: false, error: 'Dados da certidão corrompidos ou inconsistentes.' };
    }

    // 3. Mascaramento LGPD Compulsório de PII para consulta pública via função pura compartilhada
    return {
      success: true,
      data: buildCertificateData(cert, registration, event, { isPublicMasked: true }),
    };
  } catch (err: unknown) {
    return {
      success: false,
      error: 'Não foi possível validar a certidão no momento. Tente novamente mais tarde.',
    };
  }
}

/**
 * Revoga uma certidão emitida (Exclusivo para Coordenador de Extensão / Administrador)
 */
export async function revokeCertificateAction(
  formData: FormData
): Promise<ActionResponse<{ revoked: boolean }>> {
  try {
    // 1. Verificação Zero Trust de RBAC
    await requireRole(['admin_extensao']);

    const rawFields = {
      certificateId: formData.get('certificateId'),
      reason: formData.get('reason'),
    };

    const validation = revokeSchema.safeParse(rawFields);
    if (!validation.success) {
      return {
        success: false,
        error: validation.error.errors[0]?.message || 'Justificativa inválida.',
      };
    }

    const supabase = createClient();
    const { error } = await (supabase.from('certificates') as any)
      .update({
        is_revoked: true,
        revocation_reason: validation.data.reason,
      })
      .eq('id', validation.data.certificateId);

    if (error) {
      return { success: false, error: sanitizeDatabaseError(error) };
    }

    return { success: true, data: { revoked: true } };
  } catch (err: unknown) {
    return {
      success: false,
      error: sanitizeDatabaseError(err),
    };
  }
}
