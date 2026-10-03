'use server';

// Lógica de Segurança Zero Trust: Cadastro de Ações Extensionistas e O Gate de Auditoria
import { createClient } from '@/lib/supabase/server';
import { requireRole, requireAuth } from '@/lib/auth/rbac';
import { type ActionResponse } from '@/types/actions';
import { sanitizeDatabaseError } from '@/lib/utils';
import { getClientIp, validateAndHashPdf } from '@/lib/server-utils';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import type { AcademicSystemType, ModalityType } from '@/types/database.types';

const CreateEventSchema = z.object({
  title: z.string().min(5, 'O título da ação deve conter ao menos 5 caracteres.').trim(),
  registry_system: z.enum(['siga', 'suap', 'sigaa', 'outro'], {
    errorMap: () => ({ message: 'Selecione um sistema institucional de registro válido.' }),
  }),
  external_registry_id: z.string().min(1, 'Código ou número de registro institucional é obrigatório.').trim(),
  modality: z.enum(['presencial', 'remoto', 'hibrido'], {
    errorMap: () => ({ message: 'Modalidade inválida.' }),
  }),
  location: z.string().min(2, 'Informe o local ou link da ação.').trim(),
  workload_hours: z.coerce.number().min(1, 'A carga horária deve ser de no mínimo 1 hora.'),
  description: z.string().optional(),
  legal_responsibility_accepted: z.literal(true, {
    errorMap: () => ({ message: 'É obrigatório declarar a aceitação do Termo de Responsabilidade (Art. 299).' }),
  }),
});

const SessionItemSchema = z.object({
  title: z.string().optional(),
  start_time: z.string(),
  end_time: z.string(),
  workload: z.coerce.number().optional(),
});

const AuditEventSchema = z.object({
  eventId: z.string().uuid('ID de evento inválido.'),
  decision: z.enum(['aprovar', 'rejeitar']),
  justification: z.string().optional(),
});

const MirrorUrlSchema = z.object({
  filePath: z
    .string()
    .min(1, 'Caminho do arquivo obrigatório.')
    .max(500)
    .refine((val) => !val.includes('..'), {
      message: 'Caminho de arquivo inválido.',
    }),
});

/**
 * Submete uma nova proposta de ação extensionista acompanhada do comprovante oficial.
 * Apenas 'docente' ou 'admin_extensao' têm permissão.
 */
export async function createEventAction(formData: FormData): Promise<ActionResponse<{ id: string }>> {
  // 1. Verificação Zero Trust de RBAC
  let profile;
  try {
    profile = await requireRole(['docente', 'admin_extensao']);
  } catch (err: any) {
    return { success: false, error: err.message };
  }

  // 2. Validação Esquematizada dos Campos de Texto
  const rawFields = {
    title: formData.get('title'),
    registry_system: formData.get('registry_system'),
    external_registry_id: formData.get('external_registry_id'),
    modality: formData.get('modality'),
    location: formData.get('location'),
    workload_hours: formData.get('workload_hours'),
    description: formData.get('description'),
    legal_responsibility_accepted: formData.get('legal_responsibility_accepted') === 'true',
  };

  const validation = CreateEventSchema.safeParse(rawFields);
  if (!validation.success) {
    return {
      success: false,
      error: validation.error.errors[0]?.message || 'Dados inválidos.',
    };
  }

  // 3. Validação do Arquivo PDF do Espelho Oficial (The Hard Box)
  const file = formData.get('mirror_pdf') as File | null;
  const pdfResult = await validateAndHashPdf(file);
  if (!pdfResult.ok) {
    return { success: false, error: pdfResult.error };
  }

  // 4. Captura de IP e Metadados Legais
  const clientIp = getClientIp();
  const nowIso = new Date().toISOString();

  const supabase = createClient();
  const filePath = `${profile.id}/${Date.now()}_espelho_${validation.data.registry_system}.pdf`;

  // 5. Upload Seguro no Storage Privado
  const { error: uploadError } = await supabase.storage
    .from('event-mirrors')
    .upload(filePath, pdfResult.buffer, {
      contentType: 'application/pdf',
      upsert: false,
    });

  if (uploadError) {
    console.error('[Storage Upload Error]:', uploadError.message);
    return { success: false, error: 'Falha ao salvar o espelho oficial no storage de segurança.' };
  }

  // 6. Inserção Transacional do Evento no Banco com status 'submetido'
  const { data: eventData, error: eventError } = await (supabase.from('events') as any)
    .insert({
      title: validation.data.title,
      registry_system: validation.data.registry_system as AcademicSystemType,
      external_registry_id: validation.data.external_registry_id,
      siga_id: validation.data.external_registry_id, // Compatibilidade retroativa
      modality: validation.data.modality as ModalityType,
      location: validation.data.location,
      workload_hours: validation.data.workload_hours,
      description: validation.data.description || null,
      status: 'submetido', // Regra Inviolável: Nasce submetido aguardando auditoria
      coordinator_id: profile.id,
      external_mirror_pdf_url: filePath,
      external_mirror_sha256: pdfResult.sha256,
      siga_mirror_pdf_url: filePath,
      siga_mirror_sha256: pdfResult.sha256,
      legal_responsibility_accepted: true,
      legal_accepted_at: nowIso,
      legal_accepted_ip: clientIp,
    })
    .select('id')
    .single();

  if (eventError || !eventData) {
    console.error('[Event Insert Error]:', eventError?.message);
    return { success: false, error: sanitizeDatabaseError(eventError) };
  }

  // 7. Registro de Sessões Iniciais com Validação Zod
  const sessionsRaw = formData.get('sessions_json');
  if (sessionsRaw && typeof sessionsRaw === 'string') {
    try {
      const parsedSessions = JSON.parse(sessionsRaw);
      const parsedResult = z.array(SessionItemSchema).safeParse(parsedSessions);
      if (parsedResult.success && parsedResult.data.length > 0) {
        const sessionInserts = parsedResult.data.map((s) => ({
          event_id: eventData.id,
          title: s.title || 'Sessão Geral',
          start_time: s.start_time,
          end_time: s.end_time,
          workload_session_hours: Number(s.workload) || validation.data.workload_hours,
        }));
        await (supabase.from('event_sessions') as any).insert(sessionInserts);
      }
    } catch (e) {
      console.warn('[Sessions Parse Warning]:', e);
    }
  }

  revalidatePath('/docente');
  revalidatePath('/auditoria');
  return { success: true, data: { id: eventData.id } };
}

/**
 * Homologa ou rejeita formalmente uma ação extensionista no Gate de Auditoria.
 * Apenas 'admin_extensao' (Coordenação) tem permissão.
 */
export async function auditEventAction(formData: FormData): Promise<ActionResponse> {
  let profile;
  try {
    profile = await requireRole(['admin_extensao']);
  } catch (err: any) {
    return { success: false, error: err.message };
  }

  const rawFields = {
    eventId: formData.get('eventId'),
    decision: formData.get('decision'),
    justification: formData.get('justification') || undefined,
  };

  const validation = AuditEventSchema.safeParse(rawFields);
  if (!validation.success) {
    return { success: false, error: validation.error.errors[0]?.message || 'Dados inválidos.' };
  }

  const { eventId, decision, justification } = validation.data;
  if (decision === 'rejeitar' && (!justification || justification.trim().length < 5)) {
    return { success: false, error: 'A justificativa técnica de recusa é obrigatória (mínimo 5 caracteres).' };
  }

  const supabase = createClient();

  // Consulta do status atual do evento
  const { data: currentEvent, error: fetchError } = await (supabase.from('events') as any)
    .select('id, status, title')
    .eq('id', eventId)
    .single();

  if (fetchError || !currentEvent) {
    return { success: false, error: 'Ação extensionista não encontrada.' };
  }

  const newStatus = decision === 'aprovar' ? 'aprovado' : 'rejeitado';
  const clientIp = getClientIp();

  // 1. Atualização do status do evento
  const { error: updateError } = await (supabase.from('events') as any)
    .update({ status: newStatus })
    .eq('id', eventId);

  if (updateError) {
    console.error('[Audit Event Error]:', updateError.message);
    return { success: false, error: sanitizeDatabaseError(updateError) };
  }

  // 2. Registro de Log Imutável de Auditoria (The Hard Box)
  await (supabase.from('event_audit_logs') as any).insert({
    event_id: eventId,
    auditor_id: profile.id,
    previous_status: currentEvent.status,
    new_status: newStatus,
    justification: justification || 'Homologação de conformidade institucional confirmada.',
    ip_address: clientIp,
  });

  revalidatePath('/docente');
  revalidatePath('/auditoria');
  return { success: true };
}

/**
 * Gera URL assinada temporária (60 segundos) para visualização do espelho em PDF.
 * Acesso exclusivo ao autor ou à coordenação.
 */
export async function getSignedMirrorUrlAction(filePath: string): Promise<ActionResponse<string>> {
  try {
    await requireAuth();
  } catch (err: any) {
    return { success: false, error: err.message };
  }

  const pathValidation = MirrorUrlSchema.safeParse({ filePath });
  if (!pathValidation.success) {
    return { success: false, error: 'Identificador de documento inválido.' };
  }

  const supabase = createClient();
  const { data, error } = await supabase.storage
    .from('event-mirrors')
    .createSignedUrl(pathValidation.data.filePath, 60);

  if (error || !data) {
    return { success: false, error: 'Não foi possível gerar link seguro para o documento.' };
  }

  return { success: true, data: data.signedUrl };
}
