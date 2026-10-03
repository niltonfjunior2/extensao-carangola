import { createClient } from '@/lib/supabase/server';
import { requirePageAuth } from '@/lib/auth/rbac';
import { AuditReviewPanel } from './AuditReviewPanel';
import { ShieldCheck } from 'lucide-react';
import type { Event } from '@/types/database.types';

export const dynamic = 'force-dynamic';

export default async function AuditoriaGatePage() {
  const profile = await requirePageAuth(['admin_extensao']);

  const supabase = createClient();
  const [{ data: submitted }, { data: homologated }] = await Promise.all([
    (supabase.from('events') as any)
      .select('*')
      .eq('status', 'submetido')
      .order('created_at', { ascending: true }),
    (supabase.from('events') as any)
      .select('*')
      .in('status', ['aprovado', 'em_andamento', 'encerrado'])
      .order('created_at', { ascending: false }),
  ]);

  const submittedEvents = (submitted as Event[]) || [];
  const homologatedEvents = (homologated as Event[]) || [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Cabeçalho */}
      <div className="border-b border-slate-200 pb-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-uemg-blue-50 text-uemg-blue-700 text-xs font-semibold mb-2">
            <ShieldCheck className="w-3.5 h-3.5" />
            NUPEX • O "Gate" de Auditoria Institucional
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-uemg-blue-900 tracking-tight">
            Homologação de Propostas Extensionistas
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Conferência formal de espelhos oficiais contra a Intranet UEMG (SIGA, SUAP, etc.) para liberação de inscrições e emissão de certidões.
          </p>
        </div>

        <div className="text-right text-xs text-slate-500 bg-slate-100 p-2.5 rounded-lg border border-slate-200">
          <p className="font-semibold text-slate-800">{profile.full_name}</p>
          <p>Coordenação de Extensão • MASP: <span className="font-mono">{profile.masp || 'Não informado'}</span></p>
        </div>
      </div>

      <AuditReviewPanel events={submittedEvents} homologatedEvents={homologatedEvents} />
    </div>
  );
}
