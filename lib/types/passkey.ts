import type { AuthenticatorTransportFuture, CredentialDeviceType } from '@simplewebauthn/server';

export interface PasskeyCredential {
  id: string;
  userId: string;
  credentialId: string;
  publicKey: string;
  counter: number;
  deviceType: CredentialDeviceType;
  backedUp: boolean;
  transports: AuthenticatorTransportFuture[];
  name: string;
  aaguid?: string | null;
  lastUsedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PasskeyListItem {
  id: string;
  credentialId: string;
  name: string;
  deviceType: CredentialDeviceType;
  backedUp: boolean;
  transports: AuthenticatorTransportFuture[];
  createdAt: string;
  lastUsedAt?: string | null;
}
