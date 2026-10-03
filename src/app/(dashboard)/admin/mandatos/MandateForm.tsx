'use client';

import { useState, useTransition } from 'react';
import { UserCheck, PlusCircle } from 'lucide-react';
import { createMandateAction } from '@/app/actions/mandates';
import { useRouter } from 'next/navigation';
import { StatusAlert } from '@/components/ui/StatusAlert';
import { LoadingButton } from '@/components/ui/LoadingButton';

export function MandateForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [status, setStatus] = useState<{ type: 'error' | 'success'; message: string } | null>(null);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setStatus(null);

    const form = e.currentTarget;
    const formData = new FormData(form);

    startTransition(async () => {
      const result = await createMandateAction(formData);
      if (!result.success) {
        setStatus({ type: 'error', message: result.error || 'Falha ao registrar mandato.' });
      } else {
        setStatus({ type: 'success', message: 'Posse registrada e mandato ativado com sucesso!' });
        form.reset();
        router.refresh();
      }
    });
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-soft p-6 sm:p-8 space-y-6">
      <div className="flex items-center gap-2 border-b border-slate-200 pb-4">
        <PlusCircle className="w-5 h-5 text-uemg-blue-700" />
        <h2 className="text-lg font-bold text-slate-900">
          Registrar Posse de Novo Titular
        </h2>
      </div>

      {status && (
        <StatusAlert
          variant={status.type}
          message={status.message}
          onClose={() => setStatus(null)}
        />
      )}

      <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div>
          <label htmlFor="role" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
            Cargo / Função Institucional
          </label>
          <select
            id="role"
            name="role"
            required
            className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm text-slate-900 focus:ring-2 focus:ring-uemg-blue-600 outline-none bg-white"
          >
            <option value="coordenador_extensao">Coordenador de Extensão (NUPEX)</option>
            <option value="diretor_unidade">Diretor da Unidade Carangola</option>
          </select>
        </div>

        <div>
          <label htmlFor="authority_name" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
            Nome Completo da Autoridade (com Titulação)
          </label>
          <input
            id="authority_name"
            name="authority_name"
            type="text"
            required
            placeholder="Ex: Prof. Dr. Fulano de Tal"
            className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm text-slate-900 focus:ring-2 focus:ring-uemg-blue-600 outline-none"
          />
        </div>

        <div>
          <label htmlFor="masp" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
            MASP Institucional
          </label>
          <input
            id="masp"
            name="masp"
            type="text"
            required
            placeholder="Ex: 1.234.567-8"
            className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm text-slate-900 focus:ring-2 focus:ring-uemg-blue-600 outline-none font-mono"
          />
        </div>

        <div>
          <label htmlFor="official_act" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
            Ato Normativo de Designação
          </label>
          <input
            id="official_act"
            name="official_act"
            type="text"
            required
            placeholder="Ex: Portaria UEMG Carangola nº 05/2026"
            className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm text-slate-900 focus:ring-2 focus:ring-uemg-blue-600 outline-none"
          />
        </div>

        <div>
          <label htmlFor="start_date" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
            Data de Início da Vigência
          </label>
          <input
            id="start_date"
            name="start_date"
            type="date"
            required
            className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm text-slate-900 focus:ring-2 focus:ring-uemg-blue-600 outline-none"
          />
        </div>

        <div className="sm:col-span-2 pt-2">
          <LoadingButton
            type="submit"
            isLoading={isPending}
            loadingText="Registrando Posse..."
            icon={<UserCheck className="w-4 h-4" />}
          >
            Confirmar Posse e Ativar Mandato
          </LoadingButton>
        </div>
      </form>
    </div>
  );
}
