const DB_NAME = 'ACS_Offline_DB';
const DB_VERSION = 2;
const STORE_PENDING = 'pending_scans';
const STORE_HISTORY = 'device_scan_history';

function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_PENDING)) {
        db.createObjectStore(STORE_PENDING, { keyPath: 'client_id' });
      }
      if (!db.objectStoreNames.contains(STORE_HISTORY)) {
        db.createObjectStore(STORE_HISTORY, { keyPath: 'id', autoIncrement: true });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function savePendingScan(scanData) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_PENDING, 'readwrite');
    const store = tx.objectStore(STORE_PENDING);
    const item = {
      client_id: scanData.client_id || 'scan_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      student_uid: scanData.student_uid,
      event_id: scanData.event_id,
      officer: scanData.officer || '',
      timestamp: scanData.timestamp || new Date().toISOString()
    };
    const req = store.put(item);
    req.onsuccess = () => resolve(item);
    req.onerror = () => reject(req.error);
  });
}

async function getPendingScans() {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_PENDING, 'readonly');
    const store = tx.objectStore(STORE_PENDING);
    const req = store.getAll();
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(req.error);
  });
}

async function removePendingScans(clientIds) {
  if (!clientIds || clientIds.length === 0) return;
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_PENDING, 'readwrite');
    const store = tx.objectStore(STORE_PENDING);
    clientIds.forEach((id) => store.delete(id));
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function getPendingCount() {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_PENDING, 'readonly');
    const store = tx.objectStore(STORE_PENDING);
    const req = store.count();
    req.onsuccess = () => resolve(req.result || 0);
    req.onerror = () => reject(req.error);
  });
}

/* ================= Device Local Audit Log ================= */
async function saveDeviceScanHistory(entry) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_HISTORY, 'readwrite');
    const store = tx.objectStore(STORE_HISTORY);
    const item = {
      client_id: entry.client_id || '',
      student_uid: entry.student_uid || '',
      student_name: entry.student_name || 'Unknown',
      event_name: entry.event_name || 'Event',
      event_id: entry.event_id,
      officer: entry.officer || 'Officer',
      timestamp: entry.timestamp || new Date().toISOString(),
      sync_status: entry.sync_status || 'synced' // 'synced', 'pending_offline', 'duplicate', 'invalid'
    };
    const req = store.add(item);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function getDeviceScanHistory() {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_HISTORY, 'readonly');
    const store = tx.objectStore(STORE_HISTORY);
    const req = store.getAll();
    req.onsuccess = () => {
      const records = req.result || [];
      records.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      resolve(records);
    };
    req.onerror = () => reject(req.error);
  });
}

async function updateDeviceScanStatus(clientId, newStatus) {
  if (!clientId) return;
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_HISTORY, 'readwrite');
    const store = tx.objectStore(STORE_HISTORY);
    const req = store.getAll();
    req.onsuccess = () => {
      const records = req.result || [];
      records.forEach((r) => {
        if (r.client_id === clientId) {
          r.sync_status = newStatus;
          store.put(r);
        }
      });
      resolve();
    };
    req.onerror = () => reject(req.error);
  });
}

async function clearDeviceScanHistory() {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_HISTORY, 'readwrite');
    const store = tx.objectStore(STORE_HISTORY);
    const req = store.clear();
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

window.OfflineDB = {
  savePendingScan,
  getPendingScans,
  removePendingScans,
  getPendingCount,
  saveDeviceScanHistory,
  getDeviceScanHistory,
  updateDeviceScanStatus,
  clearDeviceScanHistory
};
