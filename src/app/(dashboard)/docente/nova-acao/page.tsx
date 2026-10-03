import { requirePageAuth } from '@/lib/auth/rbac';
import { NewEventForm } from './NewEventForm';
import { BookOpen } from 'lucide-react';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function NovaAcaoPage() {
  await requirePageAuth(['docente', 'admin_extensao']);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div>
        <div className="flex items-center gap-2 text-xs font-semibold text-uemg-blue-700 uppercase tracking-wider mb-1">
          <BookOpen className="w-4 h-4" />
          Propostas de Extensão • NUPEX Carangola
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-uemg-blue-900 tracking-tight">
          Submissão de Nova Ação Extensionista
        </h1>
        <p className="text-sm text-slate-600 mt-1">
          Preencha os dados da proposta, anexe o comprovante institucional de aprovação e declare a conformidade legal para auditoria da Coordenação.
        </p>
      </div>

      <NewEventForm />
    </div>
  );
}
