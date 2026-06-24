import { useState, useEffect } from "react";

// Tracks online/offline status and manages a pending sync queue
// When the app goes offline, actions are queued locally.
// When it comes back online, queued actions are replayed.

const QUEUE_KEY = "offline_sync_queue";

export function useOfflineSync() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [syncQueue, setSyncQueue] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(QUEUE_KEY) || "[]");
    } catch {
      return [];
    }
  });
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    const onOnline = () => {
      setIsOnline(true);
      triggerSync();
    };
    const onOffline = () => setIsOnline(false);

    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, []);

  useEffect(() => {
    localStorage.setItem(QUEUE_KEY, JSON.stringify(syncQueue));
  }, [syncQueue]);

  // Queue an action for later sync
  const queueAction = (type, payload) => {
    const action = {
      id: Date.now().toString(),
      type,
      payload,
      timestamp: new Date().toISOString(),
    };
    setSyncQueue((prev) => [...prev, action]);
    return action.id;
  };

  // Simulate sync (in a real app this would POST to a backend)
  const triggerSync = async () => {
    if (syncQueue.length === 0) return;
    setIsSyncing(true);

    // Simulate network delay
    await new Promise((r) => setTimeout(r, 800));

    // In production: POST each action to your API
    // For now: just clear the queue (data is already in localStorage)
    setSyncQueue([]);
    setIsSyncing(false);
  };

  return {
    isOnline,
    syncQueue,
    queueCount: syncQueue.length,
    isSyncing,
    queueAction,
    triggerSync,
  };
}
