import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { QRCodeSVG } from 'qrcode.react';
import { createClient } from '@/lib/supabase/server';
import { getRegistrationCredentialAction } from '@/app/actions/registrations';
import { formatDisplayDate } from '@/lib/utils';
import {
  ShieldCheck,
  Calendar,
  Clock,
  MapPin,
  ArrowLeft,
  CheckCircle2,
  Printer,
  Download,
  Award,
} from 'lucide-react';
import { PrintButton } from './PrintButton';

interface CredentialPageProps {
  params: { id: string; regId: string };
}

export default async function CredentialPage({ params }: CredentialPageProps) {
  const supabase = createClient();

  // 1. Busca os dados do evento e da inscrição
  const { data: event } = await (supabase.from('events') as any)
    .select('id, title, location, workload_hours, status')
    .eq('id', params.id)
    .single();

  if (!event) notFound();

  const { data: registration } = await (supabase.from('registrations') as any)
    .select('id, attended')
    .eq('id', params.regId)
    .single();

  // 2. Busca a credencial assinada com Ed25519
  const res = await getRegistrationCredentialAction(params.regId);
  if (!res.success || !res.data) notFound();

  const { signedCredential } = res.data;
  const qrString = JSON.stringify(signedCredential);
  const isEligibleForCertificate = registration?.attended && ['aprovado', 'encerrado'].includes(event.status);

  return (
    <div className="min-h-screen bg-slate-100 py-10 px-4 sm:px-6 flex flex-col items-center justify-center">
      <div className="max-w-md w-full space-y-6">
        {/* Banner de Certificado Disponível se a Presença já foi Registrada */}
        {isEligibleForCertificate && (
          <div className="bg-gradient-to-r from-uemg-blue-900 to-uemg-blue-800 text-white rounded-2xl p-4 shadow-soft flex items-center justify-between gap-3 border border-uemg-blue-700 print:hidden animate-fade-in">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-uemg-gold text-uemg-blue-950 flex items-center justify-center flex-shrink-0 font-bold">
                <Award className="w-6 h-6 text-uemg-blue-950" />
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-uemg-gold">
                  Presença Confirmada!
                </p>
                <p className="text-sm font-semibold">
                  Seu certificado oficial já está disponível.
                </p>
              </div>
            </div>

            <Link
              href={`/certificados/${params.regId}`}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-uemg-gold hover:bg-amber-400 text-uemg-blue-950 font-bold text-xs shadow-sm transition-all flex-shrink-0"
            >
              Emitir
            </Link>
          </div>
        )}

        {/* Navegação Superior */}
        <div className="flex items-center justify-between">
          <Link
            href={`/eventos/${event.id}`}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar para a página do evento
          </Link>
          <PrintButton />
        </div>

        {/* Card Crachá da Credencial Virtual */}
        <div
          id="credential-card"
          className="bg-white rounded-3xl border border-slate-200 shadow-elevation overflow-hidden divide-y divide-slate-100 print:shadow-none print:border-none"
        >
          {/* Topo do Crachá com Padrão UEMG */}
          <div className="bg-gradient-to-r from-uemg-blue-900 to-uemg-blue-800 p-6 text-white text-center space-y-3">
            <div className="flex justify-center">
              <Image
                src="/assets/logos/extensao-logo.png"
                alt="Extensão UEMG"
                width={130}
                height={40}
                className="h-10 w-auto object-contain brightness-0 invert"
                priority
              />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-uemg-yellow-400 block">
                Credencial Oficial de Acesso
              </span>
              <h1 className="text-base font-bold leading-snug line-clamp-2">
                {event.title}
              </h1>
            </div>
          </div>

          {/* Identificação do Participante */}
          <div className="p-6 text-center space-y-1 bg-slate-50/50">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              Participante Inscrito
            </span>
            <h2 className="text-lg font-bold text-slate-900">
              {signedCredential.payload.name}
            </h2>
            <p className="text-xs font-mono text-slate-600">
              CPF: {signedCredential.payload.cpf_masked}
            </p>
          </div>

          {/* QR Code Criptográfico Assinado com Ed25519 */}
          <div className="p-6 flex flex-col items-center justify-center space-y-4">
            <div className="p-3 bg-white rounded-2xl border-2 border-dashed border-slate-300 shadow-inner">
              <QRCodeSVG
                value={qrString}
                size={210}
                level="M"
                includeMargin={false}
              />
            </div>

            <div className="text-center space-y-1">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                Assinada Criptograficamente (Ed25519)
              </div>
              <p className="text-[11px] text-slate-500 max-w-xs">
                Apresente este QR Code na entrada do auditório para que o monitor registre sua presença instantaneamente.
              </p>
            </div>
          </div>

          {/* Rodapé do Crachá */}
          <div className="p-4 bg-slate-50 text-[11px] text-slate-500 text-center space-y-1">
            <p className="font-semibold text-slate-700">
              Universidade do Estado de Minas Gerais • Carangola
            </p>
            <p className="font-mono text-[10px] text-slate-400">
              ID: {signedCredential.payload.reg_id}
            </p>
          </div>
        </div>

        {/* Informações Complementares */}
        <div className="bg-uemg-blue-50 border border-uemg-blue-200 rounded-xl p-4 text-xs text-uemg-blue-900 space-y-1 print:hidden">
          <p className="font-bold flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-uemg-blue-700" />
            Dica para o dia do evento:
          </p>
          <p className="leading-relaxed text-uemg-blue-800">
            Você pode salvar esta tela nos favoritos ou tirar um print do QR Code. O monitor conseguirá escanear sua credencial mesmo que a internet do auditório esteja totalmente fora do ar.
          </p>
        </div>
      </div>
    </div>
  );
}
