// Lógica de Persistência Offline: IndexedDB append-only com garantia de retenção (navigator.storage.persist)

export interface OfflineCheckin {
  id: string; // registration_id
  event_id: string;
  participant_name: string;
  cpf_masked: string;
  checkin_at: string; // ISO 8601 UTC
  synced: boolean;
  synced_at?: string;
}

const DB_NAME = 'uemg_extensao_offline_db';
const DB_VERSION = 1;
const STORE_NAME = 'checkins_queue';

/**
 * Solicita ao navegador permissão de armazenamento persistente (evita descarte em baixa memória)
 */
export async function requestPersistentStorage(): Promise<boolean> {
  if (typeof window !== 'undefined' && navigator.storage && navigator.storage.persist) {
    try {
      const isPersisted = await navigator.storage.persist();
      console.log(`[Storage] Armazenamento persistente concedido: ${isPersisted}`);
      return isPersisted;
    } catch (e) {
      console.warn('[Storage] Falha ao solicitar persistência:', e);
    }
  }
  return false;
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') {
      return reject(new Error('IndexedDB não está disponível em ambiente SSR.'));
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('event_id', 'event_id', { unique: false });
        store.createIndex('synced', 'synced', { unique: false });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Salva um check-in no banco local append-only
 */
export async function saveOfflineCheckin(checkin: OfflineCheckin): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);

    // Se já existir, preserva o primeiro checkin_at (princípio monotônico LEAST)
    const getReq = store.get(checkin.id);
    getReq.onsuccess = () => {
      const existing = getReq.result as OfflineCheckin | undefined;
      const finalCheckin: OfflineCheckin = existing
        ? {
            ...checkin,
            checkin_at:
              new Date(existing.checkin_at) < new Date(checkin.checkin_at)
                ? existing.checkin_at
                : checkin.checkin_at,
          }
        : checkin;

      store.put(finalCheckin);
    };

    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

/**
 * Retorna todos os check-ins pendentes de sincronização para um evento
 */
export async function getPendingCheckins(eventId?: string): Promise<OfflineCheckin[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const req = store.getAll();

    req.onsuccess = () => {
      let results = (req.result as OfflineCheckin[]).filter((item) => !item.synced);
      if (eventId) {
        results = results.filter((item) => item.event_id === eventId);
      }
      resolve(results);
    };
    req.onerror = () => reject(req.error);
  });
}

/**
 * Retorna todos os check-ins locais (sincronizados ou não) para exibição na UI
 */
export async function getAllLocalCheckins(eventId?: string): Promise<OfflineCheckin[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const req = store.getAll();

    req.onsuccess = () => {
      let results = req.result as OfflineCheckin[];
      if (eventId) {
        results = results.filter((item) => item.event_id === eventId);
      }
      // Ordena por horário decrescente
      results.sort((a, b) => new Date(b.checkin_at).getTime() - new Date(a.checkin_at).getTime());
      resolve(results);
    };
    req.onerror = () => reject(req.error);
  });
}

/**
 * Marca uma lista de IDs como sincronizados com o servidor
 */
export async function markCheckinsAsSynced(ids: string[]): Promise<void> {
  if (ids.length === 0) return;
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const now = new Date().toISOString();

    ids.forEach((id) => {
      const req = store.get(id);
      req.onsuccess = () => {
        const item = req.result as OfflineCheckin | undefined;
        if (item) {
          item.synced = true;
          item.synced_at = now;
          store.put(item);
        }
      };
    });

    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

/**
 * Exporta a fila completa em formato JSON para contingência / emergência
 */
export async function exportEmergencyQueueJson(eventId?: string): Promise<string> {
  const checkins = await getAllLocalCheckins(eventId);
  return JSON.stringify(
    {
      exported_at: new Date().toISOString(),
      institution: 'UEMG - Unidade Carangola',
      total_records: checkins.length,
      checkins,
    },
    null,
    2
  );
}
