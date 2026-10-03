'use server';

// Lógica de Segurança: Gestão de Mandatos das Autoridades Signatárias com RBAC Rígido
import { createClient } from '@/lib/supabase/server';
import { requireRole } from '@/lib/auth/rbac';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';

import { type ActionResponse } from '@/types/actions';
import { formatMASP, sanitizeDatabaseError } from '@/lib/utils';

const CreateMandateSchema = z.object({
  role: z.enum(['coordenador_extensao', 'diretor_unidade'], {
    errorMap: () => ({ message: 'Papel do mandato inválido.' }),
  }),
  authority_name: z.string().min(3, 'Nome da autoridade deve conter ao menos 3 caracteres.').trim(),
  masp: z.string().min(3, 'MASP institucional é obrigatório.').transform(formatMASP),
  official_act: z.string().min(5, 'Ato normativo (Portaria/Resolução) é obrigatório.').trim(),
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data de início deve estar no formato AAAA-MM-DD.'),
});

/**
 * Cria ou substitui o mandato ativo de uma autoridade signatária.
 * Apenas 'admin_extensao' tem permissão para executar.
 */
export async function createMandateAction(formData: FormData): Promise<ActionResponse> {
  // 1. Verificação Zero Trust de RBAC
  try {
    await requireRole(['admin_extensao']);
  } catch (err: any) {
    return { success: false, error: err.message };
  }

  // 2. Validação Esquematizada com Zod
  const rawData = {
    role: formData.get('role'),
    authority_name: formData.get('authority_name'),
    masp: formData.get('masp'),
    official_act: formData.get('official_act'),
    start_date: formData.get('start_date'),
  };

  const validation = CreateMandateSchema.safeParse(rawData);
  if (!validation.success) {
    return {
      success: false,
      error: validation.error.errors[0]?.message || 'Dados inválidos.',
    };
  }

  const { role, authority_name, masp, official_act, start_date } = validation.data;
  const supabase = createClient();

  try {
    // 3. Desativação do titular ativo anterior para o mesmo cargo
    const table = supabase.from('mandates') as any;
    await table
      .update({ is_active: false, end_date: start_date })
      .eq('role', role)
      .eq('is_active', true);

    // 4. Inserção da nova autoridade ativa
    const { error: insertError } = await table
      .insert({
        role,
        authority_name,
        masp,
        official_act,
        start_date,
        is_active: true,
      });

    if (insertError) {
      console.error('[Mandates Action Error]:', insertError.message);
      return { success: false, error: sanitizeDatabaseError(insertError) };
    }

    revalidatePath('/admin/mandatos');
    return { success: true };
  } catch (err: any) {
    console.error('[Mandates Action Exception]:', err);
    return { success: false, error: sanitizeDatabaseError(err) };
  }
}

/**
 * Encerra a vigência de um mandato sem cadastrar substituto imediato.
 */
export async function deactivateMandateAction(mandateId: string): Promise<ActionResponse> {
  try {
    await requireRole(['admin_extensao']);
  } catch (err: any) {
    return { success: false, error: err.message };
  }

  const supabase = createClient();
  const today = new Date().toISOString().split('T')[0];

  const table = supabase.from('mandates') as any;
  const { error } = await table
    .update({ is_active: false, end_date: today })
    .eq('id', mandateId);

  if (error) {
    return { success: false, error: 'Não foi possível encerrar a vigência do mandato.' };
  }

  revalidatePath('/admin/mandatos');
  return { success: true };
}
