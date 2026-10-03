'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { QrCode, Search, ShieldCheck, AlertCircle } from 'lucide-react';

export default function ValidarPage() {
  const router = useRouter();
  const [code, setCode] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = code.trim().toUpperCase();

    if (!cleanCode) {
      setError('Por favor, informe o código verificador constante na certidão.');
      return;
    }

    if (cleanCode.length < 5) {
      setError('Código verificador muito curto.');
      return;
    }

    setError('');
    router.push(`/validar/${encodeURIComponent(cleanCode)}`);
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-16">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-soft p-6 sm:p-10 space-y-8">
        <div className="text-center space-y-3">
          <div className="inline-flex p-3 rounded-2xl bg-uemg-blue-50 text-uemg-blue-700 border border-uemg-blue-100 mb-1">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-uemg-blue-900 tracking-tight">
            Validação de Certidões de Extensão
          </h1>
          <p className="text-sm text-slate-600 max-w-lg mx-auto leading-relaxed">
            Consulte a autenticidade jurídica e a fé pública de certidões expedidas pelo NUPEX / UEMG Unidade Carangola informando o código alfanumérico ou escaneando o QR Code do documento.
          </p>
        </div>

        <form className="space-y-5" onSubmit={handleSubmit} noValidate>
          <div>
            <label htmlFor="codigo" className="block text-sm font-semibold text-slate-700 mb-1.5">
              Código Verificador da Certidão
            </label>
            <div className="relative">
              <input
                id="codigo"
                type="text"
                value={code}
                onChange={(e) => {
                  setCode(e.target.value);
                  if (error) setError('');
                }}
                placeholder="Ex: CAR-2026-A1B2-C3D4"
                aria-describedby="codigo-help"
                aria-invalid={!!error}
                className="w-full px-4 py-3.5 pl-11 rounded-xl border border-slate-300 text-slate-900 uppercase font-mono tracking-wider focus:ring-2 focus:ring-uemg-blue-600 focus:border-uemg-blue-600 outline-none transition-all shadow-sm"
              />
              <Search className="w-5 h-5 text-slate-400 absolute left-3.5 top-4" aria-hidden="true" />
            </div>

            {error && (
              <p role="alert" className="text-xs text-red-600 flex items-center gap-1.5 mt-2 font-medium">
                <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" aria-hidden="true" />
                {error}
              </p>
            )}

            <p id="codigo-help" className="text-xs text-slate-500 mt-2">
              O código verificador está posicionado no terço inferior da certidão, logo acima do carimbo da Chancela Tipográfica Eletrônica.
            </p>
          </div>

          <button
            type="submit"
            aria-label="Verificar autenticidade e fé pública da certidão informada"
            className="w-full py-3.5 px-4 rounded-xl bg-uemg-blue-700 hover:bg-uemg-blue-800 text-white font-semibold text-sm shadow-sm transition-all hover:shadow active:scale-95 flex items-center justify-center gap-2"
          >
            <QrCode className="w-4 h-4" aria-hidden="true" />
            Verificar Autenticidade e Fé Pública
          </button>
        </form>

        <div className="border-t border-slate-200 pt-6 text-center text-xs text-slate-500 space-y-1.5 leading-relaxed">
          <p>
            Chancela Eletrônica amparada pelo <strong>Decreto Estadual nº 47.222/2017</strong> e <strong>Lei Federal nº 14.063/2020</strong>.
          </p>
          <p>
            <strong>Privacidade por Design (LGPD):</strong> Nenhum dado sensível de identificação de ouvintes ou alunos é exposto publicamente na validação.
          </p>
        </div>
      </div>
    </div>
  );
}
