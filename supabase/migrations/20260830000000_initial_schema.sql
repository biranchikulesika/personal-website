-- PostgreSQL database dump

-- \restrict P4K1L9vIoKpgeQSxpuSciLmI42Pa4bhQ0metgWVJmS5lZ6Vbdk5qPNg6QU4Ukse

-- Dumped from database version 17.6
-- Dumped by pg_dump version 17.6




-- SET transaction_timeout = 0;


SELECT pg_catalog.set_config('search_path', '', false);





-- Name: public; Type: SCHEMA; Schema: -; Owner: pg_database_owner

CREATE SCHEMA IF NOT EXISTS "public";


ALTER SCHEMA "public" OWNER TO "pg_database_owner";

-- Name: SCHEMA "public"; Type: COMMENT; Schema: -; Owner: pg_database_owner

COMMENT ON SCHEMA "public" IS 'standard public schema';


-- Name: app_role; Type: TYPE; Schema: public; Owner: postgres

DO $$ BEGIN
    CREATE TYPE "public"."app_role" AS ENUM (
        'user',
        'content_admin',
        'super_admin'
    );
    EXCEPTION WHEN duplicate_object THEN NULL;
END $$;


ALTER TYPE "public"."app_role" OWNER TO "postgres";

-- Name: content_status; Type: TYPE; Schema: public; Owner: postgres

DO $$ BEGIN
    CREATE TYPE "public"."content_status" AS ENUM (
        'published',
        'unpublished'
    );
    EXCEPTION WHEN duplicate_object THEN NULL;
END $$;


ALTER TYPE "public"."content_status" OWNER TO "postgres";

-- Name: post_status; Type: TYPE; Schema: public; Owner: postgres

DO $$ BEGIN
    CREATE TYPE "public"."post_status" AS ENUM (
        'draft',
        'published',
        'archived'
    );
    EXCEPTION WHEN duplicate_object THEN NULL;
END $$;


ALTER TYPE "public"."post_status" OWNER TO "postgres";

-- Name: check_cross_collection_slug_uniqueness(); Type: FUNCTION; Schema: public; Owner: postgres

CREATE OR REPLACE FUNCTION "public"."check_cross_collection_slug_uniqueness"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  existing_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO existing_count
  FROM (
    SELECT slug FROM public.posts WHERE slug = NEW.slug AND TG_TABLE_NAME != 'posts'
    UNION ALL
    SELECT slug FROM public.notes WHERE slug = NEW.slug AND TG_TABLE_NAME != 'notes'
    UNION ALL
    SELECT slug FROM public.books WHERE slug = NEW.slug AND TG_TABLE_NAME != 'books'
  ) AS conflicts;

  IF existing_count > 0 THEN
    RAISE EXCEPTION 'Slug "%" already exists in another collection. Choose a unique slug.', NEW.slug;
  END IF;

  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."check_cross_collection_slug_uniqueness"() OWNER TO "postgres";

-- Name: is_admin(); Type: FUNCTION; Schema: public; Owner: postgres

CREATE OR REPLACE FUNCTION "public"."is_admin"() RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role IN ('content_admin', 'super_admin')
  );
END;
$$;


ALTER FUNCTION "public"."is_admin"() OWNER TO "postgres";

-- Name: is_super_admin(); Type: FUNCTION; Schema: public; Owner: postgres

CREATE OR REPLACE FUNCTION "public"."is_super_admin"() RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role = 'super_admin'
  );
END;
$$;


ALTER FUNCTION "public"."is_super_admin"() OWNER TO "postgres";

-- Name: update_updatedAt_column(); Type: FUNCTION; Schema: public; Owner: postgres

CREATE OR REPLACE FUNCTION "public"."update_updatedAt_column"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW."updatedAt" = NOW();
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_updatedAt_column"() OWNER TO "postgres";

-- Name: update_updated_at_column(); Type: FUNCTION; Schema: public; Owner: postgres

CREATE OR REPLACE FUNCTION "public"."update_updated_at_column"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_updated_at_column"() OWNER TO "postgres";

-- Name: validate_published_post(); Type: FUNCTION; Schema: public; Owner: postgres

CREATE OR REPLACE FUNCTION "public"."validate_published_post"() RETURNS "trigger"
    LANGUAGE "plpgsql"
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


ALTER FUNCTION "public"."validate_published_post"() OWNER TO "postgres";





-- Name: books; Type: TABLE; Schema: public; Owner: postgres

CREATE TABLE IF NOT EXISTS "public"."books" (
    "id" "text" NOT NULL,
    "slug" "text" NOT NULL,
    "title" "text" NOT NULL,
    "author" "text" NOT NULL,
    "description" "text" DEFAULT ''::"text" NOT NULL,
    "date" "text",
    "persona" "text",
    "tags" "text"[] DEFAULT '{}'::"text"[],
    "cover" "text",
    "link" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."books" OWNER TO "postgres";

-- Name: featured_items; Type: TABLE; Schema: public; Owner: postgres

CREATE TABLE IF NOT EXISTS "public"."featured_items" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "item_type" "text" NOT NULL,
    "item_id" "text" NOT NULL,
    "position" integer NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "featured_items_item_type_check" CHECK (("item_type" = ANY (ARRAY['post'::"text", 'book'::"text"]))),
    CONSTRAINT "featured_items_position_check" CHECK ((("position" >= 1) AND ("position" <= 4)))
);


ALTER TABLE "public"."featured_items" OWNER TO "postgres";

-- Name: media; Type: TABLE; Schema: public; Owner: postgres

CREATE TABLE IF NOT EXISTS "public"."media" (
    "id" "text" NOT NULL,
    "name" "text" NOT NULL,
    "src" "text" NOT NULL,
    "alt" "text" DEFAULT ''::"text" NOT NULL,
    "size" "text" DEFAULT ''::"text" NOT NULL,
    "dimensions" "text",
    "uploaded_at" "date",
    "tag" "text" DEFAULT 'atmosphere'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."media" OWNER TO "postgres";

-- Name: notes; Type: TABLE; Schema: public; Owner: postgres

CREATE TABLE IF NOT EXISTS "public"."notes" (
    "id" "text" NOT NULL,
    "slug" "text" NOT NULL,
    "title" "text" NOT NULL,
    "description" "text" DEFAULT ''::"text" NOT NULL,
    "content" "jsonb" DEFAULT '[]'::"jsonb",
    "date" "date",
    "persona" "text",
    "tags" "text"[] DEFAULT '{}'::"text"[],
    "cover_image" "text",
    "status" "public"."content_status" DEFAULT 'published'::"public"."content_status" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "subtitle" "text"
);


ALTER TABLE "public"."notes" OWNER TO "postgres";

-- Name: now_entries; Type: TABLE; Schema: public; Owner: postgres

CREATE TABLE IF NOT EXISTS "public"."now_entries" (
    "id" "text" NOT NULL,
    "title" "text" NOT NULL,
    "date" "text" NOT NULL,
    "content" "text" DEFAULT ''::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."now_entries" OWNER TO "postgres";

-- Name: posts; Type: TABLE; Schema: public; Owner: postgres

CREATE TABLE IF NOT EXISTS "public"."posts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "slug" "text" NOT NULL,
    "title" "text" NOT NULL,
    "subtitle" "text",
    "description" "text" DEFAULT ''::"text" NOT NULL,
    "persona" "text",
    "tags" "text"[] DEFAULT '{}'::"text"[],
    "published_at" "date",
    "last_edited_at" "date",
    "assumed_audience" "text" DEFAULT ''::"text",
    "intro" "jsonb" DEFAULT '[]'::"jsonb",
    "sections" "jsonb" DEFAULT '[]'::"jsonb",
    "books" "jsonb" DEFAULT '[]'::"jsonb",
    "cover_image" "text",
    "status" "public"."content_status" DEFAULT 'published'::"public"."content_status" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."posts" OWNER TO "postgres";

-- Name: storage_files; Type: TABLE; Schema: public; Owner: postgres

CREATE TABLE IF NOT EXISTS "public"."storage_files" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "path" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."storage_files" OWNER TO "postgres";

-- Name: subscribers; Type: TABLE; Schema: public; Owner: postgres

CREATE TABLE IF NOT EXISTS "public"."subscribers" (
    "id" "text" NOT NULL,
    "email" "text" NOT NULL,
    "status" "text" DEFAULT 'active'::"text" NOT NULL,
    "source" "text" DEFAULT 'website'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "subscribers_status_check" CHECK (("status" = ANY (ARRAY['active'::"text", 'unsubscribed'::"text"])))
);


ALTER TABLE "public"."subscribers" OWNER TO "postgres";

-- Name: user_roles; Type: TABLE; Schema: public; Owner: postgres

CREATE TABLE IF NOT EXISTS "public"."user_roles" (
    "user_id" "uuid" NOT NULL,
    "role" "public"."app_role" DEFAULT 'user'::"public"."app_role" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."user_roles" OWNER TO "postgres";

-- Name: books books_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres

ALTER TABLE IF EXISTS "public"."books" DROP CONSTRAINT IF EXISTS "books_pkey";
ALTER TABLE ONLY "public"."books"
    ADD CONSTRAINT "books_pkey" PRIMARY KEY ("id");


-- Name: books books_slug_key; Type: CONSTRAINT; Schema: public; Owner: postgres

ALTER TABLE IF EXISTS "public"."books" DROP CONSTRAINT IF EXISTS "books_slug_key";
ALTER TABLE ONLY "public"."books"
    ADD CONSTRAINT "books_slug_key" UNIQUE ("slug");


-- Name: featured_items featured_items_item_type_item_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres

ALTER TABLE IF EXISTS "public"."featured_items" DROP CONSTRAINT IF EXISTS "featured_items_item_type_item_id_key";
ALTER TABLE ONLY "public"."featured_items"
    ADD CONSTRAINT "featured_items_item_type_item_id_key" UNIQUE ("item_type", "item_id");


-- Name: featured_items featured_items_item_type_position_key; Type: CONSTRAINT; Schema: public; Owner: postgres

ALTER TABLE IF EXISTS "public"."featured_items" DROP CONSTRAINT IF EXISTS "featured_items_item_type_position_key";
ALTER TABLE ONLY "public"."featured_items"
    ADD CONSTRAINT "featured_items_item_type_position_key" UNIQUE ("item_type", "position");


-- Name: featured_items featured_items_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres

ALTER TABLE IF EXISTS "public"."featured_items" DROP CONSTRAINT IF EXISTS "featured_items_pkey";
ALTER TABLE ONLY "public"."featured_items"
    ADD CONSTRAINT "featured_items_pkey" PRIMARY KEY ("id");


-- Name: media media_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres

ALTER TABLE IF EXISTS "public"."media" DROP CONSTRAINT IF EXISTS "media_pkey";
ALTER TABLE ONLY "public"."media"
    ADD CONSTRAINT "media_pkey" PRIMARY KEY ("id");


-- Name: notes notes_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres

ALTER TABLE IF EXISTS "public"."notes" DROP CONSTRAINT IF EXISTS "notes_pkey";
ALTER TABLE ONLY "public"."notes"
    ADD CONSTRAINT "notes_pkey" PRIMARY KEY ("id");


-- Name: notes notes_slug_key; Type: CONSTRAINT; Schema: public; Owner: postgres

ALTER TABLE IF EXISTS "public"."notes" DROP CONSTRAINT IF EXISTS "notes_slug_key";
ALTER TABLE ONLY "public"."notes"
    ADD CONSTRAINT "notes_slug_key" UNIQUE ("slug");


-- Name: now_entries now_entries_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres

ALTER TABLE IF EXISTS "public"."now_entries" DROP CONSTRAINT IF EXISTS "now_entries_pkey";
ALTER TABLE ONLY "public"."now_entries"
    ADD CONSTRAINT "now_entries_pkey" PRIMARY KEY ("id");


-- Name: posts posts_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres

ALTER TABLE IF EXISTS "public"."posts" DROP CONSTRAINT IF EXISTS "posts_pkey";
ALTER TABLE ONLY "public"."posts"
    ADD CONSTRAINT "posts_pkey" PRIMARY KEY ("id");


-- Name: posts posts_slug_key; Type: CONSTRAINT; Schema: public; Owner: postgres

ALTER TABLE IF EXISTS "public"."posts" DROP CONSTRAINT IF EXISTS "posts_slug_key";
ALTER TABLE ONLY "public"."posts"
    ADD CONSTRAINT "posts_slug_key" UNIQUE ("slug");


-- Name: storage_files storage_files_path_key; Type: CONSTRAINT; Schema: public; Owner: postgres

ALTER TABLE IF EXISTS "public"."storage_files" DROP CONSTRAINT IF EXISTS "storage_files_path_key";
ALTER TABLE ONLY "public"."storage_files"
    ADD CONSTRAINT "storage_files_path_key" UNIQUE ("path");


-- Name: storage_files storage_files_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres

ALTER TABLE IF EXISTS "public"."storage_files" DROP CONSTRAINT IF EXISTS "storage_files_pkey";
ALTER TABLE ONLY "public"."storage_files"
    ADD CONSTRAINT "storage_files_pkey" PRIMARY KEY ("id");


-- Name: subscribers subscribers_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres

ALTER TABLE IF EXISTS "public"."subscribers" DROP CONSTRAINT IF EXISTS "subscribers_email_key";
ALTER TABLE ONLY "public"."subscribers"
    ADD CONSTRAINT "subscribers_email_key" UNIQUE ("email");


-- Name: subscribers subscribers_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres

ALTER TABLE IF EXISTS "public"."subscribers" DROP CONSTRAINT IF EXISTS "subscribers_pkey";
ALTER TABLE ONLY "public"."subscribers"
    ADD CONSTRAINT "subscribers_pkey" PRIMARY KEY ("id");


-- Name: user_roles user_roles_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres

ALTER TABLE IF EXISTS "public"."user_roles" DROP CONSTRAINT IF EXISTS "user_roles_pkey";
ALTER TABLE ONLY "public"."user_roles"
    ADD CONSTRAINT "user_roles_pkey" PRIMARY KEY ("user_id");


-- Name: idx_books_persona; Type: INDEX; Schema: public; Owner: postgres

CREATE INDEX IF NOT EXISTS "idx_books_persona" ON "public"."books" USING "btree" ("persona");


-- Name: idx_books_slug; Type: INDEX; Schema: public; Owner: postgres

CREATE INDEX IF NOT EXISTS "idx_books_slug" ON "public"."books" USING "btree" ("slug");


-- Name: idx_featured_items_type; Type: INDEX; Schema: public; Owner: postgres

CREATE INDEX IF NOT EXISTS "idx_featured_items_type" ON "public"."featured_items" USING "btree" ("item_type");


-- Name: idx_media_tag; Type: INDEX; Schema: public; Owner: postgres

CREATE INDEX IF NOT EXISTS "idx_media_tag" ON "public"."media" USING "btree" ("tag");


-- Name: idx_notes_date; Type: INDEX; Schema: public; Owner: postgres

CREATE INDEX IF NOT EXISTS "idx_notes_date" ON "public"."notes" USING "btree" ("date" DESC NULLS LAST);


-- Name: idx_notes_persona; Type: INDEX; Schema: public; Owner: postgres

CREATE INDEX IF NOT EXISTS "idx_notes_persona" ON "public"."notes" USING "btree" ("persona");


-- Name: idx_notes_slug; Type: INDEX; Schema: public; Owner: postgres

CREATE INDEX IF NOT EXISTS "idx_notes_slug" ON "public"."notes" USING "btree" ("slug");


-- Name: idx_notes_status; Type: INDEX; Schema: public; Owner: postgres

CREATE INDEX IF NOT EXISTS "idx_notes_status" ON "public"."notes" USING "btree" ("status");


-- Name: idx_now_entries_date; Type: INDEX; Schema: public; Owner: postgres

CREATE INDEX IF NOT EXISTS "idx_now_entries_date" ON "public"."now_entries" USING "btree" ("date" DESC);


-- Name: idx_posts_persona; Type: INDEX; Schema: public; Owner: postgres

CREATE INDEX IF NOT EXISTS "idx_posts_persona" ON "public"."posts" USING "btree" ("persona");


-- Name: idx_posts_published_at; Type: INDEX; Schema: public; Owner: postgres

CREATE INDEX IF NOT EXISTS "idx_posts_published_at" ON "public"."posts" USING "btree" ("published_at" DESC NULLS LAST);


-- Name: idx_posts_slug; Type: INDEX; Schema: public; Owner: postgres

CREATE INDEX IF NOT EXISTS "idx_posts_slug" ON "public"."posts" USING "btree" ("slug");


-- Name: idx_posts_status; Type: INDEX; Schema: public; Owner: postgres

CREATE INDEX IF NOT EXISTS "idx_posts_status" ON "public"."posts" USING "btree" ("status");


-- Name: idx_subscribers_created_at; Type: INDEX; Schema: public; Owner: postgres

CREATE INDEX IF NOT EXISTS "idx_subscribers_created_at" ON "public"."subscribers" USING "btree" ("created_at" DESC);


-- Name: idx_subscribers_email; Type: INDEX; Schema: public; Owner: postgres

CREATE INDEX IF NOT EXISTS "idx_subscribers_email" ON "public"."subscribers" USING "btree" ("email");


-- Name: idx_user_roles_role; Type: INDEX; Schema: public; Owner: postgres

CREATE INDEX IF NOT EXISTS "idx_user_roles_role" ON "public"."user_roles" USING "btree" ("role");


-- Name: books set_updated_at; Type: TRIGGER; Schema: public; Owner: postgres

CREATE OR REPLACE TRIGGER "set_updated_at" BEFORE UPDATE ON "public"."books" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();


-- Name: media set_updated_at; Type: TRIGGER; Schema: public; Owner: postgres

CREATE OR REPLACE TRIGGER "set_updated_at" BEFORE UPDATE ON "public"."media" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();


-- Name: notes set_updated_at; Type: TRIGGER; Schema: public; Owner: postgres

CREATE OR REPLACE TRIGGER "set_updated_at" BEFORE UPDATE ON "public"."notes" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();


-- Name: now_entries set_updated_at; Type: TRIGGER; Schema: public; Owner: postgres

CREATE OR REPLACE TRIGGER "set_updated_at" BEFORE UPDATE ON "public"."now_entries" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();


-- Name: posts set_updated_at; Type: TRIGGER; Schema: public; Owner: postgres

CREATE OR REPLACE TRIGGER "set_updated_at" BEFORE UPDATE ON "public"."posts" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();


-- Name: books trg_books_slug_uniqueness; Type: TRIGGER; Schema: public; Owner: postgres

CREATE OR REPLACE TRIGGER "trg_books_slug_uniqueness" BEFORE INSERT OR UPDATE OF "slug" ON "public"."books" FOR EACH ROW EXECUTE FUNCTION "public"."check_cross_collection_slug_uniqueness"();


-- Name: notes trg_notes_slug_uniqueness; Type: TRIGGER; Schema: public; Owner: postgres

CREATE OR REPLACE TRIGGER "trg_notes_slug_uniqueness" BEFORE INSERT OR UPDATE OF "slug" ON "public"."notes" FOR EACH ROW EXECUTE FUNCTION "public"."check_cross_collection_slug_uniqueness"();


-- Name: posts trg_posts_slug_uniqueness; Type: TRIGGER; Schema: public; Owner: postgres

CREATE OR REPLACE TRIGGER "trg_posts_slug_uniqueness" BEFORE INSERT OR UPDATE OF "slug" ON "public"."posts" FOR EACH ROW EXECUTE FUNCTION "public"."check_cross_collection_slug_uniqueness"();


-- Name: user_roles user_roles_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres

ALTER TABLE IF EXISTS "public"."user_roles" DROP CONSTRAINT IF EXISTS "user_roles_user_id_fkey";
ALTER TABLE ONLY "public"."user_roles"
    ADD CONSTRAINT "user_roles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;


-- Name: subscribers Admin access subscribers; Type: POLICY; Schema: public; Owner: postgres

DROP POLICY IF EXISTS "Admin access subscribers" ON "public"."subscribers";
CREATE POLICY "Admin access subscribers" ON "public"."subscribers" TO "authenticated" USING ("public"."is_admin"()) WITH CHECK ("public"."is_admin"());


-- Name: subscribers Allow public newsletter subscriptions; Type: POLICY; Schema: public; Owner: postgres

DROP POLICY IF EXISTS "Allow public newsletter subscriptions" ON "public"."subscribers";
CREATE POLICY "Allow public newsletter subscriptions" ON "public"."subscribers" FOR INSERT TO "authenticated", "anon" WITH CHECK (true);


-- Name: books Authenticated full access; Type: POLICY; Schema: public; Owner: postgres

DROP POLICY IF EXISTS "Authenticated full access" ON "public"."books";
CREATE POLICY "Authenticated full access" ON "public"."books" TO "authenticated" USING (true) WITH CHECK (true);


-- Name: media Authenticated full access; Type: POLICY; Schema: public; Owner: postgres

DROP POLICY IF EXISTS "Authenticated full access" ON "public"."media";
CREATE POLICY "Authenticated full access" ON "public"."media" TO "authenticated" USING (true) WITH CHECK (true);


-- Name: notes Authenticated full access; Type: POLICY; Schema: public; Owner: postgres

DROP POLICY IF EXISTS "Authenticated full access" ON "public"."notes";
CREATE POLICY "Authenticated full access" ON "public"."notes" TO "authenticated" USING (true) WITH CHECK (true);


-- Name: now_entries Authenticated full access; Type: POLICY; Schema: public; Owner: postgres

DROP POLICY IF EXISTS "Authenticated full access" ON "public"."now_entries";
CREATE POLICY "Authenticated full access" ON "public"."now_entries" TO "authenticated" USING (true) WITH CHECK (true);


-- Name: posts Authenticated full access; Type: POLICY; Schema: public; Owner: postgres

DROP POLICY IF EXISTS "Authenticated full access" ON "public"."posts";
CREATE POLICY "Authenticated full access" ON "public"."posts" TO "authenticated" USING (true) WITH CHECK (true);


-- Name: storage_files Authenticated full access; Type: POLICY; Schema: public; Owner: postgres

DROP POLICY IF EXISTS "Authenticated full access" ON "public"."storage_files";
CREATE POLICY "Authenticated full access" ON "public"."storage_files" TO "authenticated" USING (true) WITH CHECK (true);


-- Name: books Public read all books; Type: POLICY; Schema: public; Owner: postgres

DROP POLICY IF EXISTS "Public read all books" ON "public"."books";
CREATE POLICY "Public read all books" ON "public"."books" FOR SELECT USING (true);


-- Name: media Public read all media; Type: POLICY; Schema: public; Owner: postgres

DROP POLICY IF EXISTS "Public read all media" ON "public"."media";
CREATE POLICY "Public read all media" ON "public"."media" FOR SELECT USING (true);


-- Name: now_entries Public read all now entries; Type: POLICY; Schema: public; Owner: postgres

DROP POLICY IF EXISTS "Public read all now entries" ON "public"."now_entries";
CREATE POLICY "Public read all now entries" ON "public"."now_entries" FOR SELECT USING (true);


-- Name: notes Public read published notes; Type: POLICY; Schema: public; Owner: postgres

DROP POLICY IF EXISTS "Public read published notes" ON "public"."notes";
CREATE POLICY "Public read published notes" ON "public"."notes" FOR SELECT USING (("status" = 'published'::"public"."content_status"));


-- Name: posts Public read published posts; Type: POLICY; Schema: public; Owner: postgres

DROP POLICY IF EXISTS "Public read published posts" ON "public"."posts";
CREATE POLICY "Public read published posts" ON "public"."posts" FOR SELECT USING (("status" = 'published'::"public"."content_status"));


-- Name: featured_items auth_full_access_featured; Type: POLICY; Schema: public; Owner: postgres

DROP POLICY IF EXISTS "auth_full_access_featured" ON "public"."featured_items";
CREATE POLICY "auth_full_access_featured" ON "public"."featured_items" TO "authenticated" USING (true) WITH CHECK (true);


-- Name: user_roles auth_full_access_roles; Type: POLICY; Schema: public; Owner: postgres

DROP POLICY IF EXISTS "auth_full_access_roles" ON "public"."user_roles";
CREATE POLICY "auth_full_access_roles" ON "public"."user_roles" TO "authenticated" USING (true) WITH CHECK (true);


-- Name: books; Type: ROW SECURITY; Schema: public; Owner: postgres

ALTER TABLE "public"."books" ENABLE ROW LEVEL SECURITY;

-- Name: featured_items; Type: ROW SECURITY; Schema: public; Owner: postgres

ALTER TABLE "public"."featured_items" ENABLE ROW LEVEL SECURITY;

-- Name: media; Type: ROW SECURITY; Schema: public; Owner: postgres

ALTER TABLE "public"."media" ENABLE ROW LEVEL SECURITY;

-- Name: notes; Type: ROW SECURITY; Schema: public; Owner: postgres

ALTER TABLE "public"."notes" ENABLE ROW LEVEL SECURITY;

-- Name: now_entries; Type: ROW SECURITY; Schema: public; Owner: postgres

ALTER TABLE "public"."now_entries" ENABLE ROW LEVEL SECURITY;

-- Name: posts; Type: ROW SECURITY; Schema: public; Owner: postgres

ALTER TABLE "public"."posts" ENABLE ROW LEVEL SECURITY;

-- Name: featured_items public_read_all_featured; Type: POLICY; Schema: public; Owner: postgres

DROP POLICY IF EXISTS "public_read_all_featured" ON "public"."featured_items";
CREATE POLICY "public_read_all_featured" ON "public"."featured_items" FOR SELECT USING (true);


-- Name: storage_files; Type: ROW SECURITY; Schema: public; Owner: postgres

ALTER TABLE "public"."storage_files" ENABLE ROW LEVEL SECURITY;

-- Name: subscribers; Type: ROW SECURITY; Schema: public; Owner: postgres

ALTER TABLE "public"."subscribers" ENABLE ROW LEVEL SECURITY;

-- Name: user_roles; Type: ROW SECURITY; Schema: public; Owner: postgres

ALTER TABLE "public"."user_roles" ENABLE ROW LEVEL SECURITY;

-- Name: user_roles users_read_own_role; Type: POLICY; Schema: public; Owner: postgres

DROP POLICY IF EXISTS "users_read_own_role" ON "public"."user_roles";
CREATE POLICY "users_read_own_role" ON "public"."user_roles" FOR SELECT USING (("auth"."uid"() = "user_id"));


-- Name: SCHEMA "public"; Type: ACL; Schema: -; Owner: pg_database_owner

GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";


-- Name: FUNCTION "check_cross_collection_slug_uniqueness"(); Type: ACL; Schema: public; Owner: postgres

GRANT ALL ON FUNCTION "public"."check_cross_collection_slug_uniqueness"() TO "anon";
GRANT ALL ON FUNCTION "public"."check_cross_collection_slug_uniqueness"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."check_cross_collection_slug_uniqueness"() TO "service_role";


-- Name: FUNCTION "is_admin"(); Type: ACL; Schema: public; Owner: postgres

GRANT ALL ON FUNCTION "public"."is_admin"() TO "anon";
GRANT ALL ON FUNCTION "public"."is_admin"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_admin"() TO "service_role";


-- Name: FUNCTION "is_super_admin"(); Type: ACL; Schema: public; Owner: postgres

GRANT ALL ON FUNCTION "public"."is_super_admin"() TO "anon";
GRANT ALL ON FUNCTION "public"."is_super_admin"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_super_admin"() TO "service_role";


-- Name: FUNCTION "update_updatedAt_column"(); Type: ACL; Schema: public; Owner: postgres

GRANT ALL ON FUNCTION "public"."update_updatedAt_column"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_updatedAt_column"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_updatedAt_column"() TO "service_role";


-- Name: FUNCTION "update_updated_at_column"(); Type: ACL; Schema: public; Owner: postgres

GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "service_role";


-- Name: FUNCTION "validate_published_post"(); Type: ACL; Schema: public; Owner: postgres

GRANT ALL ON FUNCTION "public"."validate_published_post"() TO "anon";
GRANT ALL ON FUNCTION "public"."validate_published_post"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."validate_published_post"() TO "service_role";


-- Name: TABLE "books"; Type: ACL; Schema: public; Owner: postgres

GRANT ALL ON TABLE "public"."books" TO "anon";
GRANT ALL ON TABLE "public"."books" TO "authenticated";
GRANT ALL ON TABLE "public"."books" TO "service_role";


-- Name: TABLE "featured_items"; Type: ACL; Schema: public; Owner: postgres

GRANT ALL ON TABLE "public"."featured_items" TO "anon";
GRANT ALL ON TABLE "public"."featured_items" TO "authenticated";
GRANT ALL ON TABLE "public"."featured_items" TO "service_role";


-- Name: TABLE "media"; Type: ACL; Schema: public; Owner: postgres

GRANT ALL ON TABLE "public"."media" TO "anon";
GRANT ALL ON TABLE "public"."media" TO "authenticated";
GRANT ALL ON TABLE "public"."media" TO "service_role";


-- Name: TABLE "notes"; Type: ACL; Schema: public; Owner: postgres

GRANT ALL ON TABLE "public"."notes" TO "anon";
GRANT ALL ON TABLE "public"."notes" TO "authenticated";
GRANT ALL ON TABLE "public"."notes" TO "service_role";


-- Name: TABLE "now_entries"; Type: ACL; Schema: public; Owner: postgres

GRANT ALL ON TABLE "public"."now_entries" TO "anon";
GRANT ALL ON TABLE "public"."now_entries" TO "authenticated";
GRANT ALL ON TABLE "public"."now_entries" TO "service_role";


-- Name: TABLE "posts"; Type: ACL; Schema: public; Owner: postgres

GRANT ALL ON TABLE "public"."posts" TO "anon";
GRANT ALL ON TABLE "public"."posts" TO "authenticated";
GRANT ALL ON TABLE "public"."posts" TO "service_role";


-- Name: TABLE "storage_files"; Type: ACL; Schema: public; Owner: postgres

GRANT ALL ON TABLE "public"."storage_files" TO "anon";
GRANT ALL ON TABLE "public"."storage_files" TO "authenticated";
GRANT ALL ON TABLE "public"."storage_files" TO "service_role";


-- Name: TABLE "subscribers"; Type: ACL; Schema: public; Owner: postgres

GRANT ALL ON TABLE "public"."subscribers" TO "anon";
GRANT ALL ON TABLE "public"."subscribers" TO "authenticated";
GRANT ALL ON TABLE "public"."subscribers" TO "service_role";


-- Name: TABLE "user_roles"; Type: ACL; Schema: public; Owner: postgres

GRANT ALL ON TABLE "public"."user_roles" TO "anon";
GRANT ALL ON TABLE "public"."user_roles" TO "authenticated";
GRANT ALL ON TABLE "public"."user_roles" TO "service_role";


-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: public; Owner: postgres

ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";


-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: public; Owner: supabase_admin

-- ALTER DEFAULT PRIVILEGES FOR ROLE "supabase_admin" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
-- ALTER DEFAULT PRIVILEGES FOR ROLE "supabase_admin" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
-- ALTER DEFAULT PRIVILEGES FOR ROLE "supabase_admin" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
-- ALTER DEFAULT PRIVILEGES FOR ROLE "supabase_admin" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";


-- Name: DEFAULT PRIVILEGES FOR FUNCTIONS; Type: DEFAULT ACL; Schema: public; Owner: postgres

ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";


-- Name: DEFAULT PRIVILEGES FOR FUNCTIONS; Type: DEFAULT ACL; Schema: public; Owner: supabase_admin

-- ALTER DEFAULT PRIVILEGES FOR ROLE "supabase_admin" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
-- ALTER DEFAULT PRIVILEGES FOR ROLE "supabase_admin" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
-- ALTER DEFAULT PRIVILEGES FOR ROLE "supabase_admin" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
-- ALTER DEFAULT PRIVILEGES FOR ROLE "supabase_admin" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";


-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: public; Owner: postgres

ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";


-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: public; Owner: supabase_admin

-- ALTER DEFAULT PRIVILEGES FOR ROLE "supabase_admin" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
-- ALTER DEFAULT PRIVILEGES FOR ROLE "supabase_admin" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
-- ALTER DEFAULT PRIVILEGES FOR ROLE "supabase_admin" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
-- ALTER DEFAULT PRIVILEGES FOR ROLE "supabase_admin" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";


-- PostgreSQL database dump complete

-- \unrestrict P4K1L9vIoKpgeQSxpuSciLmI42Pa4bhQ0metgWVJmS5lZ6Vbdk5qPNg6QU4Ukse

-- ── Contributions & Patronage (Razorpay & Direct Support) ───────────────────
-- NOTE: live Supabase currently lacks this table; it is re-added here because
-- the app writes to public.contributions via the service role (Razorpay flow).

CREATE TABLE IF NOT EXISTS "public"."contributions" (
    "id" text PRIMARY KEY,
    "order_id" text,
    "payment_id" text,
    "amount" numeric NOT NULL,
    "currency" text NOT NULL DEFAULT 'INR',
    "status" text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'captured', 'failed')),
    "name" text NOT NULL DEFAULT 'Anonymous Patron',
    "email" text,
    "note" text,
    "created_at" timestamp with time zone NOT NULL DEFAULT now(),
    "source" text NOT NULL DEFAULT 'razorpay' CHECK (source IN ('razorpay', 'manual'))
);

CREATE INDEX IF NOT EXISTS "idx_contributions_payment_id" ON "public"."contributions" ("payment_id");
CREATE INDEX IF NOT EXISTS "idx_contributions_order_id" ON "public"."contributions" ("order_id");
CREATE INDEX IF NOT EXISTS "idx_contributions_created_at" ON "public"."contributions" ("created_at" DESC);

ALTER TABLE "public"."contributions" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin access contributions" ON "public"."contributions";
DROP POLICY IF EXISTS "Admin access contributions" ON "public"."contributions";
CREATE POLICY "Admin access contributions" ON "public"."contributions" FOR ALL TO "authenticated"
    USING ("public"."is_admin"()) WITH CHECK ("public"."is_admin"());

GRANT ALL ON TABLE "public"."contributions" TO "service_role";