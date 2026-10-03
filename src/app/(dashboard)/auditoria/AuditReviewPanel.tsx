'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { auditEventAction, getSignedMirrorUrlAction } from '@/app/actions/events';
import { getSeiPackageDataAction, type SeiPackageData } from '@/app/actions/sei';
import { SeiProtocolPackageModal } from '@/components/sei/SeiProtocolPackageModal';
import { ACADEMIC_SYSTEM_LABELS } from '@/lib/constants';
import { formatDisplayDate } from '@/lib/utils';
import { StatusAlert } from '@/components/ui/StatusAlert';
import { LoadingButton } from '@/components/ui/LoadingButton';
import type { Event } from '@/types/database.types';
import {
  ShieldCheck,
  FileText,
  CheckCircle2,
  XCircle,
  ExternalLink,
  Loader2,
  Building,
  Award,
} from 'lucide-react';

interface AuditReviewPanelProps {
  events: (Event & { coordinator?: { full_name: string; email: string; masp: string | null } })[];
  homologatedEvents?: Event[];
}

export function AuditReviewPanel({ events, homologatedEvents = [] }: AuditReviewPanelProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'pendentes' | 'homologados'>('pendentes');
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [justification, setJustification] = useState('');
  const [isPending, startTransition] = useTransition();
  const [statusMessage, setStatusMessage] = useState<{ type: 'error' | 'success'; text: string } | null>(null);
  const [signedPdfUrl, setSignedPdfUrl] = useState<string | null>(null);
  const [loadingPdf, setLoadingPdf] = useState(false);

  // Estados do Modal SEI
  const [seiPackage, setSeiPackage] = useState<SeiPackageData | null>(null);
  const [isSeiModalOpen, setIsSeiModalOpen] = useState(false);
  const [loadingSei, setLoadingSei] = useState(false);

  const handleOpenReview = async (evt: Event) => {
    setSelectedEvent(evt);
    setJustification('');
    setStatusMessage(null);
    setSignedPdfUrl(null);

    // Gera URL assinada temporária para visualização do PDF no modal
    if (evt.external_mirror_pdf_url) {
      setLoadingPdf(true);
      const res = await getSignedMirrorUrlAction(evt.external_mirror_pdf_url);
      setLoadingPdf(false);
      if (res.success && res.data) {
        setSignedPdfUrl(res.data);
      }
    }
  };

  const handleOpenSeiModal = async (evt: Event) => {
    setLoadingSei(true);
    setStatusMessage(null);
    const res = await getSeiPackageDataAction(evt.id);
    setLoadingSei(false);

    if (res.success && res.data) {
      setSeiPackage(res.data);
      setIsSeiModalOpen(true);
    } else {
      setStatusMessage({
        type: 'error',
        text: res.error || 'Não foi possível carregar os dados do Pacote SEI.',
      });
    }
  };

  const handleDecision = (decision: 'aprovar' | 'rejeitar') => {
    if (!selectedEvent) return;
    setStatusMessage(null);

    if (decision === 'rejeitar' && justification.trim().length < 5) {
      setStatusMessage({
        type: 'error',
        text: 'A justificativa técnica de recusa é obrigatória (ao menos 5 caracteres).',
      });
      return;
    }

    const formData = new FormData();
    formData.set('eventId', selectedEvent.id);
    formData.set('decision', decision);
    if (justification) {
      formData.set('justification', justification);
    }

    startTransition(async () => {
      const res = await auditEventAction(formData);
      if (res.success) {
        setStatusMessage({
          type: 'success',
          text: `Ação ${decision === 'aprovar' ? 'homologada' : 'recusada'} com sucesso! O histórico foi registrado.`,
        });
        setSelectedEvent(null);
        router.refresh();
      } else {
        setStatusMessage({
          type: 'error',
          text: res.error || 'Falha ao registrar decisão de auditoria.',
        });
      }
    });
  };

  return (
    <div className="space-y-6">
      {statusMessage && (
        <StatusAlert
          type={statusMessage.type}
          message={statusMessage.text}
          onClose={() => setStatusMessage(null)}
        />
      )}

      {/* Navegação por Abas */}
      <div className="flex items-center gap-3 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('pendentes')}
          className={`px-4 py-2 rounded-lg font-bold text-xs transition-colors flex items-center gap-2 ${
            activeTab === 'pendentes'
              ? 'bg-uemg-blue-700 text-white shadow-sm'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          <span>Fila de Análise ({events.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('homologados')}
          className={`px-4 py-2 rounded-lg font-bold text-xs transition-colors flex items-center gap-2 ${
            activeTab === 'homologados'
              ? 'bg-uemg-blue-700 text-white shadow-sm'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          <Award className="w-3.5 h-3.5" aria-hidden="true" />
          <span>Ações Homologadas & Pacotes SEI ({homologatedEvents.length})</span>
        </button>
      </div>

      {/* Conteúdo da Aba Pendentes */}
      {activeTab === 'pendentes' && (
        <>
          {events.length > 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-soft overflow-hidden">
              <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
                  Propostas Submetidas pelos Docentes
                </span>
                <span className="text-xs text-slate-500 font-medium">
                  {events.length} aguardando análise
                </span>
              </div>

              <div className="divide-y divide-slate-100">
                {events.map((evt) => (
                  <div key={evt.id} className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/50 transition-colors">
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800">
                          Aguardando Homologação
                        </span>
                        <span className="text-xs font-mono text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                          {ACADEMIC_SYSTEM_LABELS[evt.registry_system] || evt.registry_system}:{' '}
                          <strong>{evt.external_registry_id}</strong>
                        </span>
                        <span className="text-xs text-slate-400">
                          Submetido em: {formatDisplayDate(evt.created_at)}
                        </span>
                      </div>

                      <h3 className="text-base font-bold text-slate-900">{evt.title}</h3>

                      <div className="flex items-center gap-4 text-xs text-slate-500">
                        <span>Carga Horária: {evt.workload_hours}h</span>
                        <span>•</span>
                        <span>Modalidade: {evt.modality}</span>
                        <span>•</span>
                        <span className="font-mono text-[11px] text-slate-400">
                          SHA-256: {evt.external_mirror_sha256?.slice(0, 12)}...
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => handleOpenReview(evt)}
                        className="px-4 py-2 rounded-lg bg-uemg-blue-700 hover:bg-uemg-blue-800 text-white font-semibold text-xs shadow-sm transition-colors flex items-center gap-2"
                      >
                        <ShieldCheck className="w-4 h-4" aria-hidden="true" />
                        Auditar Conformidade
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-slate-200 p-12 text-center space-y-3">
              <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" aria-hidden="true" />
              <h3 className="text-base font-bold text-slate-900">Fila de Auditoria Limpa</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Não existem propostas de extensão pendentes de conferência pela Coordenação no momento.
              </p>
            </div>
          )}
        </>
      )}

      {/* Conteúdo da Aba Homologados (com Pacote SEI) */}
      {activeTab === 'homologados' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-soft overflow-hidden">
          <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
              Ações Extensionistas Homologadas pelo NUPEX
            </span>
            <span className="text-xs text-slate-500 font-medium">
              {homologatedEvents.length} ações homologadas
            </span>
          </div>

          <div className="divide-y divide-slate-100">
            {homologatedEvents.length > 0 ? (
              homologatedEvents.map((evt) => (
                <div key={evt.id} className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/50 transition-colors">
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                        {evt.status}
                      </span>
                      <span className="text-xs font-mono text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                        {ACADEMIC_SYSTEM_LABELS[evt.registry_system] || evt.registry_system}:{' '}
                        <strong>{evt.external_registry_id || evt.siga_id}</strong>
                      </span>
                      {evt.sei_process_number && (
                        <span className="text-xs font-mono text-uemg-blue-800 bg-uemg-blue-50 px-2 py-0.5 rounded font-semibold border border-uemg-blue-200">
                          SEI: {evt.sei_process_number}
                        </span>
                      )}
                    </div>

                    <h3 className="text-base font-bold text-slate-900">{evt.title}</h3>
                    <p className="text-xs text-slate-500">
                      Carga Horária: {evt.workload_hours}h • Registrado em: {formatDisplayDate(evt.created_at)}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={loadingSei}
                      onClick={() => handleOpenSeiModal(evt)}
                      className="px-4 py-2 rounded-lg bg-uemg-blue-700 hover:bg-uemg-blue-800 text-white font-semibold text-xs shadow-sm transition-colors flex items-center gap-2 disabled:opacity-50"
                    >
                      <FileText className="w-4 h-4" aria-hidden="true" />
                      Gerar Pacote SEI
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-12 text-center text-slate-500 text-xs">
                Nenhuma ação extensionista homologada encontrada.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal Lateral de Auditoria de Proposta */}
      {selectedEvent && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto p-6 sm:p-8 space-y-6">
            <div className="flex items-start justify-between border-b border-slate-200 pb-4">
              <div>
                <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-uemg-blue-700 uppercase tracking-wider mb-1">
                  <ShieldCheck className="w-4 h-4" aria-hidden="true" />
                  Conferência do Gate de Auditoria NUPEX
                </div>
                <h2 className="text-xl font-bold text-slate-900">{selectedEvent.title}</h2>
              </div>
              <button
                type="button"
                onClick={() => setSelectedEvent(null)}
                className="text-slate-400 hover:text-slate-600 text-xl font-bold px-2"
                aria-label="Fechar janela"
              >
                ✕
              </button>
            </div>

            {/* Comparativo de Dados */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div className="space-y-1">
                <p className="font-bold text-slate-800 text-sm">Metadados Cadastrados no Portal:</p>
                <p><strong>Plataforma:</strong> {ACADEMIC_SYSTEM_LABELS[selectedEvent.registry_system] || selectedEvent.registry_system}</p>
                <p><strong>Código de Registro:</strong> <span className="font-mono font-bold text-uemg-blue-700">{selectedEvent.external_registry_id}</span></p>
                <p><strong>Carga Horária:</strong> {selectedEvent.workload_hours} horas</p>
                <p><strong>Modalidade:</strong> {selectedEvent.modality}</p>
                <p><strong>Local:</strong> {selectedEvent.location}</p>
              </div>

              <div className="space-y-2">
                <p className="font-bold text-slate-800 text-sm">Integridade Criptográfica do Espelho:</p>
                <p className="font-mono break-all text-[11px] text-slate-600 bg-white p-2 rounded border">
                  SHA-256: {selectedEvent.external_mirror_sha256}
                </p>
                <p className="text-slate-500 text-[11px]">
                  Aceite Legal Art. 299 registrado em {formatDisplayDate(selectedEvent.legal_accepted_at)} (IP: {selectedEvent.legal_accepted_ip})
                </p>

                {loadingPdf ? (
                  <div className="flex items-center gap-2 text-slate-500 pt-2">
                    <Loader2 className="w-4 h-4 animate-spin text-uemg-blue-700" aria-hidden="true" />
                    <span>Carregando documento seguro...</span>
                  </div>
                ) : signedPdfUrl ? (
                  <a
                    href={signedPdfUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 mt-2 px-3 py-1.5 rounded bg-uemg-blue-50 text-uemg-blue-700 hover:bg-uemg-blue-100 font-semibold transition-colors"
                  >
                    <FileText className="w-4 h-4" aria-hidden="true" />
                    Abrir Espelho em PDF em Nova Aba
                    <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
                  </a>
                ) : (
                  <p className="text-red-600 pt-1">Espelho em PDF indisponível no storage.</p>
                )}
              </div>
            </div>

            {/* Campo de Justificativa para Recusa */}
            <div>
              <label htmlFor="justification" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Parecer da Coordenação / Justificativa (Obrigatória em caso de recusa)
              </label>
              <textarea
                id="justification"
                rows={3}
                value={justification}
                onChange={(e) => setJustification(e.target.value)}
                placeholder="Insira observações formais ou aponte eventuais divergências no espelho apresentado..."
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-xs text-slate-900 focus:ring-2 focus:ring-uemg-blue-600 outline-none"
              />
            </div>

            {/* Botões de Ação da Coordenação */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
              <button
                type="button"
                disabled={isPending}
                onClick={() => handleDecision('rejeitar')}
                className="px-5 py-2.5 rounded-lg bg-red-50 hover:bg-red-100 disabled:opacity-50 text-red-700 font-semibold text-xs transition-colors flex items-center gap-2"
              >
                <XCircle className="w-4 h-4" aria-hidden="true" />
                Recusar e Devolver ao Docente
              </button>

              <LoadingButton
                type="button"
                loading={isPending}
                loadingText="Gravando Log de Auditoria..."
                onClick={() => handleDecision('aprovar')}
                className="px-6 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-xs shadow-md"
              >
                <CheckCircle2 className="w-4 h-4 mr-2" aria-hidden="true" />
                Confirmar Conformidade e Homologar Ação
              </LoadingButton>
            </div>
          </div>
        </div>
      )}

      {/* Modal do Pacote SEI-MG */}
      {isSeiModalOpen && seiPackage && (
        <SeiProtocolPackageModal
          isOpen={isSeiModalOpen}
          packageData={seiPackage}
          onClose={() => setIsSeiModalOpen(false)}
          onSuccessUpdate={() => router.refresh()}
        />
      )}
    </div>
  );
}
