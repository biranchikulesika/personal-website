import type {
  HomeContent,
  SectionGroup,
  WritingItem,
  ScribbleEntry,
  PasskeyItem,
  PasskeyCredentialRecord,
  UserSession,
} from "@/lib/types";
import type { PostRepository } from "./post.repository";
import type { NoteRepository } from "./note.repository";
import type { BookRepository } from "./book.repository";
import type { NowRepository } from "./now.repository";
import type { MediaRepository } from "./media.repository";
import type { SubscriberRepository } from "./subscriber.repository";
import type { ContributionRepository } from "./contribution.repository";
import type { UserRoleRepository } from "./user-role.repository";

export * from "./post.repository";
export * from "./note.repository";
export * from "./book.repository";
export * from "./now.repository";
export * from "./media.repository";
export * from "./subscriber.repository";
export * from "./contribution.repository";
export * from "./user-role.repository";

/**
 * Composite repository contract combining domain-specific repository interfaces.
 * Application services and server actions interact through these boundaries.
 */
export interface ContentRepository
  extends PostRepository,
    NoteRepository,
    BookRepository,
    NowRepository,
    MediaRepository,
    SubscriberRepository,
    ContributionRepository,
    UserRoleRepository {
  // Cross-collection aggregation & views
  getHomeContent(): Promise<HomeContent>;
  getWriting(): Promise<SectionGroup<WritingItem>>;
  getScribbleEntries(): Promise<ScribbleEntry[]>;

  // Passkeys & Identity (isolated behind repository boundary)
  getPasskeys(userId: string): Promise<PasskeyItem[]>;
  savePasskey(userId: string, passkey: PasskeyItem): Promise<PasskeyItem>;
  deletePasskey(userId: string, passkeyId: string): Promise<boolean>;
  findPasskeyCredential(
    credentialId: string,
  ): Promise<PasskeyCredentialRecord | null>;
  getAllAdminPasskeys(): Promise<PasskeyItem[]>;

  // Active Sessions
  getSessions(
    userId: string,
    currentSessionId?: string,
  ): Promise<UserSession[]>;
  recordSession(session: UserSession): Promise<UserSession>;
  deleteSession(userId: string, sessionId: string): Promise<boolean>;
  deleteAllSessions(userId: string): Promise<boolean>;

  // Connected Accounts
  getConnectedProviders(userId: string): Promise<string[]>;
  setConnectedProviders(userId: string, providers: string[]): Promise<void>;
}
