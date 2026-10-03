import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getCurrentProfile } from '@/lib/auth/rbac';
import { calculateSHA256 } from '@/lib/crypto';
import { timingSafeEqual } from 'crypto';

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();
    const authHeaderSecret = request.headers.get('x-backup-secret');
    const expectedSecret = process.env.SYSTEM_BACKUP_SECRET;

    // 1. Verificação Dupla: Sessão de Administrador OU Secret Token
    let isAuthorized = false;
    let authorId: string | null = null;

    if (expectedSecret && authHeaderSecret) {
      const bufExpected = Buffer.from(expectedSecret);
      const bufReceived = Buffer.from(authHeaderSecret);
      if (bufExpected.length === bufReceived.length && timingSafeEqual(bufExpected, bufReceived)) {
        isAuthorized = true;
      }
    }

    if (!isAuthorized) {
      const profile = await getCurrentProfile();
      if (profile && profile.role === 'admin_extensao') {
        isAuthorized = true;
        authorId = profile.id;
      }
    }

    if (!isAuthorized) {
      return new NextResponse(
        JSON.stringify({ success: false, error: 'Acesso negado: Requer privilégios de admin_extensao ou secret token válido.' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 2. Extração Serializada de Todas as Tabelas
    const [profilesRes, mandatesRes, eventsRes, sessionsRes, registrationsRes, certsRes, auditLogsRes] =
      await Promise.all([
        supabase.from('profiles').select('*'),
        supabase.from('mandates').select('*'),
        supabase.from('events').select('*'),
        supabase.from('event_sessions').select('*'),
        supabase.from('registrations').select('*'),
        supabase.from('certificates').select('*'),
        supabase.from('event_audit_logs').select('*'),
      ]);

    const backupData = {
      profiles: profilesRes.data || [],
      mandates: mandatesRes.data || [],
      events: eventsRes.data || [],
      event_sessions: sessionsRes.data || [],
      registrations: registrationsRes.data || [],
      certificates: certsRes.data || [],
      event_audit_logs: auditLogsRes.data || [],
    };

    const totalRecords = Object.values(backupData).reduce((acc, curr) => acc + curr.length, 0);
    const nowIso = new Date().toISOString();

    // 3. Cálculo Determinístico do Checksum SHA-256 do Acervo
    const dataString = JSON.stringify(backupData);
    const checksum = calculateSHA256(Buffer.from(dataString));

    const payload = {
      system: 'Portal de Extensão Universitária — UEMG Unidade Carangola',
      unit: 'Núcleo de Pesquisa e Extensão (NUPEX)',
      schema_version: '2.0.0',
      exported_at: nowIso,
      checksum_sha256: checksum,
      table_counts: {
        profiles: backupData.profiles.length,
        mandates: backupData.mandates.length,
        events: backupData.events.length,
        event_sessions: backupData.event_sessions.length,
        registrations: backupData.registrations.length,
        certificates: backupData.certificates.length,
        event_audit_logs: backupData.event_audit_logs.length,
        total: totalRecords,
      },
      data: backupData,
    };

    // 4. Grava na Tabela de Custódia e Histórico de Backups
    await (supabase.from('system_backups') as any).insert({
      created_by: authorId,
      checksum_sha256: checksum,
      total_records: totalRecords,
      backup_type: authHeaderSecret ? 'automated_cron' : 'manual_coordinator',
      metadata: {
        table_counts: payload.table_counts,
        schema_version: payload.schema_version,
      },
    });

    const filename = `backup_extensao_carangola_${nowIso.slice(0, 10)}_${checksum.slice(0, 8)}.json`;

    return new NextResponse(JSON.stringify(payload, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'X-Checksum-SHA256': checksum,
      },
    });
  } catch (err: unknown) {
    return new NextResponse(
      JSON.stringify({ success: false, error: 'Erro ao gerar backup do sistema.' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
