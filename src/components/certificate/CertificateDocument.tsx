'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft, Printer, ShieldCheck, Download, Award, Building2 } from 'lucide-react';
import {
  ElectronicSignatureStamp,
  type MandateAuthority,
} from './ElectronicSignatureStamp';
import { formatDisplayDate } from '@/lib/utils';

export interface CertificateData {
  certificateId: string;
  validationCode: string;
  sha256Hash: string;
  issuedAt: string;
  participant: {
    fullName: string;
    cpfFormatted: string;
    email: string;
  };
  event: {
    title: string;
    description?: string | null;
    startDate: string;
    endDate: string;
    workloadHours: number;
    location: string;
    sigaId: string;
    systemType: string;
  };
  mandateSnapshot: {
    director: MandateAuthority;
    coordinator: MandateAuthority;
  };
  isRevoked?: boolean;
  revocationReason?: string | null;
}

interface CertificateDocumentProps {
  data: CertificateData;
}

export function CertificateDocument({ data }: CertificateDocumentProps) {
  const { participant, event, mandateSnapshot, validationCode, sha256Hash, issuedAt, isRevoked, revocationReason } = data;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-slate-100 py-6 px-3 sm:px-6 print:p-0 print:bg-white flex flex-col items-center">
      {/* Barra de Ferramentas / Ações (Oculta na impressão) */}
      <div className="w-full max-w-[1100px] mb-6 flex flex-wrap items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-soft print:hidden" role="toolbar" aria-label="Ferramentas do Certificado">
        <Link
          href="/"
          aria-label="Voltar para a página inicial do portal"
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700 hover:text-uemg-blue-700 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" aria-hidden="true" />
          Voltar ao Portal
        </Link>

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 text-xs text-slate-500 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
            <ShieldCheck className="w-4 h-4 text-emerald-600" aria-hidden="true" />
            <span>Documento Oficial UEMG • Custo de Storage R$ 0,00</span>
          </div>

          <button
            onClick={handlePrint}
            aria-label="Imprimir certificado ou salvar como arquivo PDF vetorial"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-uemg-blue-700 hover:bg-uemg-blue-800 text-white font-semibold text-sm shadow-sm transition-all hover:shadow active:scale-95"
            title="Imprimir ou Salvar como PDF em alta definição"
          >
            <Printer className="w-4 h-4" aria-hidden="true" />
            <span>Imprimir / Salvar em PDF</span>
          </button>
        </div>
      </div>

      {/* Tarja de Revogação (caso revogado) */}
      {isRevoked && (
        <div role="alert" className="w-full max-w-[1100px] mb-4 p-4 rounded-xl bg-red-100 border-2 border-uemg-red text-uemg-red-700 flex items-start gap-3 print:border-red-600 print:text-red-700">
          <div className="p-2 rounded-full bg-red-200 text-uemg-red-700 font-bold text-sm" aria-hidden="true">
            !
          </div>
          <div>
            <h3 className="font-bold text-base uppercase tracking-wide">
              CERTIDÃO CANCELADA / REVOGADA PELA COORDENAÇÃO
            </h3>
            <p className="text-sm mt-0.5">
              Este documento perdeu sua eficácia jurídica e fé pública institucional.
              {revocationReason && (
                <span className="block mt-1 font-semibold">
                  Motivo da Revogação: {revocationReason}
                </span>
              )}
            </p>
          </div>
        </div>
      )}

      {/* Área do Certificado (Folha A4 Paisagem: proporção 297 x 210 mm) */}
      <article
        id="certificate-print-area"
        aria-label={`Certificado de Extensão Universitária de ${participant.fullName}`}
        className={`w-full max-w-[1100px] bg-white rounded-lg shadow-elevation border border-slate-300 print:border-none print:shadow-none print:m-0 print:p-0 relative overflow-hidden transition-all ${
          isRevoked ? 'opacity-85 grayscale-[30%]' : ''
        }`}
        style={{
          // Proporção de A4 Landscape (1.414 : 1)
          minHeight: '740px',
        }}
      >
        {/* Moldura Nobre Institucional com Dourado e Azul UEMG */}
        <div className="absolute inset-3 border-2 border-uemg-gold/50 rounded pointer-events-none print:inset-2" />
        <div className="absolute inset-5 border border-uemg-blue-900/30 rounded pointer-events-none print:inset-4" />

        {/* Marca d'água de segurança */}
        <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none select-none">
          <Building2 className="w-96 h-96 text-uemg-blue-900" />
        </div>

        {/* Conteúdo do Documento */}
        <div className="relative z-10 p-8 sm:p-14 flex flex-col justify-between h-full min-h-[740px] print:p-8">
          {/* 1. Cabeçalho Oficial de Minas Gerais e UEMG */}
          <div className="text-center space-y-2 border-b border-slate-200/80 pb-5">
            <div className="flex items-center justify-center gap-3">
              <div className="w-10 h-10 rounded-full bg-uemg-blue-900 text-white flex items-center justify-center shadow-sm">
                <Award className="w-6 h-6 text-uemg-gold" />
              </div>
              <div className="text-left leading-tight">
                <p className="text-[11px] font-bold tracking-widest text-slate-500 uppercase">
                  ESTADO DE MINAS GERAIS
                </p>
                <h2 className="text-sm font-bold text-uemg-blue-900 uppercase tracking-wider">
                  Universidade do Estado de Minas Gerais — UEMG
                </h2>
                <p className="text-xs text-slate-700 font-medium">
                  Unidade Acadêmica de Carangola • Núcleo de Pesquisa e Extensão (NUPEX)
                </p>
              </div>
            </div>

            <div className="pt-4">
              <span className="inline-block text-[11px] font-bold uppercase tracking-[0.25em] text-uemg-gold-600 bg-amber-50/80 px-4 py-1 rounded-full border border-amber-200/60 print:bg-transparent">
                Certidão de Fé Pública Acadêmica
              </span>
              <h1 className="text-2xl sm:text-3xl font-serif font-bold text-uemg-blue-900 mt-2 tracking-wide uppercase">
                Certificado de Extensão Universitária
              </h1>
            </div>
          </div>

          {/* 2. Corpo Canônico do Certificado */}
          <div className="my-auto py-6 sm:py-8 text-center max-w-4xl mx-auto space-y-5">
            <p className="text-base sm:text-lg leading-relaxed text-slate-800 text-justify sm:text-center font-serif">
              Certificamos, para os devidos fins de direito e comprovação de atividades de extensão universitária, que{' '}
              <strong className="font-sans font-bold text-uemg-blue-950 underline decoration-uemg-gold/80 underline-offset-4 text-lg sm:text-xl">
                {participant.fullName}
              </strong>
              , portador(a) do CPF sob o nº{' '}
              <strong className="font-sans font-semibold text-slate-900">{participant.cpfFormatted}</strong>
              , participou com aproveitamento integral da ação extensionista{' '}
              <strong className="font-sans font-bold text-uemg-blue-900">
                &ldquo;{event.title}&rdquo;
              </strong>
              , realizada na modalidade presencial/mista em{' '}
              <span className="font-sans font-medium text-slate-800">{event.location}</span>, no período de{' '}
              <span className="font-sans font-semibold text-slate-900">{formatDisplayDate(event.startDate)}</span>{' '}
              a{' '}
              <span className="font-sans font-semibold text-slate-900">{formatDisplayDate(event.endDate)}</span>
              , integralizando a carga horária de{' '}
              <strong className="font-sans font-bold text-uemg-blue-900 text-lg">
                {event.workloadHours} horas
              </strong>{' '}
              de extensão universitária.
            </p>

            <div className="pt-2 text-xs text-slate-600 font-sans flex flex-wrap justify-center gap-x-6 gap-y-1">
              <span>
                Registro Institucional:{' '}
                <strong className="text-slate-800 font-mono font-semibold">
                  {event.systemType}: {event.sigaId}
                </strong>
              </span>
              <span>•</span>
              <span>
                Data de Emissão:{' '}
                <strong className="text-slate-800 font-semibold">
                  {formatDisplayDate(issuedAt)}
                </strong>
              </span>
              <span>•</span>
              <span>
                Local:{' '}
                <strong className="text-slate-800 font-semibold">
                  Carangola, MG - Brasil
                </strong>
              </span>
            </div>
          </div>

          {/* 3. Terço Inferior: Chancela Eletrônica Padronizada Oficial */}
          <div className="mt-auto">
            <ElectronicSignatureStamp
              coordinator={mandateSnapshot.coordinator}
              director={mandateSnapshot.director}
              validationCode={validationCode}
              sha256Hash={sha256Hash}
            />
          </div>
        </div>
      </article>
    </div>
  );
}
