import { createClient } from '@/lib/supabase/server';
import { requirePageAuth } from '@/lib/auth/rbac';
import Link from 'next/link';
import { PlusCircle, BookOpen, Clock, MapPin, Building, ShieldCheck, AlertCircle } from 'lucide-react';
import { EVENT_STATUS_LABELS, ACADEMIC_SYSTEM_LABELS } from '@/lib/constants';
import { formatDisplayDate } from '@/lib/utils';
import type { Event } from '@/types/database.types';

export const dynamic = 'force-dynamic';

export default async function DocenteDashboardPage() {
  const profile = await requirePageAuth(['docente', 'admin_extensao']);

  const supabase = createClient();
  const { data } = await (supabase.from('events') as any)
    .select('*')
    .eq('coordinator_id', profile.id)
    .order('created_at', { ascending: false });

  const events = (data as Event[]) || [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Cabeçalho */}
      <div className="border-b border-slate-200 pb-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-uemg-blue-50 text-uemg-blue-700 text-xs font-semibold mb-2">
            <BookOpen className="w-3.5 h-3.5" />
            Painel do Docente Proponente
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-uemg-blue-900 tracking-tight">
            Minhas Ações Extensionistas
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Acompanhe o status de auditoria e homologação de suas propostas na UEMG Carangola.
          </p>
        </div>

        <Link
          href="/docente/nova-acao"
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-uemg-blue-700 hover:bg-uemg-blue-800 text-white font-semibold text-sm shadow-sm transition-colors"
        >
          <PlusCircle className="w-4 h-4" />
          Submeter Nova Ação
        </Link>
      </div>

      {/* Lista de Ações */}
      {events.length > 0 ? (
        <div className="grid grid-cols-1 gap-6">
          {events.map((evt) => {
            const statusConfig = EVENT_STATUS_LABELS[evt.status] || {
              label: evt.status,
              color: 'bg-slate-100 text-slate-800',
            };

            return (
              <div
                key={evt.id}
                className="bg-white rounded-xl border border-slate-200 shadow-soft p-6 space-y-4 hover:border-slate-300 transition-colors"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className={`text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-full ${statusConfig.color}`}
                    >
                      {statusConfig.label}
                    </span>
                    <span className="text-xs font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                      {ACADEMIC_SYSTEM_LABELS[evt.registry_system] || evt.registry_system}:{' '}
                      <strong>{evt.external_registry_id}</strong>
                    </span>
                  </div>
                  <span className="text-xs text-slate-400">
                    Submetido em: {formatDisplayDate(evt.created_at)}
                  </span>
                </div>

                <div>
                  <h2 className="text-lg font-bold text-slate-900 leading-snug">{evt.title}</h2>
                  {evt.description && (
                    <p className="text-sm text-slate-600 mt-1.5 line-clamp-2">{evt.description}</p>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 border-t border-slate-100 pt-3">
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    Carga Horária: {evt.workload_hours}h
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    Local: {evt.location || 'Não informado'}
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    Termo Art. 299: Aceito
                  </span>
                </div>

                {evt.status === 'rejeitado' && (
                  <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700 flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-600 mt-0.5" />
                    <div>
                      <p className="font-bold">Pendência apontada pela Coordenação:</p>
                      <p>Verifique as observações no parecer e ajuste as informações do espelho oficial.</p>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center space-y-4">
          <BookOpen className="w-12 h-12 text-slate-300 mx-auto" />
          <div className="space-y-1">
            <h3 className="text-base font-bold text-slate-800">Nenhuma ação extensionista cadastrada</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Você ainda não submeteu propostas para homologação no portal da UEMG Carangola.
            </p>
          </div>
          <Link
            href="/docente/nova-acao"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-uemg-blue-700 text-white text-xs font-semibold hover:bg-uemg-blue-800 transition-colors shadow-sm"
          >
            <PlusCircle className="w-4 h-4" />
            Cadastrar Minha Primeira Ação
          </Link>
        </div>
      )}
    </div>
  );
}
