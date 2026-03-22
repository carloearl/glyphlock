/**
 * OFFLINE TRANSACTION QUEUE — IndexedDB persistence
 * Allows POS to continue operating when network is down
 */

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
  addTransaction: async (payload) => {
    const id = await db.add('pendingTransactions', {
      ...payload,
      created_at: new Date().toISOString(),
      status: 'pending',
      offline_id: crypto.randomUUID()
    });
    return id;
  },

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