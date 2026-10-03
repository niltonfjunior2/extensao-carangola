import { createClient } from '@/lib/supabase/server';
import { requirePageAuth } from '@/lib/auth/rbac';
import { ShieldCheck, Calendar, AlertTriangle } from 'lucide-react';
import { MandateForm } from './MandateForm';
import type { Mandate } from '@/types/database.types';
import { formatDisplayDate } from '@/lib/utils';
import { MANDATE_ROLE_LABELS } from '@/lib/constants';

export const dynamic = 'force-dynamic';

export default async function MandatosAdminPage() {
  // 1. Auditoria de Segurança Zero Trust no SSR
  const profile = await requirePageAuth(['admin_extensao']);

  const supabase = createClient();

  // 2. Consulta de mandatos
  const { data } = await supabase
    .from('mandates')
    .select('*')
    .order('is_active', { ascending: false })
    .order('start_date', { ascending: false });

  const mandates = (data as Mandate[]) || [];

  const activeCoordinator = mandates.find(
    (m) => m.role === 'coordenador_extensao' && m.is_active
  );
  const activeDirector = mandates.find(
    (m) => m.role === 'diretor_unidade' && m.is_active
  );
  const pastMandates = mandates.filter((m) => !m.is_active);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      {/* Cabeçalho da Página */}
      <div className="border-b border-slate-200 pb-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-uemg-blue-50 text-uemg-blue-700 text-xs font-semibold mb-2">
            <ShieldCheck className="w-3.5 h-3.5" />
            Governança Institucional UEMG Carangola
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-uemg-blue-900 tracking-tight">
            Mandatos das Autoridades Signatárias
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Gestão temporal dos titulares responsáveis pela Chancela Tipográfica Eletrônica das certidões oficiais.
          </p>
        </div>

        <div className="text-right text-xs text-slate-500 bg-slate-100 p-2.5 rounded-lg border border-slate-200">
          <p className="font-semibold text-slate-800">{profile.full_name}</p>
          <p>
            Perfil: <span className="text-uemg-blue-700 uppercase font-mono font-semibold">{profile.role}</span>
          </p>
        </div>
      </div>

      {/* Alerta de Soberania Jurídica e Imutabilidade */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 sm:p-5 flex items-start gap-4">
        <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
        <div className="text-xs sm:text-sm text-amber-800 space-y-1">
          <p className="font-bold">Regra de Segurança & Fé Pública (Decreto nº 47.222/2017)</p>
          <p>
            A posse de um novo titular ativa a chancela tipográfica para as <strong>futuras certidões</strong>. Os certificados expedidos em gestões anteriores preservam permanentemente o snapshot histórico das autoridades em exercício no momento de sua emissão.
          </p>
        </div>
      </div>

      {/* Quadro de Autoridades Ativas no Exercício do Cargo */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Coordenador de Extensão */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-soft p-6 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-uemg-blue-700 bg-uemg-blue-50 px-2.5 py-1 rounded">
              {MANDATE_ROLE_LABELS.coordenador_extensao}
            </span>
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              Titular Ativo
            </span>
          </div>

          {activeCoordinator ? (
            <div className="space-y-2">
              <h3 className="text-lg font-bold text-slate-900">{activeCoordinator.authority_name}</h3>
              <p className="text-xs text-slate-600">
                <strong>MASP:</strong> {activeCoordinator.masp}
              </p>
              <p className="text-xs text-slate-600">
                <strong>Ato de Designação:</strong> {activeCoordinator.official_act}
              </p>
              <p className="text-xs text-slate-500 flex items-center gap-1.5 pt-1">
                <Calendar className="w-3.5 h-3.5" />
                Em exercício desde: {formatDisplayDate(activeCoordinator.start_date)}
              </p>
            </div>
          ) : (
            <p className="text-sm text-slate-500 italic">Nenhum coordenador de extensão cadastrado como ativo.</p>
          )}
        </div>

        {/* Diretor da Unidade */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-soft p-6 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-uemg-blue-700 bg-uemg-blue-50 px-2.5 py-1 rounded">
              {MANDATE_ROLE_LABELS.diretor_unidade}
            </span>
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              Titular Ativo
            </span>
          </div>

          {activeDirector ? (
            <div className="space-y-2">
              <h3 className="text-lg font-bold text-slate-900">{activeDirector.authority_name}</h3>
              <p className="text-xs text-slate-600">
                <strong>MASP:</strong> {activeDirector.masp}
              </p>
              <p className="text-xs text-slate-600">
                <strong>Ato de Designação:</strong> {activeDirector.official_act}
              </p>
              <p className="text-xs text-slate-500 flex items-center gap-1.5 pt-1">
                <Calendar className="w-3.5 h-3.5" />
                Em exercício desde: {formatDisplayDate(activeDirector.start_date)}
              </p>
            </div>
          ) : (
            <p className="text-sm text-slate-500 italic">Nenhum diretor da unidade cadastrado como ativo.</p>
          )}
        </div>
      </div>

      {/* Formulário Interativo de Posse */}
      <MandateForm />

      {/* Histórico de Mandatos Anteriores */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-soft overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200">
          <h2 className="text-base font-bold text-slate-900">
            Histórico de Autoridades e Gestões Anteriores
          </h2>
          <p className="text-xs text-slate-500">
            Cadeia de custódia preservada para auditorias e validações de certidões históricas.
          </p>
        </div>

        {pastMandates.length > 0 ? (
          <div className="divide-y divide-slate-200 text-xs sm:text-sm">
            {pastMandates.map((m) => (
              <div key={m.id} className="p-4 sm:px-6 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <span className="font-semibold text-slate-900">{m.authority_name}</span>
                  <span className="text-slate-500 ml-2">
                    ({MANDATE_ROLE_LABELS[m.role]})
                  </span>
                  <p className="text-slate-500 text-xs mt-0.5">
                    MASP: {m.masp} • {m.official_act}
                  </p>
                </div>
                <div className="text-slate-500 text-xs">
                  {formatDisplayDate(m.start_date)} até {formatDisplayDate(m.end_date)}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center text-xs text-slate-500">
            Nenhum mandato histórico arquivado até o momento.
          </div>
        )}
      </div>
    </div>
  );
}
