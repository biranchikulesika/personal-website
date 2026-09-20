import { getContentRepository } from "@/lib/repositories";
import type { NowRepository } from "@/lib/repositories/now.repository";
import type { NowEntry } from "@/lib/types";

export class NowPageService {
  constructor(private repo: NowRepository = getContentRepository()) {}

  getNowEntries(): Promise<NowEntry[]> {
    return this.repo.getNowEntries();
  }

  saveNowEntry(entry: NowEntry): Promise<NowEntry> {
    return this.repo.saveNowEntry(entry);
  }

  deleteNowEntry(id: string): Promise<boolean> {
    return this.repo.deleteNowEntry(id);
  }
}
