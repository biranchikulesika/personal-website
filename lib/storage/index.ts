import type { MediaStorage } from "./media-storage";
import { SupabaseMediaStorage } from "./supabase-media-storage";

export * from "./media-storage";
export * from "./supabase-media-storage";

let storageInstance: MediaStorage | null = null;

export function getMediaStorage(): MediaStorage {
  if (!storageInstance) {
    storageInstance = new SupabaseMediaStorage();
  }
  return storageInstance;
}

export function setMediaStorageForTesting(storage: MediaStorage | null): void {
  storageInstance = storage;
}
