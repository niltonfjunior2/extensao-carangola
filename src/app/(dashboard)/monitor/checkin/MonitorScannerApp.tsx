'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { verifyCredential, type SignedCredential } from '@/lib/crypto/ed25519';
import {
  saveOfflineCheckin,
  getPendingCheckins,
  getAllLocalCheckins,
  markCheckinsAsSynced,
  exportEmergencyQueueJson,
  type OfflineCheckin,
} from '@/lib/offline/indexedDb';
import { playFeedbackSound } from '@/lib/audio';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import {
  Camera,
  CameraOff,
  Wifi,
  WifiOff,
  RefreshCw,
  Download,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Users,
  ShieldCheck,
  Building,
} from 'lucide-react';

interface EventOption {
  id: string;
  title: string;
  workload_hours: number;
}

interface MonitorScannerAppProps {
  events: EventOption[];
}

export function MonitorScannerApp({ events }: MonitorScannerAppProps) {
  const [selectedEventId, setSelectedEventId] = useState<string>(events[0]?.id || '');
  const [isScanning, setIsScanning] = useState(false);
  const [localCheckins, setLocalCheckins] = useState<OfflineCheckin[]>([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastScanResult, setLastScanResult] = useState<{
    status: 'success' | 'error';
    name?: string;
    cpf?: string;
    message: string;
  } | null>(null);

  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);

  const refreshLocalData = useCallback(async () => {
    if (!selectedEventId) return;
    const all = await getAllLocalCheckins(selectedEventId);
    const pending = await getPendingCheckins(selectedEventId);
    setLocalCheckins(all);
    setPendingCount(pending.length);
  }, [selectedEventId]);

  // Sincroniza lotes pendentes com o servidor
  const triggerBatchSync = useCallback(async () => {
    if (isSyncing || !selectedEventId) return;
    try {
      setIsSyncing(true);
      const pending = await getPendingCheckins(selectedEventId);
      if (pending.length === 0) {
        setIsSyncing(false);
        return;
      }

      const res = await fetch('/api/checkin/batch-sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventId: selectedEventId,
          items: pending.map((p) => ({ id: p.id, checkin_at: p.checkin_at })),
        }),
      });

      const data = await res.json();
      if (data.success && Array.isArray(data.syncedIds)) {
        await markCheckinsAsSynced(data.syncedIds);
        await refreshLocalData();
      }
    } catch (err) {
      console.warn('[Sync] Falha na sincronização em lote:', err);
    } finally {
      setIsSyncing(false);
    }
  }, [isSyncing, selectedEventId, refreshLocalData]);

  // Hook reativo de rede que dispara auto-sync quando a conexão retorna
  const { isOnline } = useNetworkStatus(triggerBatchSync);

  // Recarrega lista e contadores locais ao trocar de evento
  useEffect(() => {
    refreshLocalData();
  }, [selectedEventId, refreshLocalData]);

  // Processa o QR Code lido pela câmera
  const handleQrCodeDecoded = async (decodedText: string) => {
    try {
      const parsed: SignedCredential = JSON.parse(decodedText);
      const verification = verifyCredential(parsed);

      if (!verification.valid || !verification.payload) {
        playFeedbackSound('error');
        setLastScanResult({
          status: 'error',
          message: verification.reason || 'Assinatura criptográfica inválida!',
        });
        return;
      }

      const { payload } = verification;

      if (payload.event_id !== selectedEventId) {
        playFeedbackSound('error');
        setLastScanResult({
          status: 'error',
          message: 'Esta credencial pertence a outra ação extensionista!',
        });
        return;
      }

      // 1. Grava no IndexedDB local (Append-Only)
      const nowIso = new Date().toISOString();
      await saveOfflineCheckin({
        id: payload.reg_id,
        event_id: payload.event_id,
        participant_name: payload.name,
        cpf_masked: payload.cpf_masked,
        checkin_at: nowIso,
        synced: false,
      });

      playFeedbackSound('success');
      setLastScanResult({
        status: 'success',
        name: payload.name,
        cpf: payload.cpf_masked,
        message: 'Presença registrada localmente com sucesso!',
      });

      await refreshLocalData();

      // 2. Se online, dispara sincronização de fundo
      if (navigator.onLine) {
        triggerBatchSync();
      }
    } catch (err: any) {
      playFeedbackSound('error');
      setLastScanResult({
        status: 'error',
        message: 'QR Code ilegível ou em formato não institucional.',
      });
    }
  };

  // Inicia ou para a câmera do leitor
  const toggleCamera = async () => {
    if (isScanning) {
      if (html5QrCodeRef.current) {
        try {
          await html5QrCodeRef.current.stop();
          html5QrCodeRef.current.clear();
        } catch (e) {
          // Ignora
        }
      }
      setIsScanning(false);
    } else {
      setIsScanning(true);
      setLastScanResult(null);

      setTimeout(async () => {
        try {
          const html5QrCode = new Html5Qrcode('qr-reader-container');
          html5QrCodeRef.current = html5QrCode;

          await html5QrCode.start(
            { facingMode: 'environment' },
            {
              fps: 10,
              qrbox: { width: 250, height: 250 },
            },
            (decodedText) => {
              handleQrCodeDecoded(decodedText);
            },
            () => {
              // frame sem QR Code
            }
          );
        } catch (err) {
          console.error('[Camera] Erro ao iniciar câmera:', err);
          setIsScanning(false);
          setLastScanResult({
            status: 'error',
            message: 'Não foi possível acessar a câmera. Verifique as permissões do dispositivo.',
          });
        }
      }, 200);
    }
  };

  // Exportação de Emergência / Contingência
  const handleExportEmergency = async () => {
    const jsonStr = await exportEmergencyQueueJson(selectedEventId);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `contingencia_checkins_${selectedEventId.slice(0, 8)}_${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const selectedEvent = events.find((e) => e.id === selectedEventId);

  return (
    <div className="space-y-6">
      {/* Barra de Status e Conexão Superior */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-6 shadow-soft flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Building className="w-5 h-5 text-uemg-blue-700" />
            <h1 className="text-lg font-bold text-slate-900">
              Credenciamento de Auditório (PWA Offline)
            </h1>
          </div>
          <p className="text-xs text-slate-500">
            Validação instantânea por assinatura assimétrica Ed25519 e persistência local no aparelho.
          </p>
        </div>

        {/* Indicador de Rede & Botão Sincronizar */}
        <div className="flex items-center gap-3">
          <div
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${
              isOnline
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                : 'bg-amber-50 text-amber-700 border border-amber-300 animate-pulse'
            }`}
          >
            {isOnline ? (
              <>
                <Wifi className="w-3.5 h-3.5" />
                Conectado
              </>
            ) : (
              <>
                <WifiOff className="w-3.5 h-3.5" />
                Modo Offline Ativo
              </>
            )}
          </div>

          <button
            type="button"
            onClick={triggerBatchSync}
            disabled={isSyncing || !isOnline || pendingCount === 0}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-uemg-blue-50 text-uemg-blue-700 hover:bg-uemg-blue-100 disabled:opacity-50 text-xs font-semibold transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
            Sincronizar ({pendingCount})
          </button>
        </div>
      </div>

      {/* Seletor de Evento */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-6 shadow-soft space-y-4">
        <div>
          <label
            htmlFor="eventSelector"
            className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1"
          >
            Selecione a Ação Extensionista
          </label>
          <select
            id="eventSelector"
            value={selectedEventId}
            onChange={(e) => setSelectedEventId(e.target.value)}
            disabled={isScanning}
            className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm font-semibold text-slate-900 bg-white focus:ring-2 focus:ring-uemg-blue-700 outline-none"
          >
            {events.map((evt) => (
              <option key={evt.id} value={evt.id}>
                {evt.title} ({evt.workload_hours}h)
              </option>
            ))}
          </select>
        </div>

        {/* Métricas Rápidas */}
        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
            <span className="text-[11px] text-slate-500 block">Total Registrados</span>
            <span className="text-lg font-bold text-slate-900">{localCheckins.length}</span>
          </div>
          <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100">
            <span className="text-[11px] text-emerald-700 block">Sincronizados</span>
            <span className="text-lg font-bold text-emerald-700">
              {localCheckins.length - pendingCount}
            </span>
          </div>
          <div className="p-3 bg-amber-50 rounded-xl border border-amber-100">
            <span className="text-[11px] text-amber-700 block">Pendentes de Envio</span>
            <span className="text-lg font-bold text-amber-700">{pendingCount}</span>
          </div>
        </div>
      </div>

      {/* Área da Câmera / Scanner */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-soft space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2">
            <Camera className="w-5 h-5 text-uemg-blue-700" />
            <h2 className="text-base font-bold text-slate-900">Leitor Óptico por Câmera</h2>
          </div>

          <button
            type="button"
            onClick={toggleCamera}
            className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs shadow-md transition-all ${
              isScanning
                ? 'bg-red-600 hover:bg-red-700 text-white'
                : 'bg-uemg-blue-700 hover:bg-uemg-blue-800 text-white'
            }`}
          >
            {isScanning ? (
              <>
                <CameraOff className="w-4 h-4" />
                Desativar Câmera
              </>
            ) : (
              <>
                <Camera className="w-4 h-4" />
                Ativar Scanner de Entrada
              </>
            )}
          </button>
        </div>

        {/* Viewport da Câmera com Guia de Enquadramento */}
        <div className="relative flex flex-col items-center justify-center">
          <div
            id="qr-reader-container"
            className={`w-full max-w-sm overflow-hidden rounded-2xl border-2 ${
              isScanning ? 'border-uemg-blue-600 bg-black min-h-[300px]' : 'hidden'
            }`}
          />

          {!isScanning && (
            <div className="p-10 text-center space-y-3 border-2 border-dashed border-slate-200 rounded-2xl w-full max-w-sm bg-slate-50/50">
              <Camera className="w-12 h-12 text-slate-300 mx-auto" />
              <p className="text-xs font-semibold text-slate-600">
                Toque em "Ativar Scanner" para iniciar a conferência contínua na porta do auditório.
              </p>
            </div>
          )}
        </div>

        {/* Card de Feedback do Último Scan */}
        {lastScanResult && (
          <div
            className={`p-4 rounded-xl border flex items-start gap-3 transition-all ${
              lastScanResult.status === 'success'
                ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                : 'bg-red-50 border-red-300 text-red-900'
            }`}
          >
            {lastScanResult.status === 'success' ? (
              <CheckCircle2 className="w-6 h-6 text-emerald-600 flex-shrink-0 mt-0.5" />
            ) : (
              <XCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
            )}
            <div className="space-y-0.5 flex-1">
              <p className="font-bold text-sm">
                {lastScanResult.status === 'success' ? 'Credencial Válida!' : 'Acesso Negado!'}
              </p>
              {lastScanResult.name && (
                <p className="text-xs font-semibold text-slate-800">
                  {lastScanResult.name} (CPF: {lastScanResult.cpf})
                </p>
              )}
              <p className="text-xs">{lastScanResult.message}</p>
            </div>
          </div>
        )}
      </div>

      {/* Histórico Local & Válvula de Contingência */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-soft space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-slate-700" />
            <h3 className="text-sm font-bold text-slate-900">
              Últimas Presenças Registradas neste Dispositivo
            </h3>
          </div>

          <button
            type="button"
            onClick={handleExportEmergency}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-sm transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            Exportar Fila de Emergência (JSON)
          </button>
        </div>

        {localCheckins.length > 0 ? (
          <div className="divide-y divide-slate-100 max-h-60 overflow-y-auto">
            {localCheckins.slice(0, 20).map((chk) => (
              <div key={chk.id} className="py-2.5 flex items-center justify-between text-xs">
                <div>
                  <span className="font-bold text-slate-900 block">{chk.participant_name}</span>
                  <span className="text-slate-500 font-mono text-[11px]">{chk.cpf_masked}</span>
                </div>
                <div className="text-right space-y-0.5">
                  <span
                    className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold ${
                      chk.synced
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {chk.synced ? 'Sincronizado' : 'Pendente'}
                  </span>
                  <p className="text-[10px] text-slate-400">
                    {new Date(chk.checkin_at).toLocaleTimeString('pt-BR')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-slate-400 text-center py-4">
            Nenhum check-in registrado neste dispositivo ainda.
          </p>
        )}
      </div>
    </div>
  );
}
