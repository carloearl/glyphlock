/**
 * OFFLINE OPERATION QUEUE — IndexedDB persistence
 *
 * This store preserves non-financial operational work for manager review.
 * Payment authorization, capture, refunds, payouts, settlement, and card data
 * are deliberately prohibited from browser-queued replay.
 */

const FINANCIAL_FIELD_PATTERN = /(amount|total|payment|card|processor|approval|refund|payout|settlement|bank|cash|charge|intent|checkout|cvv|cvc|track)/i;

function assertNonFinancialPayload(payload) {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    throw new TypeError('Offline operation payload must be an object.');
  }

  const forbiddenField = Object.keys(payload).find((key) => FINANCIAL_FIELD_PATTERN.test(key));
  if (forbiddenField) {
    throw new Error(`Financial field ${forbiddenField} cannot be queued offline.`);
  }

  if (!payload.operation_type || typeof payload.operation_type !== 'string') {
    throw new Error('Offline operations require an operation_type for manager review.');
  }
}

// Simple IndexedDB wrapper without external dependencies
class OfflineDB {
  constructor() {
    this.dbName = 'GlyphLockOfflineDB';
    this.version = 1;
    this.db = null;
  }

  async init() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve(this.db);
      };
      
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains('pendingTransactions')) {
          db.createObjectStore('pendingTransactions', { keyPath: 'id', autoIncrement: true });
        }
      };
    });
  }

  async add(storeName, data) {
    if (!this.db) await this.init();
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.add(data);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async getAll(storeName) {
    if (!this.db) await this.init();
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async update(storeName, data) {
    if (!this.db) await this.init();
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.put(data);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async delete(storeName, id) {
    if (!this.db) await this.init();
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.delete(id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }
}

const db = new OfflineDB();

export const OfflineQueue = {
  addOperation: async (payload) => {
    assertNonFinancialPayload(payload);
    const id = await db.add('pendingTransactions', {
      ...payload,
      created_at: new Date().toISOString(),
      status: 'pending',
      sync_policy: 'manual_manager_review',
      offline_id: crypto.randomUUID(),
    });
    return id;
  },

  // Backward-compatible name. The same non-financial gate applies, so legacy
  // callers cannot turn a browser queue into an unattended payment executor.
  addTransaction: async (payload) => OfflineQueue.addOperation(payload),

  getPending: async () => {
    const all = await db.getAll('pendingTransactions');
    return all.filter(t => t.status === 'pending');
  },

  markSynced: async (id) => {
    const all = await db.getAll('pendingTransactions');
    const record = all.find(r => r.id === id);
    if (record) {
      await db.update('pendingTransactions', {
        ...record,
        status: 'synced',
        synced_at: new Date().toISOString()
      });
    }
  },

  getPendingCount: async () => {
    const pending = await OfflineQueue.getPending();
    return pending.length;
  },

  cleanup: async () => {
    const all = await db.getAll('pendingTransactions');
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 7);
    
    for (const record of all) {
      if (record.status === 'synced' && new Date(record.synced_at) < cutoff) {
        await db.delete('pendingTransactions', record.id);
      }
    }
  }
};

export const isOnline = () => navigator.onLine;