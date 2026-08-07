/* ============================= PWA OFFLINE SYNC ============================= */
async function updateSyncBadge() {
  const container = document.getElementById("syncBadgeContainer");
  if (!container) return;

  let pendingCount = 0;
  if (window.OfflineDB) {
    pendingCount = await window.OfflineDB.getPendingCount();
  }

  const isOnline = navigator.onLine;
  const isSyncing = window.isSyncingScans;

  let statusText = isOnline ? "Online" : "Offline";
  let dotClass = isOnline ? "sync-dot" : "sync-dot offline";

  if (isSyncing) {
    statusText = "Syncing...";
    dotClass = "sync-dot syncing";
  } else if (pendingCount > 0) {
    statusText = `${pendingCount} pending`;
  }

  container.innerHTML = `
    <div class="sync-status-chip" title="${pendingCount} offline scans waiting to sync. Click to sync now." onclick="triggerManualSync()">
      <span class="${dotClass}"></span>
      <span>${statusText}</span>
    </div>
  `;
}

async function syncOfflineScans() {
  if (!navigator.onLine) return;
  if (window.isSyncingScans) return;
  if (!window.OfflineDB) return;

  const pending = await window.OfflineDB.getPendingScans();
  if (!pending || pending.length === 0) {
    updateSyncBadge();
    return;
  }

  window.isSyncingScans = true;
  updateSyncBadge();
  toast(`Syncing ${pending.length} offline scan(s)...`, "info");

  try {
    const res = await fetch("/api/sync/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ scans: pending }),
    });

    if (res.ok) {
      const data = await res.json();
      const syncedIds = [];
      let successCount = 0;
      let dupCount = 0;

      for (const r of (data.results || [])) {
        if (r.client_id) {
          syncedIds.push(r.client_id);
          if (window.OfflineDB && window.OfflineDB.updateDeviceScanStatus) {
            const newStatus = r.status === "success" ? "synced" : r.status === "duplicate" ? "duplicate" : "invalid";
            await window.OfflineDB.updateDeviceScanStatus(r.client_id, newStatus);
          }
        }
        if (r.status === "success") successCount++;
        if (r.status === "duplicate") dupCount++;
      }

      await window.OfflineDB.removePendingScans(syncedIds);
      toast(`Sync complete! ${successCount} synced, ${dupCount} already recorded.`, "ok");
      loadData();
    } else {
      toast("Sync failed (server unavailable)", "err");
    }
  } catch (err) {
    console.warn("Offline sync error", err);
  } finally {
    window.isSyncingScans = false;
    updateSyncBadge();
  }
}

function triggerManualSync() {
  if (!navigator.onLine) {
    toast("Cannot sync while offline", "err");
    return;
  }
  syncOfflineScans();
}

window.addEventListener("online", () => {
  toast("Network reconnected! Syncing offline scans...", "ok");
  syncOfflineScans();
});

window.addEventListener("offline", () => {
  toast("Network disconnected — offline mode active", "err");
  updateSyncBadge();
});

if (navigator.serviceWorker) {
  navigator.serviceWorker.addEventListener("message", (event) => {
    if (event.data && event.data.type === "TRIGGER_SYNC") {
      syncOfflineScans();
    }
  });
}
