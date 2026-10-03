'use server';

// Lógica de Segurança: Inscrição pública em ações homologadas com geração de credencial Ed25519
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { validateCPF, maskCPF, sanitizeDatabaseError } from '@/lib/utils';
import { signCredential, type SignedCredential } from '@/lib/crypto/ed25519';
import type { ActionResponse } from '@/types/actions';

const registrationSchema = z.object({
  eventId: z.string().uuid('ID do evento inválido.'),
  participantName: z
    .string()
    .min(3, 'O nome deve ter ao menos 3 caracteres.')
    .max(150, 'Nome muito extenso.'),
  participantEmail: z
    .string()
    .email('E-mail institucional ou pessoal inválido.')
    .toLowerCase()
    .trim(),
  participantCpf: z
    .string()
    .refine((val) => validateCPF(val), {
      message: 'CPF inválido. Verifique os dígitos digitados.',
    }),
  lgpdAccepted: z.literal(true, {
    errorMap: () => ({ message: 'Você deve aceitar a política de tratamento de dados LGPD.' }),
  }),
});

export interface RegistrationResult {
  registrationId: string;
  eventId: string;
  signedCredential: SignedCredential;
}

export async function registerParticipantAction(
  formData: FormData
): Promise<ActionResponse<RegistrationResult>> {
  try {
    const rawCpf = String(formData.get('participantCpf') || '').replace(/\D/g, '');
    const data = {
      eventId: String(formData.get('eventId') || ''),
      participantName: String(formData.get('participantName') || '').trim(),
      participantEmail: String(formData.get('participantEmail') || '').trim(),
      participantCpf: rawCpf,
      lgpdAccepted: formData.get('lgpdAccepted') === 'true',
    };

    const validated = registrationSchema.parse(data);
    const supabase = createClient();

    // 1. Confere se a ação extensionista está homologada e apta a receber inscrições
    const { data: event, error: eventErr } = await (supabase.from('events') as any)
      .select('id, title, status')
      .eq('id', validated.eventId)
      .single();

    if (eventErr || !event) {
      return { success: false, error: 'Ação extensionista não localizada no sistema.' };
    }

    if (!['aprovado', 'em_andamento'].includes(event.status)) {
      return {
        success: false,
        error: 'Esta ação extensionista não está aberta para inscrições públicas no momento.',
      };
    }

    // 2. Insere a inscrição (RLS permite inserção pública em eventos aprovados)
    const { data: newReg, error: insertErr } = await (supabase.from('registrations') as any)
      .insert({
        event_id: validated.eventId,
        participant_name: validated.participantName,
        participant_email: validated.participantEmail,
        participant_cpf: validated.participantCpf,
        attended: false,
      })
      .select('id, created_at')
      .single();

    if (insertErr || !newReg) {
      return { success: false, error: sanitizeDatabaseError(insertErr) };
    }

    // 3. Emissão da credencial com assinatura assimétrica Ed25519
    const timestamp = Math.floor(new Date(newReg.created_at).getTime() / 1000);
    const signedCred = signCredential({
      reg_id: newReg.id,
      event_id: validated.eventId,
      name: validated.participantName,
      cpf_masked: maskCPF(validated.participantCpf),
      ts: timestamp,
    });

    return {
      success: true,
      data: {
        registrationId: newReg.id,
        eventId: validated.eventId,
        signedCredential: signedCred,
      },
    };
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return { success: false, error: err.errors[0]?.message || 'Dados de inscrição inválidos.' };
    }
    return { success: false, error: sanitizeDatabaseError(err) };
  }
}

/**
 * Consulta a credencial emitida para renderização pública
 */
export async function getRegistrationCredentialAction(
  registrationId: string
): Promise<ActionResponse<RegistrationResult>> {
  try {
    const supabase = createClient();

    const { data: reg, error: regErr } = await (supabase.from('registrations') as any)
      .select('id, event_id, participant_name, participant_cpf, created_at')
      .eq('id', registrationId)
      .single();

    if (regErr || !reg) {
      return { success: false, error: 'Credencial não encontrada ou inválida.' };
    }

    const timestamp = Math.floor(new Date(reg.created_at).getTime() / 1000);
    const signedCred = signCredential({
      reg_id: reg.id,
      event_id: reg.event_id,
      name: reg.participant_name,
      cpf_masked: maskCPF(reg.participant_cpf),
      ts: timestamp,
    });

    return {
      success: true,
      data: {
        registrationId: reg.id,
        eventId: reg.event_id,
        signedCredential: signedCred,
      },
    };
  } catch (err: any) {
    return { success: false, error: sanitizeDatabaseError(err) };
  }
}
