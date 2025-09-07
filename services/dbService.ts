import { SavedTrailer } from '../types';

const DB_NAME = 'SequelGenDB';
const DB_VERSION = 1;
const STORE_NAME = 'trailers';

let db: IDBDatabase;

export const initDB = (): Promise<boolean> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      console.error('Error opening IndexedDB:', request.error);
      reject(false);
    };

    request.onsuccess = () => {
      db = request.result;
      resolve(true);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
  });
};

export const saveTrailer = (trailer: SavedTrailer): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (!db) {
      reject('DB not initialized');
      return;
    }
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.put(trailer);

    request.onsuccess = () => resolve();
    request.onerror = () => {
      console.error('Error saving trailer:', request.error);
      reject(request.error);
    };
  });
};

export const getAllTrailers = (): Promise<SavedTrailer[]> => {
  return new Promise((resolve, reject) => {
     if (!db) {
      reject('DB not initialized');
      return;
    }
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAll();

    request.onsuccess = () => {
        // Sort by ID (timestamp) descending to show newest first
        const sortedResults = request.result.sort((a, b) => b.id.localeCompare(a.id));
        resolve(sortedResults);
    };
    request.onerror = () => {
      console.error('Error getting all trailers:', request.error);
      reject(request.error);
    };
  });
};