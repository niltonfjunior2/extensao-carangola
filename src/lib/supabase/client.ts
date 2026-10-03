// Lógica de Segurança: Cliente de navegador singleton utilizando estritamente a chave pública anon.
// Nenhuma chave com privilégios de service_role é importada aqui.
import { createBrowserClient } from '@supabase/ssr';
import type { Database } from '@/types/database.types';

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('As variáveis de ambiente do Supabase não estão configuradas.');
  }

  return createBrowserClient<Database>(supabaseUrl, supabaseAnonKey);
}
