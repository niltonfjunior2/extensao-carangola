import Image from "next/image";
import Link from "next/link";
import {
  CheckCircle2,
  ShieldCheck,
  QrCode,
  Smartphone,
  BookOpen,
  ExternalLink,
  Calendar,
  Clock,
  MapPin,
  ArrowRight,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { ACADEMIC_SYSTEM_LABELS } from "@/lib/constants";
import type { Event, AcademicSystemType } from "@/types/database.types";

export default async function HomePage() {
  const supabase = createClient();
  const { data: events } = await (supabase.from('events') as any)
    .select('id, title, modality, workload_hours, location, registry_system, external_registry_id, created_at')
    .in('status', ['aprovado', 'em_andamento'])
    .order('created_at', { ascending: false });

  const openEvents = (events || []) as Event[];
  return (
    <div className="space-y-16">
      {/* Hero Section com a Fachada da UEMG Carangola */}
      <section className="relative overflow-hidden bg-uemg-blue-900 text-white">
        <div className="absolute inset-0 z-0 opacity-25 mix-blend-overlay">
          <Image
            src="/assets/images/fachada-diurna.jpg"
            alt="Fachada Diurna da UEMG Unidade Carangola"
            fill
            priority
            className="object-cover"
          />
        </div>
        
        {/* Gradiente de sobreposição institucional */}
        <div className="absolute inset-0 bg-gradient-to-r from-uemg-blue-950 via-uemg-blue-900/90 to-uemg-blue-800/80 z-0" />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28">
          <div className="max-w-3xl space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-uemg-blue-700/60 border border-uemg-blue-400/30 text-xs font-semibold uppercase tracking-wider text-uemg-blue-100">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              NUPEX — Núcleo de Pesquisa e Extensão
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white leading-tight text-balance">
              Portal de Extensão Universitária
              <span className="block text-uemg-gold">UEMG Unidade Carangola</span>
            </h1>

            <p className="text-base sm:text-lg text-slate-200 leading-relaxed max-w-2xl">
              Plataforma oficial para divulgação de projetos, inscrições, credenciamento mobile de ouvintes e expedição de certidões sob demanda com validação criptográfica pública por QR Code.
            </p>

            <div className="flex flex-wrap items-center gap-4 pt-4">
              <Link
                href="/validar"
                aria-label="Validar autenticidade de certidão por código ou QR Code"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg text-sm font-semibold bg-uemg-gold hover:bg-yellow-500 text-slate-950 shadow-md transition-all focus-visible:ring-2 focus-visible:ring-yellow-400"
              >
                <QrCode className="w-4 h-4" aria-hidden="true" />
                Validar Certidão
              </Link>
              <Link
                href="/login"
                aria-label="Acesso restrito para docentes e coordenadores"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg text-sm font-semibold bg-white/10 hover:bg-white/20 text-white border border-white/20 backdrop-blur-sm transition-all focus-visible:ring-2 focus-visible:ring-white"
              >
                <ShieldCheck className="w-4 h-4" aria-hidden="true" />
                Acesso do Docente / Coordenador
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Destaques de Governança & Soberania Digital */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8" aria-labelledby="pilares-title">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 id="pilares-title" className="text-2xl sm:text-3xl font-bold text-uemg-blue-900 tracking-tight">
            Pilares da Extensão Universitária
          </h2>
          <p className="text-sm text-slate-600 mt-2">
            Arquitetura em conformidade com as diretrizes do SIGA, Lei 14.063/2020 e LGPD.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="p-6 rounded-xl bg-white border border-slate-200 shadow-soft hover:shadow-elevation transition-all">
            <div className="w-12 h-12 rounded-lg bg-uemg-blue-50 text-uemg-blue-700 flex items-center justify-center mb-4">
              <ShieldCheck className="w-6 h-6" aria-hidden="true" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">Homologação SIGA Obrigatória</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Travamento transacional de segurança: nenhuma presença ou certidão é emitida sem o registro formal e auditoria do espelho do SIGA pela Coordenação.
            </p>
          </div>

          <div className="p-6 rounded-xl bg-white border border-slate-200 shadow-soft hover:shadow-elevation transition-all">
            <div className="w-12 h-12 rounded-lg bg-uemg-blue-50 text-uemg-blue-700 flex items-center justify-center mb-4">
              <Smartphone className="w-6 h-6" aria-hidden="true" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">Credenciamento Mobile Offline</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Leitura de credenciais nos auditórios por aplicativo PWA com persistência em IndexedDB e sincronização monotônica à prova de quedas de sinal.
            </p>
          </div>

          <div className="p-6 rounded-xl bg-white border border-slate-200 shadow-soft hover:shadow-elevation transition-all">
            <div className="w-12 h-12 rounded-lg bg-uemg-blue-50 text-uemg-blue-700 flex items-center justify-center mb-4">
              <BookOpen className="w-6 h-6" aria-hidden="true" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">Chancela Tipográfica Oficial</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Certidões calculadas sob demanda com carimbo SHA-256 e snapshot dos mandatos vigentes, eliminando o uso de assinaturas escaneadas e custo zero de storage.
            </p>
          </div>
        </div>
      </section>

      {/* Seção Dinâmica de Ações Extensionistas Abertas para Inscrição */}
      <section id="eventos" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 scroll-mt-24">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-slate-200 pb-4">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-uemg-blue-700 uppercase tracking-wider mb-1">
              <Calendar className="w-4 h-4" />
              Inscrições & Participação
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Ações Extensionistas Abertas
            </h2>
          </div>
          <p className="text-xs text-slate-500 max-w-sm">
            Participe dos seminários, palestras e cursos promovidos pelo corpo docente e receba certificação oficial com chancela eletrônica.
          </p>
        </div>

        {openEvents.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {openEvents.map((evt) => (
              <div
                key={evt.id}
                className="bg-white rounded-2xl border border-slate-200 shadow-soft hover:shadow-elevation transition-all flex flex-col justify-between overflow-hidden group"
              >
                <div className="p-6 space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                      Inscrições Abertas
                    </span>
                    <span className="text-[11px] font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                      {ACADEMIC_SYSTEM_LABELS[evt.registry_system as AcademicSystemType] || evt.registry_system}:{' '}
                      <strong>{evt.external_registry_id}</strong>
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-slate-900 group-hover:text-uemg-blue-700 transition-colors line-clamp-2">
                    {evt.title}
                  </h3>

                  <div className="space-y-1.5 text-xs text-slate-600 pt-1">
                    <div className="flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5 text-uemg-blue-700" />
                      <span>{evt.workload_hours}h de carga horária extensionista</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-uemg-blue-700" />
                      <span className="truncate">{evt.location || 'UEMG Carangola'}</span>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-xs capitalize font-semibold text-slate-500">
                    {evt.modality}
                  </span>
                  <Link
                    href={`/eventos/${evt.id}`}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-uemg-blue-700 hover:bg-uemg-blue-800 text-white font-bold text-xs shadow-sm transition-colors"
                  >
                    Inscrever-se
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3">
            <Calendar className="w-12 h-12 text-slate-300 mx-auto" />
            <h3 className="text-base font-bold text-slate-700">Nenhuma Ação Aberta no Momento</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Novas ações extensionistas homologadas serão listadas aqui assim que aprovadas pelo Núcleo de Pesquisa e Extensão (NUPEX).
            </p>
          </div>
        )}
      </section>

      {/* Seção com Imagem Noturna da Unidade Carangola & Informações Institucionais */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-slate-900 rounded-2xl overflow-hidden shadow-elevation border border-slate-800">
          <div className="grid grid-cols-1 lg:grid-cols-2">
            <div className="p-8 sm:p-12 flex flex-col justify-center text-white space-y-6">
              <div className="inline-flex items-center gap-2 text-xs font-semibold text-uemg-gold uppercase tracking-wider">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                Unidade Carangola • Polo Regional
              </div>

              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                Compromisso com o Desenvolvimento Regional e a Extensão
              </h2>

              <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
                A Unidade Carangola da UEMG integra o ensino, a pesquisa e a extensão, conectando a comunidade acadêmica à sociedade por meio de cursos, palestras, eventos e projetos de impacto social.
              </p>

              <div className="pt-2">
                <a
                  href="https://www.uemg.br/carangola"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 text-sm font-semibold text-uemg-gold hover:text-yellow-400 transition-colors"
                >
                  Conheça mais sobre a Unidade Carangola
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            </div>

            <div className="relative min-h-[300px] lg:min-h-[420px]">
              <Image
                src="/assets/images/fachada-noturna.jpg"
                alt="Vista Noturna da UEMG Unidade Carangola"
                fill
                className="object-cover"
              />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
