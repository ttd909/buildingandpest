/**
 * Local storage layer using IndexedDB (via idb library).
 * Falls back to localStorage if IndexedDB is unavailable.
 * Structured for offline-first operation.
 */

import { openDB, DBSchema, IDBPDatabase } from "idb";
import { Inspection } from "@/types";

const DB_NAME = "inspectflow-db";
const DB_VERSION = 1;
const STORE_INSPECTIONS = "inspections";

interface InspectFlowDB extends DBSchema {
  inspections: {
    key: string;
    value: Inspection;
    indexes: { "by-status": string; "by-updated": string };
  };
}

let dbPromise: Promise<IDBPDatabase<InspectFlowDB>> | null = null;

function getDB(): Promise<IDBPDatabase<InspectFlowDB>> {
  if (!dbPromise) {
    dbPromise = openDB<InspectFlowDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        const store = db.createObjectStore(STORE_INSPECTIONS, { keyPath: "id" });
        store.createIndex("by-status", "status");
        store.createIndex("by-updated", "updatedAt");
      },
    });
  }
  return dbPromise;
}

export async function saveInspection(inspection: Inspection): Promise<void> {
  try {
    const db = await getDB();
    await db.put(STORE_INSPECTIONS, inspection);
  } catch {
    // Fallback to localStorage
    try {
      const key = `inspection-${inspection.id}`;
      localStorage.setItem(key, JSON.stringify(inspection));
      const ids = getLocalStorageIndex();
      if (!ids.includes(inspection.id)) {
        ids.push(inspection.id);
        localStorage.setItem("inspection-ids", JSON.stringify(ids));
      }
    } catch (e) {
      console.error("Storage failed:", e);
    }
  }
}

export async function loadAllInspections(): Promise<Inspection[]> {
  try {
    const db = await getDB();
    return await db.getAll(STORE_INSPECTIONS);
  } catch {
    // Fallback to localStorage
    try {
      const ids = getLocalStorageIndex();
      return ids
        .map((id) => {
          const raw = localStorage.getItem(`inspection-${id}`);
          return raw ? (JSON.parse(raw) as Inspection) : null;
        })
        .filter(Boolean) as Inspection[];
    } catch {
      return [];
    }
  }
}

export async function loadInspection(id: string): Promise<Inspection | undefined> {
  try {
    const db = await getDB();
    return await db.get(STORE_INSPECTIONS, id);
  } catch {
    try {
      const raw = localStorage.getItem(`inspection-${id}`);
      return raw ? (JSON.parse(raw) as Inspection) : undefined;
    } catch {
      return undefined;
    }
  }
}

export async function deleteInspection(id: string): Promise<void> {
  try {
    const db = await getDB();
    await db.delete(STORE_INSPECTIONS, id);
  } catch {
    try {
      localStorage.removeItem(`inspection-${id}`);
      const ids = getLocalStorageIndex().filter((i) => i !== id);
      localStorage.setItem("inspection-ids", JSON.stringify(ids));
    } catch {
      // ignore
    }
  }
}

function getLocalStorageIndex(): string[] {
  try {
    const raw = localStorage.getItem("inspection-ids");
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}
