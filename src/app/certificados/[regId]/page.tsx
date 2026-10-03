import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getCertificateByRegistrationIdAction } from '@/app/actions/certificates';
import { CertificateDocument } from '@/components/certificate/CertificateDocument';
import { AlertCircle, ArrowLeft, ShieldAlert, Clock } from 'lucide-react';

interface CertificatePageProps {
  params: { regId: string };
}

export default async function ParticipantCertificatePage({ params }: CertificatePageProps) {
  const result = await getCertificateByRegistrationIdAction(params.regId);

  if (!result.success || !result.data) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl border border-slate-200 shadow-soft p-6 sm:p-8 text-center space-y-6">
          <div className="w-16 h-16 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mx-auto border border-amber-200">
            <Clock className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <h1 className="text-xl font-bold text-slate-900">
              Certidão Não Disponível
            </h1>
            <p className="text-sm text-slate-600 leading-relaxed">
              {result.error ||
                'Não foi possível expedir a certidão. Verifique se o evento já foi encerrado e se a sua presença foi confirmada pela coordenação.'}
            </p>
          </div>

          <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-500 text-left space-y-1">
            <p className="font-semibold text-slate-700">Requisitos para expedição:</p>
            <p>1. Homologação da presença (check-in) na portaria do evento.</p>
            <p>2. Aprovação e encerramento oficial da ação extensionista no SIGA.</p>
            <p>3. Registro ativo dos mandatos das autoridades acadêmicas.</p>
          </div>

          <div className="pt-2">
            <Link
              href="/"
              className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-uemg-blue-700 hover:bg-uemg-blue-800 text-white font-semibold text-sm transition-colors shadow-sm"
            >
              <ArrowLeft className="w-4 h-4" />
              Voltar ao Início
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return <CertificateDocument data={result.data} />;
}
