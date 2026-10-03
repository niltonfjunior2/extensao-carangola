'use server';

// Lógica de Segurança: Server Actions de Autenticação Segura
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { type ActionResponse } from '@/types/actions';

const LoginSchema = z.object({
  email: z.string().email('Por favor, insira um e-mail válido.').trim().toLowerCase(),
  password: z.string().min(6, 'A senha deve conter no mínimo 6 caracteres.'),
});

export async function loginAction(formData: FormData): Promise<ActionResponse> {
  const rawEmail = formData.get('email');
  const rawPassword = formData.get('password');

  const validation = LoginSchema.safeParse({
    email: rawEmail,
    password: rawPassword,
  });

  if (!validation.success) {
    return {
      success: false,
      error: validation.error.errors[0]?.message || 'Credenciais inválidas.',
    };
  }

  const { email, password } = validation.data;
  const supabase = createClient();

  const { error: signInError } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (signInError) {
    console.error('[Auth Error - Login]:', signInError.message);
    return {
      success: false,
      error: 'E-mail ou senha incorretos. Verifique suas credenciais.',
    };
  }

  revalidatePath('/', 'layout');
  return { success: true };
}

export async function logoutAction(): Promise<void> {
  const supabase = createClient();
  await supabase.auth.signOut();
  revalidatePath('/', 'layout');
  redirect('/login');
}
