import type { NowEntry } from "@/lib/types";

export interface NowRepository {
  getNowEntries(): Promise<NowEntry[]>;
  saveNowEntry(entry: NowEntry): Promise<NowEntry>;
  deleteNowEntry(id: string): Promise<boolean>;
}
