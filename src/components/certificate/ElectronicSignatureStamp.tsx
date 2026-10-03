'use client';

import React from 'react';
import { QRCodeSVG } from 'qrcode.react';

export interface MandateAuthority {
  name: string;
  roleTitle: string;
  masp: string;
  officialAct: string;
}

export interface SignatureStampProps {
  coordinator: MandateAuthority;
  director: MandateAuthority;
  validationCode: string;
  sha256Hash: string;
  validationUrl?: string;
}

/**
 * Chancela Tipográfica de Autenticação Eletrônica Oficial
 * Substituição estrita de imagens escaneadas conforme:
 * - Decreto Estadual de Minas Gerais nº 47.222/2017 (Processo Eletrônico)
 * - Lei Federal nº 14.063/2020 (Assinaturas Eletrônicas em Documentos Públicos)
 * - Regra Inviolável de Fé Pública e Soberania Jurídica da UEMG
 */
export function ElectronicSignatureStamp({
  coordinator,
  director,
  validationCode,
  sha256Hash,
  validationUrl,
}: SignatureStampProps) {
  const checkUrl =
    validationUrl ||
    (typeof window !== 'undefined'
      ? `${window.location.origin}/validar/${validationCode}`
      : `https://extensao.carangola.uemg.br/validar/${validationCode}`);

  return (
    <div className="border-t-2 border-slate-300 pt-4 mt-4 font-mono text-[11px] leading-relaxed text-slate-800 bg-slate-50/70 p-3.5 rounded border print:bg-transparent print:border-slate-400 print:text-[10px]">
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1 space-y-1">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-600 print:hidden" />
            <p className="font-bold tracking-wider text-slate-900 uppercase text-[12px] print:text-[11px]">
              Documento Assinado Eletronicamente
            </p>
          </div>

          <div className="space-y-0.5 text-slate-700">
            <p>
              • <strong className="text-slate-900">{coordinator.name}</strong> — {coordinator.roleTitle} (MASP {coordinator.masp}), conforme {coordinator.officialAct}
            </p>
            <p>
              • <strong className="text-slate-900">{director.name}</strong> — {director.roleTitle} (MASP {director.masp}), conforme {director.officialAct}
            </p>
          </div>

          <div className="pt-1.5 border-t border-slate-200/80 mt-1.5 text-slate-600 text-[10px] space-y-0.5">
            <p>
              Autenticidade conferível publicamente em:{' '}
              <span className="font-semibold text-uemg-blue-800 underline break-all">
                {checkUrl}
              </span>
            </p>
            <p className="text-slate-500">
              Código Verificador:{' '}
              <strong className="text-slate-800 font-mono tracking-wider">{validationCode}</strong>{' '}
              | Hash SHA-256:{' '}
              <strong className="text-slate-700 font-mono">{sha256Hash.slice(0, 16)}...</strong>{' '}
              | Amparo: Dec. Est. 47.222/2017 e Lei 14.063/2020.
            </p>
          </div>
        </div>

        <div className="w-24 h-24 flex-shrink-0 flex flex-col items-center justify-center p-1.5 bg-white border border-slate-300 rounded shadow-sm print:shadow-none print:border-slate-400">
          <QRCodeSVG value={checkUrl} size={80} level="M" />
          <span className="text-[8px] font-sans font-medium text-slate-500 mt-1 uppercase tracking-tight text-center">
            Validar
          </span>
        </div>
      </div>
    </div>
  );
}
