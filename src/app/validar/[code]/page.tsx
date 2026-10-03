import React from 'react';
import Link from 'next/link';
import { getCertificateByValidationCodeAction } from '@/app/actions/certificates';
import { formatDisplayDate } from '@/lib/utils';
import {
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  Calendar,
  Clock,
  MapPin,
  Award,
  ArrowLeft,
  CheckCircle2,
  Search,
  Building2,
  FileText,
} from 'lucide-react';

interface ValidatePageProps {
  params: { code: string };
}

export default async function ValidateCertificatePage({ params }: ValidatePageProps) {
  const result = await getCertificateByValidationCodeAction(params.code);

  if (!result.success || !result.data) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16">
        <div className="bg-white rounded-2xl border border-red-200 shadow-soft p-6 sm:p-10 space-y-6 text-center">
          <div className="w-16 h-16 rounded-full bg-red-50 text-red-600 flex items-center justify-center mx-auto border border-red-200">
            <ShieldAlert className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-widest text-red-600 bg-red-50 px-3 py-1 rounded-full border border-red-200">
              Certidão Não Encontrada
            </span>
            <h1 className="text-2xl font-bold text-slate-900 mt-2">
              Autenticidade Não Confirmada
            </h1>
            <p className="text-sm text-slate-600 max-w-lg mx-auto">
              {result.error ||
                'Nenhum documento com o código verificador informado foi localizado na base institucional da UEMG Unidade Carangola.'}
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-500 font-mono text-center">
            Código consultado: <span className="font-bold text-slate-800">{params.code.toUpperCase()}</span>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/validar"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 py-3 px-6 rounded-xl bg-uemg-blue-700 hover:bg-uemg-blue-800 text-white font-semibold text-sm transition-colors shadow-sm"
            >
              <Search className="w-4 h-4" />
              Tentar Outro Código
            </Link>
            <Link
              href="/"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 py-3 px-6 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-sm transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Página Inicial
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const cert = result.data;
  const isRevoked = cert.isRevoked;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
      {/* Botão de Retorno */}
      <div className="mb-6 flex items-center justify-between">
        <Link
          href="/validar"
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-uemg-blue-700 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Consultar outra certidão
        </Link>

        <span className="text-xs text-slate-400 font-mono">
          SEI-MG / Lei 14.063/2020
        </span>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-soft overflow-hidden">
        {/* Banner de Status de Autenticidade */}
        <div
          className={`p-6 sm:p-8 text-white ${
            isRevoked
              ? 'bg-gradient-to-r from-red-700 to-red-900'
              : 'bg-gradient-to-r from-emerald-700 to-teal-800'
          }`}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur border border-white/20 flex items-center justify-center flex-shrink-0">
                {isRevoked ? (
                  <AlertTriangle className="w-8 h-8 text-red-200" />
                ) : (
                  <ShieldCheck className="w-8 h-8 text-emerald-200" />
                )}
              </div>
              <div>
                <span className="text-xs font-bold uppercase tracking-widest text-white/80">
                  {isRevoked ? 'Documento Cancelado' : 'Fé Pública Confirmada'}
                </span>
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
                  {isRevoked
                    ? 'Certidão Revogada / Ineficaz'
                    : 'Certidão Autêntica e Válida'}
                </h1>
                <p className="text-xs text-white/90 mt-0.5">
                  Emitida oficialmente pela Universidade do Estado de Minas Gerais — UEMG Carangola
                </p>
              </div>
            </div>

            <div className="text-left sm:text-right font-mono text-xs bg-black/20 p-3 rounded-lg border border-white/10">
              <span className="text-white/60 block text-[10px] uppercase">Código Verificador</span>
              <span className="font-bold text-sm tracking-wider">{cert.validationCode}</span>
            </div>
          </div>
        </div>

        {/* Alerta de Revogação Explicativo (Se houver) */}
        {isRevoked && (
          <div className="bg-red-50 border-b border-red-200 p-5 text-red-800 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              <strong className="block font-bold uppercase text-red-900">
                Aviso de Anulação Administrativa:
              </strong>
              <p className="mt-0.5">
                Esta certidão foi revogada pela autoridade acadêmica e não possui validade para comprovação de carga horária.
              </p>
              {cert.revocationReason && (
                <p className="mt-1 font-semibold text-red-900 bg-red-100/70 p-2 rounded border border-red-200">
                  Motivo: {cert.revocationReason}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Metadados Institucionais e Dados do Participante */}
        <div className="p-6 sm:p-10 space-y-8">
          {/* Seção 1: Dados do Participante (com Mascaramento Compulsório LGPD) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <Award className="w-4 h-4 text-uemg-blue-700" />
                Dados do Certificado & Participante
              </h2>
              <span className="text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                LGPD Protegido
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div>
                <span className="block text-xs font-medium text-slate-500">Nome do Titular</span>
                <span className="font-bold text-slate-900 text-base">{cert.participant.fullName}</span>
              </div>

              <div>
                <span className="block text-xs font-medium text-slate-500">CPF do Titular</span>
                <span className="font-mono font-semibold text-slate-800 tracking-wider">
                  {cert.participant.cpfFormatted}
                </span>
                <span className="block text-[10px] text-slate-400 mt-0.5">
                  (Dígitos ofuscados conforme Art. 6º da Lei 13.709/2018)
                </span>
              </div>

              <div>
                <span className="block text-xs font-medium text-slate-500">E-mail Cadastrado</span>
                <span className="font-mono text-slate-700">{cert.participant.email}</span>
              </div>

              <div>
                <span className="block text-xs font-medium text-slate-500">Data e Hora de Expedição</span>
                <span className="font-medium text-slate-800">{formatDisplayDate(cert.issuedAt)}</span>
              </div>
            </div>
          </div>

          {/* Seção 2: Dados da Ação Extensionista */}
          <div className="space-y-3">
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2 border-b border-slate-200 pb-2">
              <Building2 className="w-4 h-4 text-uemg-blue-700" />
              Ação Extensionista Vinculada
            </h2>

            <div className="space-y-3">
              <div>
                <span className="block text-xs font-medium text-slate-500">Título da Ação</span>
                <p className="text-base font-bold text-uemg-blue-900">{cert.event.title}</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                  <span className="block text-xs text-slate-500">Carga Horária</span>
                  <span className="font-bold text-uemg-blue-700 text-lg">
                    {cert.event.workloadHours} horas
                  </span>
                </div>

                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                  <span className="block text-xs text-slate-500">Período de Realização</span>
                  <span className="font-medium text-slate-800">
                    {formatDisplayDate(cert.event.startDate)} a {formatDisplayDate(cert.event.endDate)}
                  </span>
                </div>

                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                  <span className="block text-xs text-slate-500">Registro SIGA Homologado</span>
                  <span className="font-mono font-bold text-slate-800">
                    {cert.event.systemType}: {cert.event.sigaId}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Seção 3: Chancela Eletrônica Tipográfica Oficial das Autoridades */}
          <div className="space-y-3">
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2 border-b border-slate-200 pb-2">
              <FileText className="w-4 h-4 text-uemg-blue-700" />
              Chancela Eletrônica & Signatários Oficiais
            </h2>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 font-mono text-xs text-slate-800 space-y-2">
              <div className="space-y-1">
                <p>
                  • <strong>{cert.mandateSnapshot.coordinator.name}</strong> — {cert.mandateSnapshot.coordinator.roleTitle} (MASP {cert.mandateSnapshot.coordinator.masp}), conforme {cert.mandateSnapshot.coordinator.officialAct}
                </p>
                <p>
                  • <strong>{cert.mandateSnapshot.director.name}</strong> — {cert.mandateSnapshot.director.roleTitle} (MASP {cert.mandateSnapshot.director.masp}), conforme {cert.mandateSnapshot.director.officialAct}
                </p>
              </div>

              <div className="pt-2 border-t border-slate-200 text-[11px] text-slate-600 space-y-1">
                <p>
                  Hash SHA-256 de Integridade:{' '}
                  <span className="font-bold text-slate-900 break-all select-all">
                    {cert.sha256Hash}
                  </span>
                </p>
                <p className="text-[10px] text-slate-500">
                  Assinatura amparada nos termos do Decreto Estadual de Minas Gerais nº 47.222/2017 e Lei Federal nº 14.063/2020.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Rodapé Informativo */}
        <div className="bg-slate-100/80 border-t border-slate-200 px-6 sm:px-10 py-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <span>Universidade do Estado de Minas Gerais • UEMG Unidade Carangola</span>
          <span>Núcleo de Pesquisa e Extensão (NUPEX)</span>
        </div>
      </div>
    </div>
  );
}
