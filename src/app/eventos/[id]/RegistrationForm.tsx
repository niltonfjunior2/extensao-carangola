'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { registerParticipantAction } from '@/app/actions/registrations';
import { formatCPF } from '@/lib/utils';
import { StatusAlert } from '@/components/ui/StatusAlert';
import { LoadingButton } from '@/components/ui/LoadingButton';
import { User, Mail, CreditCard, ShieldCheck, CheckCircle2 } from 'lucide-react';

interface RegistrationFormProps {
  eventId: string;
  eventTitle: string;
}

export function RegistrationForm({ eventId, eventTitle }: RegistrationFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [cpfValue, setCpfValue] = useState('');
  const [lgpdAccepted, setLgpdAccepted] = useState(false);
  const [status, setStatus] = useState<{ type: 'error' | 'success'; message: string } | null>(null);

  const handleCpfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCPF(e.target.value);
    setCpfValue(formatted);
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setStatus(null);

    if (!lgpdAccepted) {
      setStatus({
        type: 'error',
        message: 'Você deve aceitar a declaração de tratamento de dados (LGPD) para prosseguir.',
      });
      return;
    }

    const formData = new FormData(e.currentTarget);
    formData.set('eventId', eventId);
    formData.set('participantCpf', cpfValue);
    formData.set('lgpdAccepted', 'true');

    startTransition(async () => {
      const result = await registerParticipantAction(formData);
      if (!result.success || !result.data) {
        setStatus({
          type: 'error',
          message: result.error || 'Não foi possível concluir sua inscrição.',
        });
      } else if (result.data) {
        setStatus({
          type: 'success',
          message: 'Inscrição realizada com sucesso! Gerando sua credencial criptográfica...',
        });
        const regId = result.data.registrationId;
        setTimeout(() => {
          router.push(`/eventos/${eventId}/credencial/${regId}`);
        }, 1200);
      }
    });
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-elevation p-6 sm:p-8 space-y-6">
      <div className="border-b border-slate-200 pb-4 space-y-1">
        <h2 className="text-xl font-bold text-uemg-blue-900">
          Inscrição Gratuita na Ação
        </h2>
        <p className="text-xs text-slate-600">
          Preencha seus dados para garantir sua vaga e emitir sua credencial digital de acesso.
        </p>
      </div>

      {status && <StatusAlert type={status.type} message={status.message} />}

      <form onSubmit={handleSubmit} className="space-y-5" noValidate>
        {/* Nome Completo */}
        <div>
          <label
            htmlFor="participantName"
            className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5"
          >
            Nome Completo (como constará no Certificado) <span className="text-red-600">*</span>
          </label>
          <div className="relative">
            <input
              id="participantName"
              name="participantName"
              type="text"
              required
              autoComplete="name"
              placeholder="Ex: Maria Eduarda Silva"
              className="w-full px-3.5 py-2.5 pl-10 rounded-lg border border-slate-300 text-sm text-slate-900 focus-visible:ring-2 focus-visible:ring-uemg-blue-700 outline-none"
            />
            <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" aria-hidden="true" />
          </div>
        </div>

        {/* E-mail */}
        <div>
          <label
            htmlFor="participantEmail"
            className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5"
          >
            E-mail de Contato <span className="text-red-600">*</span>
          </label>
          <div className="relative">
            <input
              id="participantEmail"
              name="participantEmail"
              type="email"
              required
              autoComplete="email"
              placeholder="seu.email@exemplo.com"
              className="w-full px-3.5 py-2.5 pl-10 rounded-lg border border-slate-300 text-sm text-slate-900 focus-visible:ring-2 focus-visible:ring-uemg-blue-700 outline-none"
            />
            <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" aria-hidden="true" />
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Utilizado para envio do aviso de disponibilização do certificado e avisos da ação.
          </p>
        </div>

        {/* CPF */}
        <div>
          <label
            htmlFor="participantCpf"
            className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5"
          >
            Cadastro de Pessoa Física (CPF) <span className="text-red-600">*</span>
          </label>
          <div className="relative">
            <input
              id="participantCpf"
              name="participantCpf"
              type="text"
              required
              inputMode="numeric"
              maxLength={14}
              value={cpfValue}
              onChange={handleCpfChange}
              placeholder="000.000.000-00"
              className="w-full px-3.5 py-2.5 pl-10 rounded-lg border border-slate-300 text-sm text-slate-900 focus-visible:ring-2 focus-visible:ring-uemg-blue-700 outline-none font-mono"
            />
            <CreditCard className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" aria-hidden="true" />
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Necessário para a identificação jurídica e fé pública do certificado universitário.
          </p>
        </div>

        {/* Termo LGPD */}
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
          <div className="flex items-start gap-2.5">
            <ShieldCheck className="w-5 h-5 text-uemg-blue-700 flex-shrink-0 mt-0.5" aria-hidden="true" />
            <div className="text-xs text-slate-600 space-y-1">
              <p className="font-semibold text-slate-800">
                Privacidade & Tratamento de Dados (Lei 13.709/2018 - LGPD)
              </p>
              <p className="leading-relaxed">
                Os dados coletados destinam-se exclusivamente ao registro acadêmico, controle de presença e expedição da certidão de extensão pela Universidade do Estado de Minas Gerais. Seus dados são protegidos e nunca serão compartilhados comercialmente.
              </p>
            </div>
          </div>

          <label className="flex items-center gap-2.5 pt-2 cursor-pointer select-none">
            <input
              type="checkbox"
              required
              checked={lgpdAccepted}
              onChange={(e) => setLgpdAccepted(e.target.checked)}
              className="w-4 h-4 rounded text-uemg-blue-700 focus:ring-uemg-blue-600 border-slate-300"
            />
            <span className="text-xs font-medium text-slate-800">
              Concordo com o tratamento dos meus dados para fins de certificação universitária.
            </span>
          </label>
        </div>

        {/* Botão de Envio */}
        <LoadingButton
          type="submit"
          isLoading={isPending}
          loadingText="Processando Inscrição..."
          disabled={!lgpdAccepted || cpfValue.length < 14}
          className="w-full py-3 bg-uemg-blue-700 hover:bg-uemg-blue-800 text-sm shadow-md"
        >
          <CheckCircle2 className="w-4 h-4 mr-2" aria-hidden="true" />
          Confirmar Inscrição e Obter Credencial
        </LoadingButton>
      </form>
    </div>
  );
}
