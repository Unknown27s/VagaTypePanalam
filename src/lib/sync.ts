import { getSession } from "next-auth/react";
import { getAllKeyStats } from "@/db/keyStats";
import { getAllSessions } from "@/db/sessions";
import { getProfile } from "@/db/profile";

/**
 * CloudSync Utility — Manages the synchronization between local IndexedDB 
 * and the server-side PostgreSQL database via Auth.js.
 */

let isSyncing = false;

export async function requestCloudSync() {
  if (isSyncing) return;

  // Check if we are authenticated
  const session = await getSession();
  if (!session?.user) return;

  isSyncing = true;
  console.log("☁️ CloudSync: Starting sync...");

  try {
    // 1. Collect all local data
    const [stats, sessions, profile] = await Promise.all([
      getAllKeyStats(),
      getAllSessions(),
      getProfile()
    ]);

    // 2. Push to server
    const response = await fetch("/api/sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stats, sessions, profile }),
    });

    if (!response.ok) {
      throw new Error(`Sync failed: ${response.statusText}`);
    }

    const data = await response.json();
    console.log("☁️ CloudSync: Successfully synced at", data.updatedAt);
    
    // Trigger a custom event so UI can update (e.g., showing last sync time)
    window.dispatchEvent(new CustomEvent("cloud-sync-complete", { 
      detail: { updatedAt: data.updatedAt } 
    }));

  } catch (error) {
    console.error("☁️ CloudSync: Error during synchronization:", error);
  } finally {
    isSyncing = false;
  }
}

/**
 * Downloads cloud backup and overwrites/merges into local IndexedDB.
 * (To be implemented when user first logs in on a new device)
 */
export async function restoreFromCloud() {
  const session = await getSession();
  if (!session?.user) return;

  try {
    const response = await fetch("/api/sync");
    if (!response.ok) return;

    const cloudData = await response.json();
    if (!cloudData) return;

    // TODO: Implement logic to merge/restore IDB stores
    // This requires adding bulk-write methods to our db modules
    console.log("☁️ CloudSync: Cloud data found, ready to restore.");
  } catch (error) {
    console.error("☁️ CloudSync: Error fetching cloud data:", error);
  }
}
