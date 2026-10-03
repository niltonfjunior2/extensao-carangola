'use client';

import React, { useState } from 'react';
import {
  FileText,
  Copy,
  Check,
  Printer,
  X,
  ExternalLink,
  ShieldCheck,
  Award,
  Send,
  AlertCircle,
} from 'lucide-react';
import type { SeiPackageData } from '@/app/actions/sei';
import { updateEventSeiInfoAction } from '@/app/actions/sei';
import { StatusAlert } from '@/components/ui/StatusAlert';
import { LoadingButton } from '@/components/ui/LoadingButton';

interface SeiProtocolPackageModalProps {
  isOpen: boolean;
  onClose: () => void;
  packageData: SeiPackageData;
  onSuccessUpdate?: () => void;
}

export function SeiProtocolPackageModal({
  isOpen,
  onClose,
  packageData,
  onSuccessUpdate,
}: SeiProtocolPackageModalProps) {
  const [copied, setCopied] = useState(false);
  const [seiProcessNumber, setSeiProcessNumber] = useState(
    packageData.event.seiProcessNumber || ''
  );
  const [seiDocumentId, setSeiDocumentId] = useState(
    packageData.event.seiDocumentId || ''
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(
    null
  );

  if (!isOpen) return null;

  const handleCopyDispatch = async () => {
    try {
      await navigator.clipboard.writeText(packageData.standardDispatchText);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch {
      // Fallback
    }
  };

  const handlePrintNominalList = () => {
    window.print();
  };

  const handleSaveSeiInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFeedback(null);

    const formData = new FormData();
    formData.append('eventId', packageData.event.id);
    formData.append('seiProcessNumber', seiProcessNumber);
    if (seiDocumentId) formData.append('seiDocumentId', seiDocumentId);

    const res = await updateEventSeiInfoAction(formData);
    setIsSubmitting(false);

    if (res.success) {
      setFeedback({
        type: 'success',
        message: 'Número do processo SEI-MG vinculado com sucesso à ação extensionista!',
      });
      if (onSuccessUpdate) onSuccessUpdate();
    } else {
      setFeedback({
        type: 'error',
        message: res.error || 'Não foi possível vincular o processo SEI.',
      });
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 print:p-0 print:bg-white print:static"
      role="dialog"
      aria-modal="true"
      aria-labelledby="sei-modal-title"
    >
      <div className="relative w-full max-w-4xl bg-white rounded-2xl shadow-elevation border border-slate-200 overflow-hidden flex flex-col max-h-[90vh] print:max-h-none print:shadow-none print:border-none">
        {/* Cabeçalho do Modal */}
        <div className="p-6 bg-gradient-to-r from-uemg-blue-900 to-uemg-blue-800 text-white flex items-center justify-between gap-4 print:hidden">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center border border-white/20">
              <FileText className="w-5 h-5 text-uemg-gold" aria-hidden="true" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-uemg-gold">
                Protocolo Estadual de Extensão
              </span>
              <h2 id="sei-modal-title" className="text-xl font-bold tracking-tight">
                Pacote de Protocolo SEI-MG (Air-Gapped)
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
            aria-label="Fechar janela"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        {/* Corpo do Modal com Scroll */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-slate-800 text-sm">
          {/* Informações da Ação */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Ação Extensionista Homologada
              </p>
              <h3 className="font-bold text-slate-900 text-base">{packageData.event.title}</h3>
              <p className="text-xs text-slate-600 mt-0.5">
                Registro: <strong className="font-mono">{packageData.event.systemType} nº {packageData.event.sigaId}</strong> • Carga Horária:{' '}
                <strong>{packageData.event.workloadHours} horas</strong>
              </p>
            </div>

            <div className="flex-shrink-0 text-right">
              <span className="inline-block px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold">
                {packageData.concluintes.length} Concluintes Certificados
              </span>
            </div>
          </div>

          {/* Seção 1: Minuta Padrão para o SEI-MG */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-slate-900 flex items-center gap-2 uppercase tracking-wide text-xs">
                <FileText className="w-4 h-4 text-uemg-blue-700" aria-hidden="true" />
                1. Minuta Padrão de Despacho para o SEI-MG
              </h4>
              <button
                onClick={handleCopyDispatch}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-uemg-blue-50 text-uemg-blue-700 hover:bg-uemg-blue-100 font-semibold text-xs border border-uemg-blue-200 transition-colors"
                title="Copiar texto para colar diretamente no editor do SEI-MG"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" aria-hidden="true" />
                    Copiado para a Área de Transferência!
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" aria-hidden="true" />
                    Copiar Minuta de Despacho
                  </>
                )}
              </button>
            </div>

            <pre className="p-4 bg-slate-900 text-slate-200 rounded-xl text-xs font-mono whitespace-pre-wrap leading-relaxed max-h-52 overflow-y-auto border border-slate-800 select-all">
              {packageData.standardDispatchText}
            </pre>
          </div>

          {/* Seção 2: Relação Nominal de Concluintes */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-slate-900 flex items-center gap-2 uppercase tracking-wide text-xs">
                <Award className="w-4 h-4 text-uemg-blue-700" aria-hidden="true" />
                2. Relação Nominal e Chaves Criptográficas SHA-256
              </h4>
              <button
                onClick={handlePrintNominalList}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 font-semibold text-xs border border-slate-300 transition-colors print:hidden"
              >
                <Printer className="w-3.5 h-3.5" aria-hidden="true" />
                Imprimir / PDF/A
              </button>
            </div>

            <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
              <div className="overflow-x-auto max-h-60 overflow-y-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 text-slate-700 font-semibold sticky top-0 border-b border-slate-200">
                    <tr>
                      <th className="p-2.5">Nome do Participante</th>
                      <th className="p-2.5">CPF (LGPD)</th>
                      <th className="p-2.5">Cód. Verificador</th>
                      <th className="p-2.5">Hash SHA-256</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {packageData.concluintes.length > 0 ? (
                      packageData.concluintes.map((c) => (
                        <tr key={c.registrationId} className="hover:bg-slate-50/80">
                          <td className="p-2.5 font-medium text-slate-900">{c.fullName}</td>
                          <td className="p-2.5 font-mono text-slate-600">{c.cpfMasked}</td>
                          <td className="p-2.5 font-mono font-bold text-uemg-blue-700">
                            {c.validationCode || 'Pendente'}
                          </td>
                          <td className="p-2.5 font-mono text-slate-500 text-[10px] truncate max-w-[140px]" title={c.sha256Hash || ''}>
                            {c.sha256Hash ? `${c.sha256Hash.slice(0, 16)}...` : 'N/A'}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={4} className="p-6 text-center text-slate-500">
                          Nenhum participante com presença confirmada até o momento.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Seção 3: Vinculação do Processo SEI Autuado */}
          <div className="border-t border-slate-200 pt-4 space-y-3 print:hidden">
            <h4 className="font-bold text-slate-900 flex items-center gap-2 uppercase tracking-wide text-xs">
              <ShieldCheck className="w-4 h-4 text-emerald-600" aria-hidden="true" />
              3. Vinculação Definitiva dos Autos do SEI-MG
            </h4>
            <p className="text-xs text-slate-600">
              Após autuar o processo no SEI-MG e anexar a lista nominal, informe abaixo o número do processo gerado para rastreabilidade jurídica permanente.
            </p>

            {feedback && (
              <StatusAlert
                type={feedback.type}
                message={feedback.message}
                onClose={() => setFeedback(null)}
              />
            )}

            <form onSubmit={handleSaveSeiInfo} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label htmlFor="sei-process" className="block text-xs font-semibold text-slate-700 mb-1">
                  Número do Processo SEI-MG *
                </label>
                <input
                  id="sei-process"
                  type="text"
                  required
                  value={seiProcessNumber}
                  onChange={(e) => setSeiProcessNumber(e.target.value)}
                  placeholder="Ex: 1234.01.0001234/2026-55"
                  className="w-full px-3.5 py-2 rounded-lg border border-slate-300 font-mono text-xs focus:ring-2 focus:ring-uemg-blue-600 outline-none"
                />
              </div>

              <div>
                <label htmlFor="sei-doc" className="block text-xs font-semibold text-slate-700 mb-1">
                  ID do Documento SEI (Opcional)
                </label>
                <input
                  id="sei-doc"
                  type="text"
                  value={seiDocumentId}
                  onChange={(e) => setSeiDocumentId(e.target.value)}
                  placeholder="Ex: 12345678"
                  className="w-full px-3.5 py-2 rounded-lg border border-slate-300 font-mono text-xs focus:ring-2 focus:ring-uemg-blue-600 outline-none"
                />
              </div>

              <div className="sm:col-span-3 flex justify-end pt-1">
                <LoadingButton
                  type="submit"
                  loading={isSubmitting}
                  className="px-5 py-2 text-xs"
                >
                  <Send className="w-3.5 h-3.5 mr-1.5" aria-hidden="true" />
                  Salvar Vinculação SEI
                </LoadingButton>
              </div>
            </form>
          </div>
        </div>

        {/* Rodapé do Modal */}
        <div className="p-4 bg-slate-100 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500 print:hidden">
          <span>Decreto Estadual nº 47.222/2017 • Processo Eletrônico MG</span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-white border border-slate-300 text-slate-700 font-semibold hover:bg-slate-50 transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}
