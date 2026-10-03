import { requirePageAuth } from '@/lib/auth/rbac';
import { createClient } from '@/lib/supabase/server';
import { MonitorScannerApp } from './MonitorScannerApp';
import { AlertCircle } from 'lucide-react';

export const metadata = {
  title: 'Credenciamento de Auditório (PWA) | Extensão UEMG',
  description: 'Controle de presença por leitura óptica de QR Codes com funcionamento offline.',
};

export default async function MonitorCheckinPage() {
  // Lógica de Segurança: Apenas monitores, docentes e coordenação podem operar o credenciamento
  await requirePageAuth(['admin_extensao', 'monitor', 'docente']);

  const supabase = createClient();
  const { data: events } = await supabase
    .from('events')
    .select('id, title, workload_hours')
    .in('status', ['aprovado', 'em_andamento'])
    .order('created_at', { ascending: false });

  if (!events || events.length === 0) {
    return (
      <div className="max-w-2xl mx-auto py-12 px-4 text-center space-y-4">
        <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200 text-amber-900 inline-block">
          <AlertCircle className="w-8 h-8 text-amber-600 mx-auto mb-2" />
          <h2 className="text-base font-bold">Nenhuma Ação Homologada em Andamento</h2>
          <p className="text-xs text-amber-800 mt-1 max-w-md">
            No momento não há eventos com status &quot;aprovado&quot; ou &quot;em_andamento&quot; disponíveis para credenciamento. As propostas devem ser homologadas previamente pelo NUPEX.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto py-6 px-4">
      <MonitorScannerApp events={events} />
    </div>
  );
}
