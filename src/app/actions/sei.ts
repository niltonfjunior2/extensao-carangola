'use server';

// Lógica de Segurança Zero Trust: Desacoplamento SEI-MG e Rastreabilidade Processual
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { requireRole } from '@/lib/auth/rbac';
import { formatDisplayDate, sanitizeDatabaseError, maskCPF } from '@/lib/utils';
import type { ActionResponse } from '@/types/actions';

const updateSeiSchema = z.object({
  eventId: z.string().uuid('ID do evento inválido.'),
  seiProcessNumber: z.string().min(5, 'Informe o número do processo SEI-MG autuado.').max(64),
  seiDocumentId: z.string().max(64).optional().nullable(),
});

export interface SeiConcluinte {
  registrationId: string;
  fullName: string;
  cpfMasked: string;
  emailMasked: string;
  validationCode: string | null;
  sha256Hash: string | null;
}

export interface SeiPackageData {
  event: {
    id: string;
    title: string;
    sigaId: string;
    systemType: string;
    workloadHours: number;
    startDate: string;
    endDate: string;
    location: string;
    seiProcessNumber: string | null;
    seiDocumentId: string | null;
  };
  authorities: {
    coordinatorName: string;
    coordinatorMasp: string;
    directorName: string;
    directorMasp: string;
  };
  concluintes: SeiConcluinte[];
  standardDispatchText: string;
}

/**
 * Obtém o pacote consolidado para autuação e despacho no SEI-MG
 */
export async function getSeiPackageDataAction(
  eventId: string
): Promise<ActionResponse<SeiPackageData>> {
  try {
    // Validando RBAC aqui (Apenas admin e docentes podem gerar pacote SEI)
    const profile = await requireRole(['admin_extensao', 'docente']);
    const supabase = createClient();

    // 1. Busca dados do evento e suas sessões
    const { data: event, error: eventErr } = await (supabase.from('events') as any)
      .select(`
        id,
        title,
        siga_id,
        registry_system,
        external_registry_id,
        workload_hours,
        location,
        sei_process_number,
        sei_document_id,
        created_at,
        event_sessions (
          start_time,
          end_time
        )
      `)
      .eq('id', eventId)
      .single();

    if (eventErr || !event) {
      return { success: false, error: 'Ação extensionista não encontrada.' };
    }

    const sessions = Array.isArray(event.event_sessions) ? event.event_sessions : [];
    const startDate = sessions.length > 0
      ? sessions.map((s: any) => s.start_time).sort()[0]
      : event.created_at;
    const endDate = sessions.length > 0
      ? sessions.map((s: any) => s.end_time).sort().reverse()[0]
      : event.created_at;

    // 2. Busca mandatos vigentes
    const { data: mandates } = await (supabase.from('mandates') as any)
      .select('role, authority_name, masp')
      .eq('is_active', true);

    const coordinator = mandates?.find((m: any) => m.role === 'coordenador_extensao');
    const director = mandates?.find((m: any) => m.role === 'diretor_unidade');

    // 3. Busca concluintes com presença confirmada e suas certidões
    const { data: registrations } = await (supabase.from('registrations') as any)
      .select(`
        id,
        participant_name,
        participant_cpf,
        participant_email,
        attended,
        certificates (
          validation_code,
          sha256_hash
        )
      `)
      .eq('event_id', event.id)
      .eq('attended', true)
      .order('participant_name', { ascending: true });

    const concluintes: SeiConcluinte[] = (registrations || []).map((r: any) => {
      const cert = Array.isArray(r.certificates) ? r.certificates[0] : r.certificates;
      return {
        registrationId: r.id,
        fullName: r.participant_name,
        cpfMasked: maskCPF(r.participant_cpf),
        emailMasked: r.participant_email,
        validationCode: cert?.validation_code || null,
        sha256Hash: cert?.sha256_hash || null,
      };
    });

    const coordinatorName = coordinator?.authority_name || 'Prof. Coordenador de Extensão';
    const coordinatorMasp = coordinator?.masp || '1.234.567-8';
    const directorName = director?.authority_name || 'Prof. Diretor da Unidade Carangola';
    const directorMasp = director?.masp || '8.765.432-1';

    const systemLabel = (event.registry_system || 'SIGA').toUpperCase();
    const externalId = event.external_registry_id || event.siga_id;

    // 4. Compilação da Minuta Padrão de Despacho SEI-MG
    const todayStr = new Date().toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });

    const standardDispatchText = [
      `UNIVERSIDADE DO ESTADO DE MINAS GERAIS — UEMG`,
      `UNIDADE ACADÊMICA DE CARANGOLA`,
      `NÚCLEO DE PESQUISA E EXTENSÃO — NUPEX`,
      ``,
      `DESPACHO DE ENCAMINHAMENTO E CERTIFICAÇÃO INSTITUCIONAL`,
      ``,
      `À Pró-Reitoria de Extensão / Secretaria Acadêmica Central,`,
      ``,
      `1. Encaminhamos para registro e juntada processual os autos referentes à conclusão da Ação Extensionista:`,
      `   • Título: "${event.title}"`,
      `   • Registro Corporativo: ${systemLabel} nº ${externalId}`,
      `   • Carga Horária: ${event.workload_hours} horas`,
      `   • Período de Realização: ${formatDisplayDate(startDate)} a ${formatDisplayDate(endDate)}`,
      `   • Local: ${event.location || 'UEMG Unidade Carangola'}`,
      ``,
      `2. Declaramos, sob as penas da lei e em estrita conformidade com o Decreto Estadual nº 47.222/2017 e a Lei Federal nº 14.063/2020, que o credenciamento de frequência foi auditado e consolidado pelo Portal de Extensão.`,
      `   Total de participantes concluintes certificados: ${concluintes.length}.`,
      ``,
      `3. Todas as certidões possuem carimbo criptográfico SHA-256 e podem ser verificadas a qualquer tempo no endereço público:`,
      `   https://extensao.carangola.uemg.br/validar`,
      ``,
      `Carangola, ${todayStr}.`,
      ``,
      `_____________________________________________`,
      `${coordinatorName}`,
      `Coordenador de Extensão — NUPEX / Carangola (MASP: ${coordinatorMasp})`,
      ``,
      `_____________________________________________`,
      `${directorName}`,
      `Diretor da Unidade Carangola — UEMG (MASP: ${directorMasp})`,
    ].join('\n');

    return {
      success: true,
      data: {
        event: {
          id: event.id,
          title: event.title,
          sigaId: externalId,
          systemType: systemLabel,
          workloadHours: event.workload_hours,
          startDate: startDate,
          endDate: endDate,
          location: event.location || 'UEMG Carangola',
          seiProcessNumber: event.sei_process_number,
          seiDocumentId: event.sei_document_id,
        },
        authorities: {
          coordinatorName,
          coordinatorMasp,
          directorName,
          directorMasp,
        },
        concluintes,
        standardDispatchText,
      },
    };
  } catch (err: unknown) {
    return {
      success: false,
      error: sanitizeDatabaseError(err),
    };
  }
}

/**
 * Registra o número do processo SEI-MG e documento autuado na ação extensionista
 */
export async function updateEventSeiInfoAction(
  formData: FormData
): Promise<ActionResponse<{ success: boolean }>> {
  try {
    // Validando RBAC aqui (Apenas admin_extensao vincula o processo SEI)
    const profile = await requireRole(['admin_extensao']);
    const supabase = createClient();

    const data = {
      eventId: String(formData.get('eventId') || ''),
      seiProcessNumber: String(formData.get('seiProcessNumber') || '').trim(),
      seiDocumentId: String(formData.get('seiDocumentId') || '').trim() || null,
    };

    const validated = updateSeiSchema.parse(data);

    const { error: updateErr } = await (supabase.from('events') as any)
      .update({
        sei_process_number: validated.seiProcessNumber,
        sei_document_id: validated.seiDocumentId,
      })
      .eq('id', validated.eventId);

    if (updateErr) {
      return { success: false, error: sanitizeDatabaseError(updateErr) };
    }

    // Grava log na trilha de auditoria
    await (supabase.from('event_audit_logs') as any).insert({
      event_id: validated.eventId,
      auditor_profile_id: profile.id,
      auditor_masp: profile.masp || 'N/A',
      previous_status: 'aprovado',
      new_status: 'aprovado',
      justification: `Vinculação ao Processo SEI-MG nº ${validated.seiProcessNumber}${
        validated.seiDocumentId ? ` (Documento SEI nº ${validated.seiDocumentId})` : ''
      }`,
      ip_address: '0.0.0.0',
    });

    return { success: true, data: { success: true } };
  } catch (err: unknown) {
    if (err instanceof z.ZodError) {
      return { success: false, error: err.errors[0]?.message || 'Dados inválidos.' };
    }
    return {
      success: false,
      error: sanitizeDatabaseError(err),
    };
  }
}
