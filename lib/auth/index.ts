import type { AuthService } from "./auth-service";
import { SupabaseAuthService } from "./supabase-auth-service";

export * from "./admin";
export * from "./auth-service";
export * from "./supabase-auth-service";

let authServiceInstance: AuthService | null = null;

export function getAuthService(): AuthService {
  if (!authServiceInstance) {
    authServiceInstance = new SupabaseAuthService();
  }
  return authServiceInstance;
}

export function setAuthServiceForTesting(service: AuthService | null): void {
  authServiceInstance = service;
}
