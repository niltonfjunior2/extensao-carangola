import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import type { UserRole } from '@/types/database.types';

export interface UserProfile {
  id: string;
  cpf: string;
  full_name: string;
  email: string;
  masp: string | null;
  role: UserRole;
}

/**
 * Obtém o perfil completo do usuário autenticado no servidor.
 * Retorna null se não autenticado ou perfil não encontrado.
 */
export async function getCurrentProfile(): Promise<UserProfile | null> {
  const supabase = createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return null;
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id, cpf, full_name, email, masp, role')
    .eq('id', user.id)
    .single();

  if (profileError || !profile) {
    return null;
  }

  return profile as UserProfile;
}

/**
 * Garante que o usuário está autenticado e possui um dos papéis autorizados.
 * Lança exceção de segurança se o acesso for negado.
 */
export async function requireRole(allowedRoles: UserRole[]): Promise<UserProfile> {
  const profile = await getCurrentProfile();

  if (!profile) {
    throw new Error('Sessão expirada ou usuário não autenticado.');
  }

  if (!allowedRoles.includes(profile.role)) {
    throw new Error(`Acesso negado: Perfil '${profile.role}' não autorizado a realizar esta operação.`);
  }

  return profile;
}

/**
 * Garante apenas que existe uma sessão ativa (qualquer papel).
 */
export async function requireAuth(): Promise<UserProfile> {
  return requireRole(['participante', 'monitor', 'docente', 'admin_extensao']);
}

/**
 * Guardião declarativo para Server Components (Páginas SSR).
 * Redireciona imediatamente para /login?denied=true se o usuário não estiver autenticado
 * ou não possuir um dos papéis autorizados.
 * Retorna o UserProfile garantido com tipagem estrita (sem retorno null).
 */
export async function requirePageAuth(allowedRoles?: UserRole[]): Promise<UserProfile> {
  const profile = await getCurrentProfile();

  if (!profile) {
    redirect('/login?denied=true');
  }

  if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(profile.role)) {
    redirect('/login?denied=true');
  }

  return profile;
}
