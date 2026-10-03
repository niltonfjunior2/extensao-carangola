import type { Metadata, Viewport } from "next";
import "./globals.css";
import Image from "next/image";
import Link from "next/link";
import { ServiceWorkerRegister } from "@/components/pwa/ServiceWorkerRegister";

export const viewport: Viewport = {
  themeColor: "#003366",
};

export const metadata: Metadata = {
  title: "Portal de Extensão | UEMG Unidade Carangola",
  description:
    "Portal oficial de ações extensionistas, credenciamento mobile e emissão de certificados sob demanda com chancela eletrônica da Universidade do Estado de Minas Gerais - Unidade Carangola.",
  icons: {
    icon: "/assets/logos/extensao-logo.png",
    shortcut: "/assets/logos/extensao-logo.png",
    apple: "/assets/logos/extensao-logo.png",
  },
  manifest: "/manifest.json",
  openGraph: {
    title: "Portal de Extensão | UEMG Carangola",
    description: "Gestão, credenciamento e emissão de certidões das ações de extensão da UEMG Carangola.",
    url: "https://extensao.carangola.uemg.br",
    siteName: "Extensão UEMG Carangola",
    locale: "pt_BR",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className="flex flex-col min-h-screen">
        <ServiceWorkerRegister />
        {/* Barra Governamental / Institucional Superior */}
        <div className="bg-uemg-blue-900 text-white text-xs py-1.5 px-4 no-print border-b border-uemg-blue-800">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <span className="font-medium tracking-wide">
              UNIVERSIDADE DO ESTADO DE MINAS GERAIS — UNIDADE CARANGOLA
            </span>
            <div className="hidden sm:flex items-center gap-4 text-slate-300">
              <a
                href="https://www.uemg.br"
                target="_blank"
                rel="noreferrer"
                className="hover:text-white transition-colors"
              >
                Portal UEMG
              </a>
              <span>•</span>
              <a
                href="https://www.uemg.br/extensao"
                target="_blank"
                rel="noreferrer"
                className="hover:text-white transition-colors"
              >
                PROEX UEMG
              </a>
            </div>
          </div>
        </div>

        {/* Cabeçalho Principal com Identidade Visual UEMG & Extensão */}
        <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-sm no-print">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-4">
            <div className="flex items-center gap-4 sm:gap-6">
              {/* Logo UEMG */}
              <Link href="/" className="flex items-center gap-2" aria-label="Página Inicial UEMG">
                <Image
                  src="/assets/logos/uemg-logo.png"
                  alt="Brasão Oficial da UEMG"
                  width={140}
                  height={45}
                  priority
                  className="h-10 w-auto object-contain"
                />
              </Link>
              
              <div className="hidden md:block h-8 w-[1px] bg-slate-300" aria-hidden="true" />

              {/* Logo Extensão com Fundo Transparente */}
              <Link href="/" className="flex items-center gap-2" aria-label="Portal de Extensão">
                <Image
                  src="/assets/logos/extensao-logo.png"
                  alt="Extensão UEMG"
                  width={130}
                  height={42}
                  priority
                  className="h-10 w-auto object-contain"
                />
              </Link>
            </div>

            <nav className="flex items-center gap-3 sm:gap-5" aria-label="Navegação principal">
              <Link
                href="/#eventos"
                className="text-sm font-medium text-slate-700 hover:text-uemg-blue-700 transition-colors"
              >
                Ações & Eventos
              </Link>
              <Link
                href="/validar"
                className="text-sm font-medium text-slate-700 hover:text-uemg-blue-700 transition-colors"
              >
                Validar Certificado
              </Link>
              <Link
                href="/monitor/checkin"
                className="hidden md:inline-block text-sm font-medium text-slate-700 hover:text-uemg-blue-700 transition-colors"
              >
                Check-in PWA
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-uemg-blue-700 hover:bg-uemg-blue-800 rounded-md transition-colors shadow-sm focus-visible:ring-2 focus-visible:ring-uemg-blue-600"
              >
                Acesso Restrito
              </Link>
            </nav>
          </div>
        </header>

        {/* Conteúdo Principal */}
        <main className="flex-1">
          {children}
        </main>

        {/* Rodapé Institucional */}
        <footer className="bg-uemg-blue-950 text-white border-t border-uemg-blue-900 mt-16 no-print">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div>
                <h3 className="text-sm font-bold text-slate-200 tracking-wider uppercase mb-3">
                  UEMG — Unidade Carangola
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Núcleo de Pesquisa e Extensão (NUPEX)<br />
                  Praça dos Estudantes, 23 — Santa Emília<br />
                  Carangola - MG, CEP 36800-000
                </p>
              </div>

              <div>
                <h3 className="text-sm font-bold text-slate-200 tracking-wider uppercase mb-3">
                  Soberania & Conformidade
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Certificação digital lastreada no ID SIGA corporativo da UEMG.<br />
                  Chancela tipográfica eletrônica conforme Dec. Est. nº 47.222/2017 e Lei nº 14.063/2020.
                </p>
              </div>

              <div>
                <h3 className="text-sm font-bold text-slate-200 tracking-wider uppercase mb-3">
                  Acesso Rápido
                </h3>
                <ul className="text-xs text-slate-400 space-y-1.5">
                  <li>
                    <Link href="/validar" className="hover:text-white transition-colors underline">
                      Conferência de Autenticidade por Código
                    </Link>
                  </li>
                  <li>
                    <a
                      href="https://www.uemg.br/transparencia"
                      target="_blank"
                      rel="noreferrer"
                      className="hover:text-white transition-colors"
                    >
                      Portal da Transparência UEMG
                    </a>
                  </li>
                  <li>
                    <span className="text-slate-500">Operação em Nuvem Custo Zero (Free Tier)</span>
                  </li>
                </ul>
              </div>
            </div>

            <div className="border-t border-uemg-blue-900/60 mt-8 pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
              <p>© {new Date().getFullYear()} Universidade do Estado de Minas Gerais. Todos os direitos reservados.</p>
              <div className="flex items-center gap-2">
                <span className="inline-block w-2 h-2 rounded-full bg-emerald-500" title="Sistema Operacional" />
                <span className="text-slate-400">Banco de Dados Ativo • PostgREST Conectado</span>
              </div>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
