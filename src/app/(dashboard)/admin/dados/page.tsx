import { createClient } from '@/lib/supabase/server';
import { requirePageAuth } from '@/lib/auth/rbac';
import { ShieldCheck } from 'lucide-react';
import { BackupControlPanel } from './BackupControlPanel';

export const dynamic = 'force-dynamic';

export default async function DadosAdminPage() {
  // 1. Auditoria de Segurança Zero Trust no Servidor
  const profile = await requirePageAuth(['admin_extensao']);

  const supabase = createClient();

  // 2. Busca histórico recente de backups gravados
  const { data: backups } = await (supabase.from('system_backups') as any)
    .select('id, created_at, checksum_sha256, total_records, backup_type')
    .order('created_at', { ascending: false })
    .limit(15);

  const recentBackups = backups || [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      {/* Cabeçalho da Página */}
      <div className="border-b border-slate-200 pb-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-uemg-blue-50 text-uemg-blue-700 text-xs font-semibold mb-2">
            <ShieldCheck className="w-3.5 h-3.5" aria-hidden="true" />
            Soberania Digital & Custódia Perpétua
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-uemg-blue-900 tracking-tight">
            Gestão de Dados, Cold Ledger & Backups
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Ferramentas de custódia, exportação de livro-razão estático independente e verificação de integridade criptográfica.
          </p>
        </div>

        <div className="text-right text-xs text-slate-500 bg-slate-100 p-2.5 rounded-lg border border-slate-200">
          <p className="font-semibold text-slate-800">{profile.full_name}</p>
          <p>
            Perfil: <span className="text-uemg-blue-700 uppercase font-mono font-semibold">{profile.role}</span>
          </p>
        </div>
      </div>

      <BackupControlPanel recentBackups={recentBackups} />
    </div>
  );
}
