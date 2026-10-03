'use client';

import React, { useState } from 'react';
import {
  Download,
  FileSpreadsheet,
  FileCode,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Upload,
  RefreshCw,
  HardDrive,
  Lock,
} from 'lucide-react';
import { StatusAlert } from '@/components/ui/StatusAlert';
import { calculateSHA256 } from '@/lib/crypto';
import { formatDisplayDate } from '@/lib/utils';

interface SystemBackupRecord {
  id: string;
  created_at: string;
  checksum_sha256: string;
  total_records: number;
  backup_type: string;
}

interface BackupControlPanelProps {
  recentBackups: SystemBackupRecord[];
}

export function BackupControlPanel({ recentBackups }: BackupControlPanelProps) {
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState<{
    valid: boolean;
    declaredChecksum: string;
    calculatedChecksum: string;
    system?: string;
    exportedAt?: string;
    totalRecords?: number;
    error?: string;
  } | null>(null);

  const handleVerifyFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsVerifying(true);
    setVerificationResult(null);

    try {
      const text = await file.text();
      const parsed = JSON.parse(text);

      if (!parsed.checksum_sha256 || !parsed.data) {
        setVerificationResult({
          valid: false,
          declaredChecksum: 'Não informada',
          calculatedChecksum: 'N/A',
          error: 'Estrutura de arquivo inválida: ausência de checksum_sha256 ou bloco data.',
        });
        setIsVerifying(false);
        return;
      }

      // Calcula o SHA-256 do bloco de dados
      const dataString = JSON.stringify(parsed.data);
      const encoder = new TextEncoder();
      const dataBuffer = encoder.encode(dataString);

      // Usando Web Crypto API nativa do navegador
      const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const calculatedHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');

      const isValid = calculatedHex === parsed.checksum_sha256;

      setVerificationResult({
        valid: isValid,
        declaredChecksum: parsed.checksum_sha256,
        calculatedChecksum: calculatedHex,
        system: parsed.system,
        exportedAt: parsed.exported_at,
        totalRecords: parsed.table_counts?.total || 0,
      });
    } catch (err: any) {
      setVerificationResult({
        valid: false,
        declaredChecksum: 'N/A',
        calculatedChecksum: 'N/A',
        error: 'Não foi possível ler ou analisar o arquivo JSON fornecido.',
      });
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Grade de Ferramentas de Soberania Digital */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Card 1: Backup Completo com Checksum */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-soft p-6 space-y-5 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="w-12 h-12 rounded-xl bg-uemg-blue-50 text-uemg-blue-700 flex items-center justify-center border border-uemg-blue-100">
              <HardDrive className="w-6 h-6" aria-hidden="true" />
            </div>
            <h2 className="text-lg font-bold text-slate-900">
              Backup Nativo do Banco de Dados (JSON Assinado)
            </h2>
            <p className="text-xs text-slate-600 leading-relaxed">
              Exporta todas as tabelas (perfis, mandatos, eventos, sessões, inscrições, certidões e logs) com metadados estruturados e carimbo criptográfico SHA-256 de integridade.
            </p>
          </div>

          <div className="pt-2">
            <a
              href="/api/system/backup"
              download
              className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-uemg-blue-700 hover:bg-uemg-blue-800 text-white font-bold text-xs shadow-sm transition-all hover:shadow active:scale-95"
            >
              <Download className="w-4 h-4" aria-hidden="true" />
              Download do Backup Completo (.JSON)
            </a>
            <p className="text-[10px] text-slate-400 text-center mt-2">
              Recomendado para anexar aos processos SEI de transição de gestão e auditoria do Estado.
            </p>
          </div>
        </div>

        {/* Card 2: Cold Ledger Offline */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-soft p-6 space-y-5 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="w-12 h-12 rounded-xl bg-amber-50 text-uemg-gold-600 flex items-center justify-center border border-amber-200">
              <Lock className="w-6 h-6" aria-hidden="true" />
            </div>
            <h2 className="text-lg font-bold text-slate-900">
              Cold Ledger Perpétuo (Offline / Standalone)
            </h2>
            <p className="text-xs text-slate-600 leading-relaxed">
              Exportação desacoplada do Livro-Razão em CSV com mascaramento LGPD e da ferramenta de validação estática autocontida, funcional em qualquer computador sem sinal de internet.
            </p>
          </div>

          <div className="space-y-2 pt-2">
            <a
              href="/api/system/cold-ledger?format=html"
              download
              className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-black text-white font-bold text-xs shadow-sm transition-all active:scale-95"
            >
              <FileCode className="w-4 h-4 text-uemg-gold" aria-hidden="true" />
              Baixar Validador Offline (.HTML Autocontido)
            </a>

            <a
              href="/api/system/cold-ledger?format=csv"
              download
              className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs border border-slate-300 transition-colors"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" aria-hidden="true" />
              Baixar Livro de Registro Geral (.CSV)
            </a>
          </div>
        </div>
      </div>

      {/* Card 3: Auditoria e Verificador de Integridade */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-soft p-6 sm:p-8 space-y-6">
        <div className="border-b border-slate-200 pb-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-semibold mb-1">
            <ShieldCheck className="w-3.5 h-3.5" aria-hidden="true" />
            Custódia & Reconciliação Criptográfica
          </div>
          <h2 className="text-xl font-bold text-slate-900">
            Verificador de Integridade de Arquivo de Backup
          </h2>
          <p className="text-xs text-slate-600 mt-1">
            Selecione um arquivo de backup previamente gerado para validar matematicamente se os dados sofreram qualquer tipo de alteração, corrupção ou fraude desde sua expedição.
          </p>
        </div>

        <div>
          <label
            htmlFor="backup-file"
            className="border-2 border-dashed border-slate-300 hover:border-uemg-blue-500 rounded-2xl p-6 flex flex-col items-center justify-center cursor-pointer transition-colors bg-slate-50/50 hover:bg-slate-50"
          >
            <Upload className="w-8 h-8 text-slate-400 mb-2" aria-hidden="true" />
            <span className="text-sm font-semibold text-slate-700">
              Clique para selecionar o arquivo de backup (.JSON)
            </span>
            <span className="text-xs text-slate-400 mt-0.5">
              O cálculo do hash SHA-256 é realizado instantaneamente na memória do seu navegador
            </span>
            <input
              id="backup-file"
              type="file"
              accept=".json"
              onChange={handleVerifyFile}
              className="sr-only"
            />
          </label>
        </div>

        {isVerifying && (
          <div className="flex items-center justify-center gap-2 text-xs text-slate-500 py-4">
            <RefreshCw className="w-4 h-4 animate-spin text-uemg-blue-700" aria-hidden="true" />
            <span>Calculando checksum SHA-256 das tabelas...</span>
          </div>
        )}

        {verificationResult && (
          <div
            role="alert"
            className={`p-5 rounded-xl border space-y-3 ${
              verificationResult.valid
                ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                : 'bg-red-50 border-red-300 text-red-900'
            }`}
          >
            <div className="flex items-center gap-2 font-bold text-sm">
              {verificationResult.valid ? (
                <>
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" aria-hidden="true" />
                  <span>BACKUP ÍNTEGRO: Checksum SHA-256 Confirmado com Sucesso!</span>
                </>
              ) : (
                <>
                  <AlertTriangle className="w-5 h-5 text-red-600" aria-hidden="true" />
                  <span>ALERTA DE SEGURANÇA: Checksum Divergente ou Arquivo Corrompido!</span>
                </>
              )}
            </div>

            {verificationResult.error ? (
              <p className="text-xs text-red-700">{verificationResult.error}</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-white/70 p-3 rounded-lg border border-slate-200">
                <div>
                  <span className="block text-[10px] text-slate-500 font-semibold uppercase">
                    Data de Exportação
                  </span>
                  <span className="font-semibold text-slate-800">
                    {formatDisplayDate(verificationResult.exportedAt)}
                  </span>
                </div>

                <div>
                  <span className="block text-[10px] text-slate-500 font-semibold uppercase">
                    Total de Registros
                  </span>
                  <span className="font-bold text-slate-900">
                    {verificationResult.totalRecords} itens
                  </span>
                </div>

                <div className="sm:col-span-2 font-mono text-[11px] space-y-1">
                  <div>
                    <span className="text-slate-500 block text-[10px]">Hash Declarado no Arquivo:</span>
                    <span className="text-slate-800 break-all select-all font-bold">
                      {verificationResult.declaredChecksum}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">Hash Calculado em Memória:</span>
                    <span
                      className={`break-all select-all font-bold ${
                        verificationResult.valid ? 'text-emerald-700' : 'text-red-700'
                      }`}
                    >
                      {verificationResult.calculatedChecksum}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Histórico Recente de Backups Gravados */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-soft overflow-hidden">
        <div className="p-5 border-b border-slate-200 bg-slate-50">
          <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
            Histórico Imutável de Backups e Custódias Registradas
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 text-slate-600 font-semibold border-b border-slate-200">
              <tr>
                <th className="p-3">Data e Hora (UTC)</th>
                <th className="p-3">Tipo de Backup</th>
                <th className="p-3">Total de Registros</th>
                <th className="p-3">Checksum SHA-256</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {recentBackups.length > 0 ? (
                recentBackups.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-50">
                    <td className="p-3 font-medium text-slate-800">{formatDisplayDate(b.created_at)}</td>
                    <td className="p-3 capitalize font-semibold text-slate-600">{b.backup_type}</td>
                    <td className="p-3 font-bold text-slate-900">{b.total_records}</td>
                    <td className="p-3 font-mono text-[11px] text-slate-500 truncate max-w-[200px]" title={b.checksum_sha256}>
                      {b.checksum_sha256}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="p-6 text-center text-slate-500">
                    Nenhum backup manual ou automatizado registrado ainda.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
