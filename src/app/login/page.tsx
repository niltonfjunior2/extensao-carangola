'use client';

import { useState, useTransition, Suspense } from 'react';
import Image from "next/image";
import { Lock, Mail, ArrowRight } from "lucide-react";
import { loginAction } from '@/app/actions/auth';
import { useRouter, useSearchParams } from 'next/navigation';
import { StatusAlert } from '@/components/ui/StatusAlert';
import { LoadingButton } from '@/components/ui/LoadingButton';

function DeniedAccessNotice() {
  const searchParams = useSearchParams();
  const denied = searchParams.get('denied');

  if (!denied) return null;

  return (
    <StatusAlert
      variant="warning"
      message="Sessão não identificada ou expirada. Efetue login institucional para acessar esta área restrita."
    />
  );
}

export default function LoginPage() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMessage(null);

    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      const result = await loginAction(formData);
      if (!result.success) {
        setErrorMessage(result.error || 'Falha ao autenticar.');
      } else {
        router.push('/admin/mandatos');
        router.refresh();
      }
    });
  };

  return (
    <div className="max-w-md mx-auto px-4 py-16">
      <div className="bg-white rounded-xl border border-slate-200 shadow-elevation p-6 sm:p-8 space-y-6">
        <div className="text-center space-y-3">
          <div className="flex justify-center">
            <Image
              src="/assets/logos/extensao-logo.png"
              alt="Logo Extensão UEMG"
              width={140}
              height={45}
              priority
              className="h-12 w-auto object-contain"
            />
          </div>
          <h1 className="text-xl font-bold text-uemg-blue-900">
            Acesso Institucional ao Portal
          </h1>
          <p className="text-xs text-slate-600">
            Docentes Proponentes, Coordenação de Extensão e Monitores.
          </p>
        </div>

        <Suspense fallback={null}>
          <DeniedAccessNotice />
        </Suspense>

        {errorMessage && (
          <StatusAlert
            variant="error"
            message={errorMessage}
            onClose={() => setErrorMessage(null)}
          />
        )}

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="email" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              E-mail Institucional
            </label>
            <div className="relative">
              <input
                id="email"
                name="email"
                type="email"
                required
                autoComplete="email"
                placeholder="seu.nome@uemg.br"
                className="w-full px-3 py-2.5 pl-10 rounded-lg border border-slate-300 text-sm text-slate-900 focus:ring-2 focus:ring-uemg-blue-600 focus:border-uemg-blue-600 outline-none"
              />
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            </div>
          </div>

          <div>
            <label htmlFor="password" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Senha de Acesso
            </label>
            <div className="relative">
              <input
                id="password"
                name="password"
                type="password"
                required
                autoComplete="current-password"
                placeholder="••••••••"
                className="w-full px-3 py-2.5 pl-10 rounded-lg border border-slate-300 text-sm text-slate-900 focus:ring-2 focus:ring-uemg-blue-600 focus:border-uemg-blue-600 outline-none"
              />
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            </div>
          </div>

          <LoadingButton
            type="submit"
            isLoading={isPending}
            loadingText="Autenticando..."
            icon={<ArrowRight className="w-4 h-4" />}
            className="w-full"
          >
            Entrar no Portal
          </LoadingButton>
        </form>

        <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-center text-xs text-slate-600 space-y-1">
          <p className="font-semibold text-slate-700">Controle de Acesso Institucional</p>
          <p>Para primeiro acesso ou autorização docente/monitor, procure a Coordenação de Extensão.</p>
        </div>
      </div>
    </div>
  );
}
