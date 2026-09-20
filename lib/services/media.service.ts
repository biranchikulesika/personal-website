import { getContentRepository } from "@/lib/repositories";
import type { MediaRepository } from "@/lib/repositories/media.repository";
import type { MediaItem } from "@/lib/types";

export class MediaService {
  constructor(private repo: MediaRepository = getContentRepository()) {}

  getMedia(): Promise<MediaItem[]> {
    return this.repo.getMedia();
  }

  addMedia(item: MediaItem): Promise<MediaItem> {
    return this.repo.addMedia(item);
  }

  deleteMedia(id: string): Promise<boolean> {
    return this.repo.deleteMedia(id);
  }

  getOrphanedMedia(): Promise<MediaItem[]> {
    return this.repo.getOrphanedMedia();
  }

  deleteStorageAssets(srcs: string[]): Promise<number> {
    return this.repo.deleteStorageAssets(srcs);
  }
}
