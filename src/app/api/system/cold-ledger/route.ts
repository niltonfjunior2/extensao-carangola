// Lógica de Soberania Digital: Cold Ledger Offline & Livro-Razão Estático Perpétuo
import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getCurrentProfile } from '@/lib/auth/rbac';
import { maskCPF, maskEmail, formatDisplayDate } from '@/lib/utils';

export async function GET(request: NextRequest) {
  try {
    // 1. Validação Zero Trust
    const profile = await getCurrentProfile();
    if (!profile || profile.role !== 'admin_extensao') {
      return new NextResponse('Acesso restrito à Coordenação de Extensão (admin_extensao).', {
        status: 403,
      });
    }

    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format') || 'csv';

    const supabase = createClient();

    // 2. Extração de todas as certidões e eventos
    const { data: certs, error } = await (supabase.from('certificates') as any)
      .select(`
        id,
        validation_code,
        sha256_hash,
        mandate_snapshot,
        issued_at,
        is_revoked,
        revocation_reason,
        events (
          title,
          siga_id,
          registry_system,
          external_registry_id,
          workload_hours,
          sei_process_number
        ),
        registrations (
          participant_name,
          participant_cpf,
          participant_email
        )
      `)
      .order('issued_at', { ascending: false });

    if (error) {
      return new NextResponse('Falha ao exportar Cold Ledger.', { status: 500 });
    }

    const records = (certs || []).map((c: any) => {
      const evt = c.events || {};
      const reg = c.registrations || {};
      const system = (evt.registry_system || 'SIGA').toUpperCase();
      const code = evt.external_registry_id || evt.siga_id || '';

      return {
        validationCode: c.validation_code,
        system,
        externalId: code,
        eventTitle: evt.title || 'Sem Título',
        workloadHours: evt.workload_hours || 0,
        seiProcess: evt.sei_process_number || 'N/A',
        participantName: reg.participant_name || 'Desconhecido',
        cpfMasked: maskCPF(reg.participant_cpf || ''),
        issuedAt: c.issued_at,
        sha256Hash: c.sha256_hash,
        isRevoked: c.is_revoked ? 'SIM' : 'NAO',
        revocationReason: c.revocation_reason || '',
      };
    });

    // 3. Exportação em Formato CSV
    if (format === 'csv') {
      const headers = [
        'CODIGO_VALIDADOR',
        'SISTEMA_ORIGEM',
        'ID_REGISTRO_INSTITUCIONAL',
        'TITULO_ACAO_EXTENSIONISTA',
        'CARGA_HORARIA',
        'PROCESSO_SEI',
        'NOME_PARTICIPANTE',
        'CPF_MASCARADO_LGPD',
        'DATA_EMISSAO_UTC',
        'HASH_SHA256',
        'REVOGADO',
        'MOTIVO_REVOGACAO',
      ];

      const cleanCsvField = (val: string | number) =>
        `"${String(val).replace(/"/g, '""').replace(/[\r\n]+/g, ' ')}"`;

      const rows = records.map((r: any) => [
        cleanCsvField(r.validationCode),
        cleanCsvField(r.system),
        cleanCsvField(r.externalId),
        cleanCsvField(r.eventTitle),
        r.workloadHours,
        cleanCsvField(r.seiProcess),
        cleanCsvField(r.participantName),
        cleanCsvField(r.cpfMasked),
        cleanCsvField(r.issuedAt),
        cleanCsvField(r.sha256Hash),
        cleanCsvField(r.isRevoked),
        cleanCsvField(r.revocationReason),
      ]);

      const csvContent = [headers.join(','), ...rows.map((r: any) => r.join(','))].join('\n');

      return new NextResponse(csvContent, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="livro_registro_extensao_carangola_${new Date()
            .toISOString()
            .slice(0, 10)}.csv"`,
        },
      });
    }

    // 4. Exportação do Validador Estático Independente (validador_offline.html)
    // 100% Autocontido: Funciona sem internet em qualquer pendrive ou PC
    const embeddedJson = JSON.stringify(records);
    const htmlContent = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>Validador Offline de Certidões — UEMG Carangola (Cold Ledger)</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f8fafc; color: #1e293b; margin: 0; padding: 24px; }
    .card { max-width: 900px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; padding: 32px; box-shadow: 0 4px 20px rgba(0,0,0,0.06); }
    .header { text-align: center; border-bottom: 2px solid #0b4382; padding-bottom: 20px; margin-bottom: 24px; }
    h1 { color: #0b4382; margin: 0 0 8px; font-size: 24px; }
    p.subtitle { color: #64748b; margin: 0; font-size: 13px; }
    .badge { display: inline-block; background: #eff6ff; color: #0b4382; padding: 4px 12px; border-radius: 9999px; font-size: 11px; font-weight: 700; text-transform: uppercase; margin-bottom: 12px; }
    .search-box { display: flex; gap: 10px; margin-bottom: 24px; }
    input { flex: 1; padding: 14px 16px; border: 1px solid #cbd5e1; border-radius: 10px; font-size: 15px; font-family: monospace; text-transform: uppercase; }
    input:focus { outline: 2px solid #0b4382; }
    button { background: #0b4382; color: #ffffff; border: none; padding: 14px 24px; border-radius: 10px; font-weight: 700; cursor: pointer; }
    button:hover { background: #072a53; }
    .result { display: none; padding: 24px; border-radius: 12px; margin-top: 20px; border: 1px solid #cbd5e1; }
    .result.valid { background: #f0fdf4; border-color: #86efac; color: #166534; }
    .result.revoked { background: #fef2f2; border-color: #fca5a5; color: #991b1b; }
    .result.not-found { background: #fffbeb; border-color: #fde68a; color: #92400e; }
    .meta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; font-size: 13px; margin-top: 14px; }
    .meta-item { background: #ffffff; padding: 10px; border-radius: 8px; border: 1px solid #e2e8f0; }
    .meta-label { font-size: 11px; color: #64748b; text-transform: uppercase; font-weight: 700; }
    .meta-val { font-weight: 600; color: #0f172a; margin-top: 2px; }
    .footer { text-align: center; margin-top: 30px; font-size: 11px; color: #94a3b8; }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <span class="badge">UEMG Carangola • NUPEX</span>
      <h1>Validador Estático Offline de Certidões (Cold Ledger)</h1>
      <p class="subtitle">Este arquivo opera de forma 100% desconectada da internet. Os registros e chaves criptográficas foram embutidos localmente na exportação de custódia perpétua.</p>
    </div>

    <div class="search-box">
      <input type="text" id="searchInput" placeholder="Digite o Código Verificador (Ex: CAR-2026-A1B2-C3D4)" autofocus>
      <button onclick="searchCert()">Consultar Offline</button>
    </div>

    <div id="resultBox" class="result">
      <div id="resultContent"></div>
    </div>

    <div class="footer">
      Soberania Digital e Custódia Perpétua • Conforme Dec. Est. 47.222/2017 e Lei 14.063/2020 • Total de certidões arquivadas: <strong id="totalCount">0</strong>
    </div>
  </div>

  <script>
    const LEDGER_DATA = ${embeddedJson};
    document.getElementById('totalCount').innerText = LEDGER_DATA.length;

    function escapeHtml(str) {
      if (!str) return '';
      return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
    }

    document.getElementById('searchInput').addEventListener('keyup', function(e) {
      if (e.key === 'Enter') searchCert();
    });

    function searchCert() {
      const query = document.getElementById('searchInput').value.trim().toUpperCase();
      const box = document.getElementById('resultBox');
      const content = document.getElementById('resultContent');

      if (!query) {
        alert('Por favor, informe o código verificador constante na certidão.');
        return;
      }

      box.className = 'result';
      box.style.display = 'block';

      const found = LEDGER_DATA.find(r => r.validationCode.toUpperCase() === query);

      if (!found) {
        box.classList.add('not-found');
        content.innerHTML = '<h3>⚠️ Certidão Não Localizada no Cold Ledger</h3><p>Nenhum registro com o código <strong>' + escapeHtml(query) + '</strong> foi encontrado na base offline local exportada.</p>';
        return;
      }

      if (found.isRevoked === 'SIM') {
        box.classList.add('revoked');
        content.innerHTML = '<h3>🚫 CERTIDÃO CANCELADA / REVOGADA</h3>' +
          '<p>Este documento foi revogado administrativamente e perdeu sua fé pública.</p>' +
          (found.revocationReason ? '<p><strong>Motivo:</strong> ' + escapeHtml(found.revocationReason) + '</p>' : '') +
          renderDetails(found);
      } else {
        box.classList.add('valid');
        content.innerHTML = '<h3>✅ CERTIDÃO AUTÊNTICA E VÁLIDA</h3>' +
          '<p>Registro oficial conferido com fé pública perante o Cold Ledger da UEMG Unidade Carangola.</p>' +
          renderDetails(found);
      }
    }

    function renderDetails(item) {
      return '<div class="meta-grid">' +
        '<div class="meta-item"><div class="meta-label">Participante (LGPD)</div><div class="meta-val">' + escapeHtml(item.participantName) + ' (' + escapeHtml(item.cpfMasked) + ')</div></div>' +
        '<div class="meta-item"><div class="meta-label">Ação Extensionista</div><div class="meta-val">' + escapeHtml(item.eventTitle) + ' (' + escapeHtml(item.workloadHours) + 'h)</div></div>' +
        '<div class="meta-item"><div class="meta-label">Registro Institucional</div><div class="meta-val">' + escapeHtml(item.system) + ': ' + escapeHtml(item.externalId) + '</div></div>' +
        '<div class="meta-item"><div class="meta-label">Processo SEI-MG</div><div class="meta-val">' + escapeHtml(item.seiProcess) + '</div></div>' +
        '<div class="meta-item" style="grid-column: span 2"><div class="meta-label">Hash SHA-256 de Integridade</div><div class="meta-val" style="font-family: monospace; font-size: 11px; word-break: break-all;">' + escapeHtml(item.sha256Hash) + '</div></div>' +
      '</div>';
    }
  </script>
</body>
</html>`;

    return new NextResponse(htmlContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Content-Disposition': `attachment; filename="validador_offline_uemg_carangola_${new Date()
          .toISOString()
          .slice(0, 10)}.html"`,
      },
    });
  } catch (err: unknown) {
    return new NextResponse('Erro interno ao gerar Cold Ledger.', { status: 500 });
  }
}
