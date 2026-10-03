// Lógica de Segurança: Reconciliação em lote com idempotência e monotonicidade temporal (LEAST)
import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { resolveEarliestTimestamp } from '@/lib/utils';
import { z } from 'zod';

const batchSyncSchema = z.object({
  eventId: z.string().uuid(),
  items: z.array(
    z.object({
      id: z.string().uuid(),
      checkin_at: z.string().datetime(),
    })
  ),
});

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();

    // 1. Validação estrita de sessão e perfil (Zero Trust)
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Acesso não autorizado. Sessão expirada.' },
        { status: 401 }
      );
    }

    const { data: profile } = await (supabase.from('profiles') as any)
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || !['admin_extensao', 'docente', 'monitor'].includes(profile.role)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Privilégios insuficientes. Apenas monitores e coordenação podem sincronizar presenças.',
        },
        { status: 403 }
      );
    }

    // 2. Validação do payload
    const body = await request.json();
    const parsed = batchSyncSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Payload de sincronização inválido.' },
        { status: 400 }
      );
    }

    const { eventId, items } = parsed.data;
    if (items.length === 0) {
      return NextResponse.json({ success: true, syncedCount: 0, syncedIds: [] });
    }

    const syncedIds: string[] = [];
    const nowIso = new Date().toISOString();

    // 3. Processamento monotônico de cada check-in
    for (const item of items) {
      // Busca registro atual para garantir preservação do menor timestamp
      const { data: currentReg } = await (supabase.from('registrations') as any)
        .select('id, attended, checkin_at, audit_trail')
        .eq('id', item.id)
        .eq('event_id', eventId)
        .single();

      if (!currentReg) continue;

      // Monotonicidade Pura: Preserva sempre a primeira entrada cronológica
      const effectiveCheckinAt = resolveEarliestTimestamp(currentReg.checkin_at, item.checkin_at);

      const existingAudit = Array.isArray(currentReg.audit_trail) ? currentReg.audit_trail : [];
      const newAuditEntry = {
        action: 'checkin_synced',
        monitor_id: user.id,
        device_checkin_at: item.checkin_at,
        effective_checkin_at: effectiveCheckinAt,
        synced_at: nowIso,
      };

      const { error: updateErr } = await (supabase.from('registrations') as any)
        .update({
          attended: true,
          checkin_at: effectiveCheckinAt,
          synced_by_monitor_id: user.id,
          audit_trail: [...existingAudit, newAuditEntry],
        })
        .eq('id', item.id);

      if (!updateErr) {
        syncedIds.push(item.id);
      }
    }

    return NextResponse.json({
      success: true,
      syncedCount: syncedIds.length,
      syncedIds,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || 'Falha na sincronização de presenças.' },
      { status: 500 }
    );
  }
}
