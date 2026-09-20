import type { MediaItem } from "@/lib/types";

export interface MediaRepository {
  getMedia(): Promise<MediaItem[]>;
  addMedia(item: MediaItem): Promise<MediaItem>;
  deleteMedia(id: string): Promise<boolean>;
  getOrphanedMedia(): Promise<MediaItem[]>;
  deleteStorageAssets(srcs: string[]): Promise<number>;
}
