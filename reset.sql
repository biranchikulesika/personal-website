-- reset.sql
-- PURPOSE: Completely reset the database to a clean state.

-- DROP POLICIES
DO $$ 
DECLARE
    row RECORD;
BEGIN
    FOR row IN SELECT tablename, policyname FROM pg_policies WHERE schemaname = 'public' 
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON "public".%I', row.policyname, row.tablename);
    END LOOP;
END $$;

-- DROP ALL TABLES IN THE PUBLIC SCHEMA
DO $$
DECLARE
    row RECORD;
BEGIN
    FOR row IN SELECT tablename FROM pg_tables WHERE schemaname = 'public'
    LOOP
        EXECUTE format('DROP TABLE IF EXISTS "public".%I CASCADE', row.tablename);
    END LOOP;
END $$;

-- DROP ALL VIEWS
DO $$
DECLARE
    row RECORD;
BEGIN
    FOR row IN SELECT viewname FROM pg_views WHERE schemaname = 'public'
    LOOP
        EXECUTE format('DROP VIEW IF EXISTS "public".%I CASCADE', row.viewname);
    END LOOP;
END $$;

-- DROP ALL FUNCTIONS AND TRIGGERS
DO $$
DECLARE
    row RECORD;
BEGIN
    FOR row IN SELECT proname, oid FROM pg_proc WHERE pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
    LOOP
        EXECUTE format('DROP FUNCTION IF EXISTS "public".%I CASCADE', row.proname);
    END LOOP;
END $$;

-- DROP ALL ENUMS
DO $$
DECLARE
    row RECORD;
BEGIN
    FOR row IN SELECT typname FROM pg_type WHERE typnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public') AND typtype = 'e'
    LOOP
        EXECUTE format('DROP TYPE IF EXISTS "public".%I CASCADE', row.typname);
    END LOOP;
END $$;
