'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { createEventAction } from '@/app/actions/events';
import { ACADEMIC_SYSTEM_LABELS } from '@/lib/constants';
import type { AcademicSystemType } from '@/types/database.types';
import { StatusAlert } from '@/components/ui/StatusAlert';
import { LoadingButton } from '@/components/ui/LoadingButton';
import {
  Upload,
  Calendar,
  FileCheck,
  AlertTriangle,
  Plus,
  Trash2,
  CheckCircle2,
  Building,
} from 'lucide-react';

interface SessionItem {
  id: string;
  title: string;
  start_time: string;
  end_time: string;
  workload: number;
}

export function NewEventForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [termAccepted, setTermAccepted] = useState(false);
  const [status, setStatus] = useState<{ type: 'error' | 'success'; message: string } | null>(null);

  // Sessões dinâmicas
  const [sessions, setSessions] = useState<SessionItem[]>([
    {
      id: 'session-1',
      title: 'Sessão de Abertura / Apresentação',
      start_time: '',
      end_time: '',
      workload: 4,
    },
  ]);

  const addSession = () => {
    setSessions((prev) => [
      ...prev,
      {
        id: `session-${Date.now()}`,
        title: `Sessão ${prev.length + 1}`,
        start_time: '',
        end_time: '',
        workload: 2,
      },
    ]);
  };

  const removeSession = (id: string) => {
    if (sessions.length <= 1) return;
    setSessions((prev) => prev.filter((s) => s.id !== id));
  };

  const updateSession = <K extends keyof SessionItem>(
    id: string,
    field: K,
    value: SessionItem[K]
  ) => {
    setSessions((prev) =>
      prev.map((s) => (s.id === id ? { ...s, [field]: value } : s))
    );
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type !== 'application/pdf') {
        setStatus({
          type: 'error',
          message: 'Formato inválido. O arquivo do espelho deve ser estritamente em PDF.',
        });
        setSelectedFile(null);
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        setStatus({
          type: 'error',
          message: 'Tamanho excedido. O arquivo não pode ser maior que 10 MB.',
        });
        setSelectedFile(null);
        return;
      }
      setStatus(null);
      setSelectedFile(file);
    }
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setStatus(null);

    if (!selectedFile) {
      setStatus({
        type: 'error',
        message: 'Por favor, anexe o arquivo PDF do Espelho Oficial de Aprovação.',
      });
      return;
    }

    if (!termAccepted) {
      setStatus({
        type: 'error',
        message: 'Você deve aceitar expressamente o Termo de Responsabilidade Administrativa (Art. 299).',
      });
      return;
    }

    const formData = new FormData(e.currentTarget);
    formData.set('legal_responsibility_accepted', 'true');
    formData.set('sessions_json', JSON.stringify(sessions));

    startTransition(async () => {
      const result = await createEventAction(formData);
      if (!result.success) {
        setStatus({ type: 'error', message: result.error || 'Falha ao submeter proposta.' });
      } else {
        setStatus({
          type: 'success',
          message: 'Proposta submetida com sucesso! Redirecionando para o painel...',
        });
        setTimeout(() => {
          router.push('/docente');
          router.refresh();
        }, 1500);
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {status && <StatusAlert type={status.type} message={status.message} />}

      {/* Bloco 1: Dados Principais & Sistema Institucional */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-soft p-6 sm:p-8 space-y-6">
        <div className="border-b border-slate-200 pb-3 flex items-center gap-2">
          <Building className="w-5 h-5 text-uemg-blue-700" />
          <h2 className="text-base font-bold text-slate-900">
            1. Identificação da Ação e Sistema de Registro
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div className="sm:col-span-2">
            <label htmlFor="title" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Título da Ação Extensionista
            </label>
            <input
              id="title"
              name="title"
              type="text"
              required
              placeholder="Ex: I Seminário de Inovação e Sustentabilidade da Zona da Mata"
              className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm text-slate-900 focus:ring-2 focus:ring-uemg-blue-600 outline-none"
            />
          </div>

          <div>
            <label htmlFor="registry_system" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Sistema Institucional de Registro
            </label>
            <select
              id="registry_system"
              name="registry_system"
              required
              className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm text-slate-900 focus:ring-2 focus:ring-uemg-blue-600 outline-none bg-white"
            >
              {(Object.keys(ACADEMIC_SYSTEM_LABELS) as AcademicSystemType[]).map((key) => (
                <option key={key} value={key}>
                  {ACADEMIC_SYSTEM_LABELS[key]}
                </option>
              ))}
            </select>
            <p className="text-xs text-slate-500 mt-1">
              Selecione o sistema corporativo onde a proposta foi originalmente submetida/aprovada.
            </p>
          </div>

          <div>
            <label htmlFor="external_registry_id" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Código / ID de Registro Externo
            </label>
            <input
              id="external_registry_id"
              name="external_registry_id"
              type="text"
              required
              placeholder="Ex: 20261234 (SIGA) ou EXT-2026-042 (SUAP)"
              className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm text-slate-900 focus:ring-2 focus:ring-uemg-blue-600 outline-none font-mono"
            />
            <p className="text-xs text-slate-500 mt-1">
              Número da proposta para auditoria cruzada contra a Intranet UEMG.
            </p>
          </div>

          <div>
            <label htmlFor="modality" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Modalidade
            </label>
            <select
              id="modality"
              name="modality"
              required
              className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm text-slate-900 focus:ring-2 focus:ring-uemg-blue-600 outline-none bg-white"
            >
              <option value="presencial">Presencial (Auditórios / Salas)</option>
              <option value="remoto">Remoto / Online</option>
              <option value="hibrido">Híbrido</option>
            </select>
          </div>

          <div>
            <label htmlFor="workload_hours" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Carga Horária Total (Horas)
            </label>
            <input
              id="workload_hours"
              name="workload_hours"
              type="number"
              min="1"
              required
              defaultValue="4"
              className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm text-slate-900 focus:ring-2 focus:ring-uemg-blue-600 outline-none"
            />
          </div>

          <div className="sm:col-span-2">
            <label htmlFor="location" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Local de Realização
            </label>
            <input
              id="location"
              name="location"
              type="text"
              required
              placeholder="Ex: Salão Nobre da UEMG Carangola ou Link da Sala Teams"
              className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm text-slate-900 focus:ring-2 focus:ring-uemg-blue-600 outline-none"
            />
          </div>

          <div className="sm:col-span-2">
            <label htmlFor="description" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Ementa / Descrição dos Objetivos
            </label>
            <textarea
              id="description"
              name="description"
              rows={3}
              placeholder="Descreva brevemente o público-alvo, programação geral e resultados esperados..."
              className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm text-slate-900 focus:ring-2 focus:ring-uemg-blue-600 outline-none"
            />
          </div>
        </div>
      </div>

      {/* Bloco 2: Programação & Sessões de Credenciamento */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-soft p-6 sm:p-8 space-y-6">
        <div className="border-b border-slate-200 pb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-uemg-blue-700" />
            <h2 className="text-base font-bold text-slate-900">
              2. Programação de Sessões para Credenciamento
            </h2>
          </div>
          <button
            type="button"
            onClick={addSession}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-uemg-blue-700 hover:text-uemg-blue-800 bg-uemg-blue-50 hover:bg-uemg-blue-100 px-3 py-1.5 rounded-lg transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Adicionar Sessão
          </button>
        </div>

        <div className="space-y-4">
          {sessions.map((session, index) => (
            <div
              key={session.id}
              className="p-4 rounded-lg border border-slate-200 bg-slate-50/70 grid grid-cols-1 sm:grid-cols-4 gap-4 items-end"
            >
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Título da Sessão {index + 1}
                </label>
                <input
                  type="text"
                  required
                  value={session.title}
                  onChange={(e) => updateSession(session.id, 'title', e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded border border-slate-300 bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Início
                </label>
                <input
                  type="datetime-local"
                  required
                  value={session.start_time}
                  onChange={(e) => updateSession(session.id, 'start_time', e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded border border-slate-300 bg-white"
                />
              </div>

              <div className="flex items-center gap-2">
                <div className="flex-1">
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Término
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={session.end_time}
                    onChange={(e) => updateSession(session.id, 'end_time', e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded border border-slate-300 bg-white"
                  />
                </div>
                {sessions.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeSession(session.id)}
                    className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded transition-colors"
                    title="Remover sessão"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bloco 3: Upload do Espelho Oficial em PDF & Termo de Fé Pública */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-soft p-6 sm:p-8 space-y-6">
        <div className="border-b border-slate-200 pb-3 flex items-center gap-2">
          <FileCheck className="w-5 h-5 text-uemg-blue-700" />
          <h2 className="text-base font-bold text-slate-900">
            3. Comprovação Oficial & Termo de Fé Pública
          </h2>
        </div>

        {/* Upload de Arquivo */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
            Anexo do Espelho de Aprovação (PDF Obrigatório)
          </label>
          <div className="border-2 border-dashed border-slate-300 rounded-xl p-6 text-center hover:border-uemg-blue-600 transition-colors bg-slate-50/50">
            <input
              id="mirror_pdf"
              name="mirror_pdf"
              type="file"
              accept="application/pdf"
              required
              onChange={handleFileChange}
              className="hidden"
            />
            <label htmlFor="mirror_pdf" className="cursor-pointer space-y-2 block">
              <Upload className="w-8 h-8 text-uemg-blue-700 mx-auto" />
              <p className="text-sm font-semibold text-slate-700">
                {selectedFile ? selectedFile.name : 'Clique para selecionar o Espelho Oficial em PDF'}
              </p>
              <p className="text-xs text-slate-500">
                {selectedFile
                  ? `Tamanho: ${(selectedFile.size / 1024 / 1024).toFixed(2)} MB • Checksum SHA-256 será gerado`
                  : 'Documento expedido pelo sistema corporativo (SIGA / SUAP). Máximo 10 MB.'}
              </p>
            </label>
          </div>
        </div>

        {/* Termo de Responsabilidade Administrativa (Art. 299) */}
        <div className="bg-amber-50/80 border border-amber-300/80 rounded-xl p-5 space-y-3">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-700 flex-shrink-0 mt-0.5" />
            <div className="text-xs text-amber-900 space-y-1.5">
              <p className="font-bold text-sm text-amber-950">
                Declaração de Veracidade e Responsabilidade Administrativa
              </p>
              <p className="leading-relaxed">
                Declaro, sob as penas do <strong>art. 299 do Código Penal Brasileiro (Falsidade Ideológica)</strong> e dos regulamentos disciplinares da Universidade do Estado de Minas Gerais, que as informações prestadas são verídicas e que o documento anexado corresponde fielmente ao espelho original de aprovação da ação de extensão pelos colegiados competentes.
              </p>
              <p className="text-[11px] text-amber-800">
                Nota de Segurança: O carimbo de aceite, timestamp UTC e o endereço IP da submissão serão gravados de forma permanente para fins de auditoria interna.
              </p>
            </div>
          </div>

          <label className="flex items-center gap-3 pt-2 cursor-pointer select-none">
            <input
              type="checkbox"
              required
              checked={termAccepted}
              onChange={(e) => setTermAccepted(e.target.checked)}
              className="w-4 h-4 rounded text-uemg-blue-700 focus:ring-uemg-blue-600 border-slate-300"
            />
            <span className="text-xs font-semibold text-slate-900">
              Li, compreendi e aceito integralmente o Termo de Responsabilidade Administrativa.
            </span>
          </label>
        </div>
      </div>

      {/* Botão de Submissão */}
      <div className="flex items-center justify-end gap-4">
        <button
          type="button"
          onClick={() => router.back()}
          className="px-5 py-2.5 text-sm font-semibold text-slate-700 hover:text-slate-900 transition-colors"
        >
          Cancelar
        </button>
        <LoadingButton
          type="submit"
          loading={isPending}
          loadingText="Calculando Checksum e Submetendo..."
          disabled={!termAccepted}
          className="px-8 py-3 bg-uemg-blue-700 hover:bg-uemg-blue-800 text-sm shadow-md"
        >
          <CheckCircle2 className="w-4 h-4 mr-2" />
          Submeter Proposta para Auditoria NUPEX
        </LoadingButton>
      </div>
    </form>
  );
}
