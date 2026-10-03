import { notFound } from 'next/navigation';
import Image from 'next/image';
import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { formatDisplayDate } from '@/lib/utils';
import { ACADEMIC_SYSTEM_LABELS } from '@/lib/constants';
import type { AcademicSystemType, Event, EventSession } from '@/types/database.types';
import { RegistrationForm } from './RegistrationForm';
import {
  Calendar,
  Clock,
  MapPin,
  Building,
  CheckCircle2,
  Users,
  Award,
} from 'lucide-react';

interface EventPageProps {
  params: { id: string };
}

export async function generateMetadata({ params }: EventPageProps): Promise<Metadata> {
  const supabase = createClient();
  const { data: event } = await (supabase.from('events') as any)
    .select('title, description, workload_hours')
    .eq('id', params.id)
    .single();

  if (!event) {
    return {
      title: 'Ação Extensionista | UEMG Carangola',
    };
  }

  return {
    title: `${event.title} | Extensão UEMG Carangola`,
    description:
      event.description ||
      `Participe da ação extensionista "${event.title}" na UEMG Unidade Carangola. Carga horária: ${event.workload_hours}h.`,
    openGraph: {
      title: `${event.title} | UEMG Carangola`,
      description: `Inscrições abertas para a ação extensionista universitária com emissão de certificado oficial (${event.workload_hours}h).`,
      images: [
        {
          url: '/assets/photos/fachada-1.jpg',
          width: 1200,
          height: 630,
          alt: 'Fachada da UEMG Unidade Carangola',
        },
      ],
      type: 'website',
    },
  };
}

export default async function PublicEventPage({ params }: EventPageProps) {
  const supabase = createClient();

  // 1. Busca os dados da ação extensionista
  const { data: event } = await (supabase.from('events') as any)
    .select('*')
    .eq('id', params.id)
    .single();

  if (!event || !['aprovado', 'em_andamento', 'encerrado'].includes(event.status)) {
    notFound();
  }

  const typedEvent = event as Event;

  // 2. Busca a programação das sessões
  const { data: sessions } = await (supabase.from('event_sessions') as any)
    .select('*')
    .eq('event_id', typedEvent.id)
    .order('start_time', { ascending: true });

  const typedSessions = (sessions || []) as EventSession[];
  const isEventOpen = ['aprovado', 'em_andamento'].includes(typedEvent.status);

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Banner Institucional Superior */}
        <div className="relative rounded-3xl overflow-hidden shadow-elevation border border-slate-200 bg-uemg-blue-900 text-white">
          <div className="absolute inset-0 opacity-20">
            <Image
              src="/assets/photos/fachada-1.jpg"
              alt="Fachada UEMG Carangola"
              fill
              className="object-cover"
              priority
            />
          </div>
          <div className="relative z-10 p-6 sm:p-12 space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-xs font-semibold uppercase tracking-wider text-uemg-yellow-400 border border-white/10">
              <Building className="w-3.5 h-3.5" />
              Universidade do Estado de Minas Gerais • Unidade Carangola
            </div>

            <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight leading-tight">
              {typedEvent.title}
            </h1>

            <div className="flex flex-wrap items-center gap-4 sm:gap-6 text-xs sm:text-sm text-slate-200 pt-2">
              <span className="flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-uemg-yellow-400" />
                {typedEvent.workload_hours} horas de extensão
              </span>
              <span>•</span>
              <span className="flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-uemg-yellow-400" />
                {typedEvent.location || 'UEMG Carangola'}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1.5 capitalize">
                <Award className="w-4 h-4 text-uemg-yellow-400" />
                Modalidade {typedEvent.modality}
              </span>
              <span>•</span>
              <span className="font-mono text-[11px] bg-black/20 px-2 py-0.5 rounded">
                Registro {ACADEMIC_SYSTEM_LABELS[typedEvent.registry_system] || typedEvent.registry_system}:{' '}
                <strong>{typedEvent.external_registry_id}</strong>
              </span>
            </div>
          </div>
        </div>

        {/* Grade de Conteúdo & Formulário de Inscrição */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Coluna da Esquerda: Detalhes, Ementa & Sessões */}
          <div className="lg:col-span-7 space-y-6">
            {/* Ementa e Descrição */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-soft p-6 sm:p-8 space-y-4">
              <h2 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-3">
                Sobre a Ação Extensionista
              </h2>
              <div className="text-sm text-slate-700 leading-relaxed space-y-3 whitespace-pre-line">
                {typedEvent.description ||
                  'Esta ação extensionista integra o calendário acadêmico da UEMG Unidade Carangola, proporcionando integração entre comunidade acadêmica e sociedade com certificação universitária com fé pública.'}
              </div>

              <div className="pt-4 border-t border-slate-100 grid grid-cols-2 gap-4 text-xs">
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                  <span className="text-slate-500 block mb-0.5">Certificação</span>
                  <span className="font-semibold text-slate-900">Digital com Chancela Oficial</span>
                </div>
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                  <span className="text-slate-500 block mb-0.5">Custódia</span>
                  <span className="font-semibold text-slate-900">UEMG NUPEX Carangola</span>
                </div>
              </div>
            </div>

            {/* Programação das Sessões */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-soft p-6 sm:p-8 space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                <Calendar className="w-5 h-5 text-uemg-blue-700" />
                <h2 className="text-lg font-bold text-slate-900">
                  Programação & Credenciamento
                </h2>
              </div>

              {typedSessions && typedSessions.length > 0 ? (
                <div className="space-y-3">
                  {typedSessions.map((session, idx) => (
                    <div
                      key={session.id}
                      className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="space-y-1">
                        <span className="text-xs font-bold text-uemg-blue-700 uppercase tracking-wider">
                          Sessão {idx + 1}
                        </span>
                        <h3 className="text-sm font-bold text-slate-900">{session.title}</h3>
                        <p className="text-xs text-slate-500">
                          Data: {formatDisplayDate(session.start_time)} • Carga:{' '}
                          {session.workload_session_hours}h
                        </p>
                      </div>
                      <div className="text-xs font-semibold px-3 py-1 rounded bg-uemg-blue-50 text-uemg-blue-800 self-start sm:self-center">
                        Credenciamento por QR Code
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-500">
                  A programação detalhada das sessões será divulgada pela coordenação da ação.
                </p>
              )}
            </div>
          </div>

          {/* Coluna da Direita: Formulário de Inscrição */}
          <div className="lg:col-span-5">
            {isEventOpen ? (
              <RegistrationForm eventId={typedEvent.id} eventTitle={typedEvent.title} />
            ) : (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-soft p-8 text-center space-y-3">
                <CheckCircle2 className="w-12 h-12 text-slate-400 mx-auto" />
                <h3 className="text-base font-bold text-slate-900">Inscrições Encerradas</h3>
                <p className="text-xs text-slate-500">
                  O período de inscrições online para esta ação extensionista foi concluído.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
