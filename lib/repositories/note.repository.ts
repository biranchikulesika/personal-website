import type { NoteItem } from "@/lib/types";

export interface NoteRepository {
  getNote(slug: string): Promise<NoteItem | null>;
  getNoteSlugs(): Promise<string[]>;
  getAllNotes(): Promise<NoteItem[]>;
  saveNote(note: NoteItem): Promise<NoteItem>;
  deleteNote(slug: string): Promise<boolean>;
  toggleNoteStatus(slug: string): Promise<NoteItem | null>;
}
