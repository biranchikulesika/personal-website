import { PasskeyCredential, PasskeyListItem } from '../types/passkey';
import { PasskeySupabaseRepository } from '../repositories/passkey.repository.supabase';
import { repositoryRegistry } from '../repositories/registry';
import { passkeyCredentialSchema, passkeyRenameSchema } from '../schemas';

export class PasskeyService {
  private repository: PasskeySupabaseRepository;

  constructor() {
    this.repository = repositoryRegistry.getPasskeyRepository();
  }

  /**
   * Retrieves sanitized list of passkeys for UI display.
   * Never exposes public keys or sensitive cryptographic values.
   */
  async getUserPasskeys(userId: string): Promise<PasskeyListItem[]> {
    const rawList = await this.repository.getByUserId(userId);
    return rawList.map(item => ({
      id: item.id,
      credentialId: item.credentialId,
      name: item.name,
      deviceType: item.deviceType,
      backedUp: item.backedUp,
      transports: item.transports || [],
      createdAt: item.createdAt,
      lastUsedAt: item.lastUsedAt || null,
    }));
  }

  /**
   * Returns list of existing credentials for exclusion in WebAuthn registration options.
   * This prevents registering the same authenticator multiple times.
   */
  async getPasskeysForExclusion(userId: string) {
    const credentials = await this.repository.getByUserId(userId);
    return credentials.map(c => ({
      id: c.credentialId,
      transports: c.transports,
    }));
  }

  /**
   * Checks if a credential ID is already registered in the system.
   */
  async isCredentialRegistered(credentialId: string): Promise<boolean> {
    const existing = await this.repository.getByCredentialId(credentialId);
    return existing !== null;
  }

  /**
   * Persists a newly verified passkey credential.
   */
  async savePasskey(data: Omit<PasskeyCredential, 'id' | 'createdAt' | 'updatedAt'>): Promise<PasskeyCredential> {
    const validated = passkeyCredentialSchema.parse(data);
    return await this.repository.create(validated as any);
  }

  /**
   * Renames a passkey owned by the specified user.
   */
  async renamePasskey(id: string, userId: string, name: string): Promise<PasskeyCredential | null> {
    const validated = passkeyRenameSchema.parse({ id, name });
    return await this.repository.updateName(validated.id, userId, validated.name);
  }

  /**
   * Deletes a passkey owned by the specified user.
   */
  async deletePasskey(id: string, userId: string): Promise<boolean> {
    return await this.repository.delete(id, userId);
  }
}
