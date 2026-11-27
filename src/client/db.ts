export type SavedClient = {
  code: string;
  updatedAt: string;
  clientId: string;
  file: string;
  output: unknown;
  savedAt: string;
};

const DB_NAME = "cagrmeister";
const STORE = "clients";

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE, { keyPath: "code" });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function readClient(code: string): Promise<SavedClient | null> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const request = db.transaction(STORE, "readonly").objectStore(STORE).get(code);
    request.onsuccess = () => resolve((request.result as SavedClient | undefined) ?? null);
    request.onerror = () => reject(request.error);
  });
}

export async function saveClient(row: SavedClient): Promise<void> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const request = db.transaction(STORE, "readwrite").objectStore(STORE).put(row);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}
