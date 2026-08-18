-- The passkey_credentials table was defined in schema.sql and referenced by
-- the passkey repository/service/actions, but was never created in the live
-- database (42P01). Create it, wire up the updated_at trigger and indexes,
-- and grant the same admin RLS policy as every other table.

CREATE TABLE IF NOT EXISTS "public"."passkey_credentials" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "userId" UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    "credentialId" TEXT NOT NULL UNIQUE,
    "publicKey" TEXT NOT NULL,
    "counter" BIGINT NOT NULL DEFAULT 0,
    "deviceType" TEXT NOT NULL DEFAULT 'singleDevice',
    "backedUp" BOOLEAN NOT NULL DEFAULT false,
    "transports" TEXT[] DEFAULT '{}',
    "name" TEXT NOT NULL DEFAULT 'Passkey',
    "aaguid" TEXT,
    "lastUsedAt" TIMESTAMPTZ,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_passkey_credentials_user_id ON "public"."passkey_credentials"("userId");
CREATE INDEX IF NOT EXISTS idx_passkey_credentials_credential_id ON "public"."passkey_credentials"("credentialId");

DROP TRIGGER IF EXISTS update_passkey_credentials_updated_at ON "public"."passkey_credentials";
CREATE TRIGGER update_passkey_credentials_updated_at BEFORE UPDATE ON "public"."passkey_credentials" FOR EACH ROW EXECUTE FUNCTION "update_updatedAt_column"();

ALTER TABLE "public"."passkey_credentials" ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public'
          AND tablename = 'passkey_credentials'
          AND policyname = 'Admin full access'
    ) THEN
        CREATE POLICY "Admin full access" ON "public"."passkey_credentials" FOR ALL TO authenticated USING (true);
    END IF;
END $$;