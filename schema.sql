-- FILE: schema.sql
-- PURPOSE: Creates the entire database schema from scratch.

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. ENUMS
DO $$ BEGIN
    CREATE TYPE "public"."post_status" AS ENUM ('draft', 'published', 'archived');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 3. FUNCTIONS
CREATE OR REPLACE FUNCTION "public"."update_updated_at_column"()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION "public"."update_updatedAt_column"()
RETURNS TRIGGER AS $$
BEGIN
    NEW."updatedAt" = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. TABLES & AUTOMATION TRIGGERS

-- ACTIVE SYSTEMS
CREATE TABLE IF NOT EXISTS "public"."active_systems" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "name" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL,
    "stack" TEXT[] DEFAULT '{}',
    "order" INTEGER NOT NULL DEFAULT 0,
    "hidden" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
DROP TRIGGER IF EXISTS update_active_systems_updated_at ON "public"."active_systems";
CREATE TRIGGER update_active_systems_updated_at BEFORE UPDATE ON "public"."active_systems" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- BOOKS
CREATE TABLE IF NOT EXISTS "public"."books" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "title" TEXT NOT NULL,
    "author" TEXT NOT NULL,
    "coverImage" TEXT,
    "category" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "notes" TEXT,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "hidden" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
DROP TRIGGER IF EXISTS update_books_updated_at ON "public"."books";
CREATE TRIGGER update_books_updated_at BEFORE UPDATE ON "public"."books" FOR EACH ROW EXECUTE FUNCTION "update_updatedAt_column"();
CREATE INDEX IF NOT EXISTS idx_books_status ON "public"."books"("status");

-- BUILD LOGS
CREATE TABLE IF NOT EXISTS "public"."build_logs" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "title" TEXT NOT NULL,
    "category" TEXT,
    "short_summary" TEXT,
    "long_summary" TEXT,
    "description" TEXT,
    "date" DATE NOT NULL DEFAULT CURRENT_DATE,
    "source" TEXT DEFAULT 'manual',
    "ai_generated" BOOLEAN DEFAULT false,
    "generated_at" TIMESTAMPTZ,
    "generation_model" TEXT,
    "related_commits" TEXT[] DEFAULT '{}',
    "related_repositories" TEXT[] DEFAULT '{}',
    "hidden" BOOLEAN DEFAULT false,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
DROP TRIGGER IF EXISTS update_build_logs_updated_at ON "public"."build_logs";
CREATE TRIGGER update_build_logs_updated_at BEFORE UPDATE ON "public"."build_logs" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- BUILDER STATUS
CREATE TABLE IF NOT EXISTS "public"."builder_status" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "operational_state" TEXT NOT NULL,
    "status_text" TEXT NOT NULL,
    "current_focus" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
DROP TRIGGER IF EXISTS update_builder_status_updated_at ON "public"."builder_status";
CREATE TRIGGER update_builder_status_updated_at BEFORE UPDATE ON "public"."builder_status" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- FIELD NOTES
CREATE TABLE IF NOT EXISTS "public"."field_notes" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "title" TEXT NOT NULL,
    "excerpt" TEXT,
    "content" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "publishedAt" TIMESTAMPTZ,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "hidden" BOOLEAN NOT NULL DEFAULT false,
    "draft" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
DROP TRIGGER IF EXISTS update_field_notes_updated_at ON "public"."field_notes";
CREATE TRIGGER update_field_notes_updated_at BEFORE UPDATE ON "public"."field_notes" FOR EACH ROW EXECUTE FUNCTION "update_updatedAt_column"();

-- FRAGMENTS
CREATE TABLE IF NOT EXISTS "public"."fragments" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "quote" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "title" TEXT,
    "body" TEXT,
    "hidden" BOOLEAN NOT NULL DEFAULT false,
    "order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
DROP TRIGGER IF EXISTS update_fragments_updated_at ON "public"."fragments";
CREATE TRIGGER update_fragments_updated_at BEFORE UPDATE ON "public"."fragments" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- THOUGHT FRAGMENTS
CREATE TABLE IF NOT EXISTS "public"."thought_fragments" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "content" TEXT NOT NULL,
    "title" TEXT,
    "hidden" BOOLEAN NOT NULL DEFAULT false,
    "published_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
DROP TRIGGER IF EXISTS update_thought_fragments_updated_at ON "public"."thought_fragments";
CREATE TRIGGER update_thought_fragments_updated_at BEFORE UPDATE ON "public"."thought_fragments" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- JOURNAL MOMENTS
CREATE TABLE IF NOT EXISTS "public"."journal_moments" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "title" TEXT,
    "content" TEXT NOT NULL,
    "mood" TEXT,
    "time_label" TEXT,
    "hidden" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
DROP TRIGGER IF EXISTS update_journal_moments_updated_at ON "public"."journal_moments";
CREATE TRIGGER update_journal_moments_updated_at BEFORE UPDATE ON "public"."journal_moments" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- NEWSLETTER PROFILES
CREATE TABLE IF NOT EXISTS "public"."newsletter_profiles" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "persona" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "frequencyText" TEXT NOT NULL,
    "philosophyText" TEXT NOT NULL,
    "expectationItems" TEXT[] DEFAULT '{}',
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
DROP TRIGGER IF EXISTS update_newsletter_profiles_updated_at ON "public"."newsletter_profiles";
CREATE TRIGGER update_newsletter_profiles_updated_at BEFORE UPDATE ON "public"."newsletter_profiles" FOR EACH ROW EXECUTE FUNCTION "update_updatedAt_column"();

-- NEWSLETTER ISSUES
CREATE TABLE IF NOT EXISTS "public"."newsletter_issues" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "persona" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "subject" TEXT,
    "previewText" TEXT,
    "content" TEXT NOT NULL,
    "publishedAt" TIMESTAMPTZ,
    "hidden" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
DROP TRIGGER IF EXISTS update_newsletter_issues_updated_at ON "public"."newsletter_issues";
CREATE TRIGGER update_newsletter_issues_updated_at BEFORE UPDATE ON "public"."newsletter_issues" FOR EACH ROW EXECUTE FUNCTION "update_updatedAt_column"();
CREATE INDEX IF NOT EXISTS idx_nl_issues_persona ON "public"."newsletter_issues"("persona");

-- SUBSCRIBERS
CREATE TABLE IF NOT EXISTS "public"."subscribers" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "email" TEXT UNIQUE NOT NULL,
    "source" TEXT,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
DROP TRIGGER IF EXISTS update_subscribers_updated_at ON "public"."subscribers";
CREATE TRIGGER update_subscribers_updated_at BEFORE UPDATE ON "public"."subscribers" FOR EACH ROW EXECUTE FUNCTION "update_updatedAt_column"();

-- SUBSCRIPTIONS
CREATE TABLE IF NOT EXISTS "public"."subscriptions" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "subscriberId" UUID NOT NULL REFERENCES "public"."subscribers"("id") ON DELETE CASCADE,
    "persona" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE("subscriberId", "persona")
);
DROP TRIGGER IF EXISTS update_subscriptions_updated_at ON "public"."subscriptions";
CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON "public"."subscriptions" FOR EACH ROW EXECUTE FUNCTION "update_updatedAt_column"();

-- OPERATOR FOCUSES
CREATE TABLE IF NOT EXISTS "public"."operator_focuses" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'in-progress',
    "priority" INTEGER NOT NULL DEFAULT 0,
    "hidden" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
DROP TRIGGER IF EXISTS update_operator_focuses_updated_at ON "public"."operator_focuses";
CREATE TRIGGER update_operator_focuses_updated_at BEFORE UPDATE ON "public"."operator_focuses" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- POSTS
CREATE TABLE IF NOT EXISTS "public"."posts" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "title" TEXT,
    "subtitle" TEXT,
    "byline" TEXT,
    "slug" TEXT,
    "old_slugs" TEXT[] DEFAULT '{}',
    "content" TEXT,
    "draft_content" TEXT,
    "excerpt" TEXT,
    "cover_image_url" TEXT,
    "cover_image_alt" TEXT,
    "cover_image_caption" TEXT,
    "cover_image_location" TEXT,
    "cover_image_credit" TEXT,
    "auto_cover_image" BOOLEAN DEFAULT true,
    "status" post_status NOT NULL DEFAULT 'draft',
    "persona" TEXT,
    "reading_time" INTEGER,
    "featured" BOOLEAN DEFAULT false,
    "hidden" BOOLEAN DEFAULT false,
    "published_at" TIMESTAMPTZ,
    "tags" TEXT[] DEFAULT '{}',
    "auto_optimize" BOOLEAN DEFAULT true,
    "seo_title" TEXT,
    "seo_description" TEXT,
    "og_title" TEXT,
    "og_description" TEXT,
    "twitter_title" TEXT,
    "twitter_description" TEXT,
    "keywords" TEXT[] DEFAULT '{}',
    "manual_overrides" TEXT[] DEFAULT '{}',
    "ai_metadata_status" TEXT DEFAULT 'idle',
    "ai_metadata_last_generated_at" TIMESTAMPTZ,
    "ai_metadata_content_hash" TEXT,
    "ai_metadata_error" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE NULLS NOT DISTINCT ("persona", "slug")
);
DROP TRIGGER IF EXISTS update_posts_updated_at ON "public"."posts";
CREATE TRIGGER update_posts_updated_at BEFORE UPDATE ON "public"."posts" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE INDEX IF NOT EXISTS idx_posts_status ON "public"."posts"("status");
CREATE INDEX IF NOT EXISTS idx_posts_persona ON "public"."posts"("persona");

-- QUESTIONS
CREATE TABLE IF NOT EXISTS "public"."questions" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "question" TEXT NOT NULL,
    "answer" TEXT,
    "status" TEXT NOT NULL DEFAULT 'open',
    "order" INTEGER NOT NULL DEFAULT 0,
    "hidden" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
DROP TRIGGER IF EXISTS update_questions_updated_at ON "public"."questions";
CREATE TRIGGER update_questions_updated_at BEFORE UPDATE ON "public"."questions" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- REDISTRIBUTION RECORDS
CREATE TABLE IF NOT EXISTS "public"."redistribution_records" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "amount" DECIMAL(12,2) NOT NULL,
    "destination" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "proofUrl" TEXT,
    "internalNotes" TEXT,
    "donatedAt" TIMESTAMPTZ NOT NULL,
    "transactionReference" TEXT,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
DROP TRIGGER IF EXISTS update_redistribution_records_updated_at ON "public"."redistribution_records";
CREATE TRIGGER update_redistribution_records_updated_at BEFORE UPDATE ON "public"."redistribution_records" FOR EACH ROW EXECUTE FUNCTION "update_updatedAt_column"();

-- DONATIONS (INCOMING)
CREATE TABLE IF NOT EXISTS "public"."donations" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "amount" DECIMAL(12,2) NOT NULL,
    "donorName" TEXT,
    "donorEmail" TEXT,
    "donorPhone" TEXT,
    "publicName" TEXT,
    "razorpayOrderId" TEXT UNIQUE,
    "razorpayPaymentId" TEXT UNIQUE,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_donations_status_created_at ON "public"."donations"("status", "createdAt");

DROP TRIGGER IF EXISTS update_donations_updated_at ON "public"."donations";
CREATE TRIGGER update_donations_updated_at BEFORE UPDATE ON "public"."donations" FOR EACH ROW EXECUTE FUNCTION "update_updatedAt_column"();

-- Function to auto delete expired pending donation records older than N days (default: 30 days)
CREATE OR REPLACE FUNCTION "public"."delete_expired_pending_donations"(retention_days INTEGER DEFAULT 30)
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM "public"."donations"
    WHERE status = 'pending'
      AND "createdAt" < NOW() - (retention_days || ' days')::INTERVAL;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- PASSKEY CREDENTIALS (WEBAUTHN FIDO2)
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

-- UPLOADED IMAGES REGISTRY
CREATE TABLE IF NOT EXISTS "public"."uploaded_images" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "bucket" TEXT NOT NULL DEFAULT 'post-images',
    "storage_path" TEXT NOT NULL,
    "public_url" TEXT NOT NULL,
    "file_name" TEXT,
    "content_type" TEXT,
    "size_bytes" BIGINT,
    "first_uploaded_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "last_referenced_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "reference_count" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'active',
    "last_scanned_at" TIMESTAMPTZ,
    "metadata" JSONB DEFAULT '{}',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE ("bucket", "storage_path")
);
CREATE INDEX IF NOT EXISTS idx_uploaded_images_status_last_ref ON "public"."uploaded_images"("status", "last_referenced_at");
CREATE INDEX IF NOT EXISTS idx_uploaded_images_storage_path ON "public"."uploaded_images"("storage_path");
CREATE INDEX IF NOT EXISTS idx_uploaded_images_bucket ON "public"."uploaded_images"("bucket");

DROP TRIGGER IF EXISTS update_uploaded_images_updated_at ON "public"."uploaded_images";
CREATE TRIGGER update_uploaded_images_updated_at BEFORE UPDATE ON "public"."uploaded_images" FOR EACH ROW EXECUTE FUNCTION "update_updated_at_column"();

-- IMAGE CLEANUP AUDIT LOGS
CREATE TABLE IF NOT EXISTS "public"."image_cleanup_logs" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "scanned_count" INTEGER NOT NULL DEFAULT 0,
    "referenced_count" INTEGER NOT NULL DEFAULT 0,
    "orphaned_count" INTEGER NOT NULL DEFAULT 0,
    "deleted_count" INTEGER NOT NULL DEFAULT 0,
    "skipped_count" INTEGER NOT NULL DEFAULT 0,
    "failed_count" INTEGER NOT NULL DEFAULT 0,
    "retention_days" INTEGER NOT NULL DEFAULT 60,
    "deleted_paths" TEXT[] DEFAULT '{}',
    "errors" TEXT[] DEFAULT '{}',
    "details" JSONB DEFAULT '{}',
    "duration_ms" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'success',
    "executed_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_image_cleanup_logs_executed_at ON "public"."image_cleanup_logs"("executed_at" DESC);

-- 5. ROW LEVEL SECURITY (RLS)
ALTER TABLE "public"."active_systems" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."books" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."build_logs" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."builder_status" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."field_notes" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."fragments" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."thought_fragments" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."journal_moments" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."newsletter_profiles" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."newsletter_issues" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."subscribers" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."subscriptions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."operator_focuses" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."posts" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."questions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."redistribution_records" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."donations" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."passkey_credentials" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."uploaded_images" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."image_cleanup_logs" ENABLE ROW LEVEL SECURITY;

-- Admin full access across all tables
DO $$
DECLARE
    t_name text;
BEGIN
    FOR t_name IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') 
    LOOP
        EXECUTE format('CREATE POLICY "Admin full access" ON "public".%I FOR ALL TO authenticated USING (true);', t_name);
    END LOOP;
END $$;

-- Public read access policies
CREATE POLICY "Public read active systems" ON "public"."active_systems" FOR SELECT USING (status = 'active' AND hidden = false);
CREATE POLICY "Public read books" ON "public"."books" FOR SELECT USING (true);
CREATE POLICY "Public read build logs" ON "public"."build_logs" FOR SELECT USING (hidden = false);
CREATE POLICY "Public read builder status" ON "public"."builder_status" FOR SELECT USING (true);
CREATE POLICY "Public read field notes" ON "public"."field_notes" FOR SELECT USING (hidden = false AND draft = false);
CREATE POLICY "Public read fragments" ON "public"."fragments" FOR SELECT USING (hidden = false);
CREATE POLICY "Public read thought fragments" ON "public"."thought_fragments" FOR SELECT USING (hidden = false);
CREATE POLICY "Public read journal moments" ON "public"."journal_moments" FOR SELECT USING (hidden = false);
CREATE POLICY "Public read newsletter profiles" ON "public"."newsletter_profiles" FOR SELECT USING (true);
CREATE POLICY "Public read published newsletter issues" ON "public"."newsletter_issues" FOR SELECT USING (hidden = false);
CREATE POLICY "Public read operator focuses" ON "public"."operator_focuses" FOR SELECT USING (hidden = false);
CREATE POLICY "Public read published posts" ON "public"."posts" FOR SELECT USING (status = 'published' AND hidden = false);
CREATE POLICY "Public read questions" ON "public"."questions" FOR SELECT USING (status != 'archived' AND hidden = false);
CREATE POLICY "Public read redistribution records" ON "public"."redistribution_records" FOR SELECT USING (true);
CREATE POLICY "Public read successful donations" ON "public"."donations" FOR SELECT USING (status = 'success');

-- Allow public to insert into subscriber tables
CREATE POLICY "Public can subscribe" ON "public"."subscribers" FOR INSERT WITH CHECK (true);
CREATE POLICY "Public can manage own subscription" ON "public"."subscriptions" FOR ALL USING (true);

-- 6. ADDITIONAL CONSTRAINTS & TRIGGERS
CREATE OR REPLACE FUNCTION validate_published_post()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.status = 'published' THEN
    IF NEW.title IS NULL OR trim(NEW.title) = '' THEN
      RAISE EXCEPTION 'title cannot be null or empty for a published post';
    END IF;
    IF NEW.slug IS NULL OR trim(NEW.slug) = '' THEN
      RAISE EXCEPTION 'slug cannot be null or empty for a published post';
    END IF;
    IF NEW.content IS NULL OR trim(NEW.content) = '' THEN
      RAISE EXCEPTION 'content cannot be null or empty for a published post';
    END IF;
    IF NEW.persona IS NULL OR trim(NEW.persona) = '' THEN
      RAISE EXCEPTION 'persona cannot be null or empty for a published post';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enforce_published_post_constraints ON "public"."posts";
CREATE TRIGGER enforce_published_post_constraints
  BEFORE INSERT OR UPDATE ON "public"."posts"
  FOR EACH ROW EXECUTE FUNCTION validate_published_post();
