CREATE TYPE "public"."content_status" AS ENUM('published', 'unpublished');--> statement-breakpoint
CREATE TYPE "public"."app_role" AS ENUM('user', 'content_admin', 'super_admin');--> statement-breakpoint
CREATE TABLE "posts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"title" text NOT NULL,
	"subtitle" text,
	"description" text DEFAULT '' NOT NULL,
	"persona" text,
	"tags" text[] DEFAULT '{}'::text[],
	"published_at" date,
	"last_edited_at" date,
	"assumed_audience" text DEFAULT '',
	"intro" jsonb DEFAULT '[]'::jsonb,
	"sections" jsonb DEFAULT '[]'::jsonb,
	"books" jsonb DEFAULT '[]'::jsonb,
	"cover_image" text,
	"status" "content_status" DEFAULT 'published' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notes" (
	"id" text PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"title" text NOT NULL,
	"subtitle" text,
	"description" text DEFAULT '' NOT NULL,
	"content" jsonb DEFAULT '[]'::jsonb,
	"date" date,
	"persona" text,
	"tags" text[] DEFAULT '{}'::text[],
	"cover_image" text,
	"status" "content_status" DEFAULT 'published' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "books" (
	"id" text PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"title" text NOT NULL,
	"author" text NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"date" text,
	"persona" text,
	"tags" text[] DEFAULT '{}'::text[],
	"cover" text,
	"link" text,
	"is_published" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "now_entries" (
	"id" text PRIMARY KEY NOT NULL,
	"slug" text DEFAULT '' NOT NULL,
	"title" text NOT NULL,
	"date" text NOT NULL,
	"content" text DEFAULT '' NOT NULL,
	"location" text DEFAULT '' NOT NULL,
	"status" "content_status" DEFAULT 'published' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_edited_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "media" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"src" text NOT NULL,
	"alt" text DEFAULT '' NOT NULL,
	"size" text DEFAULT '' NOT NULL,
	"dimensions" text,
	"uploaded_at" date,
	"tag" text DEFAULT '',
	"tags" text[] DEFAULT '{}'::text[],
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "featured_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"item_type" text NOT NULL,
	"item_id" text NOT NULL,
	"position" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "subscribers" (
	"id" text PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"source" text DEFAULT 'website' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_roles" (
	"user_id" uuid PRIMARY KEY NOT NULL,
	"role" "app_role" DEFAULT 'user' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "contributions" (
	"id" text PRIMARY KEY NOT NULL,
	"order_id" text,
	"payment_id" text,
	"amount" numeric NOT NULL,
	"currency" text DEFAULT 'INR' NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"name" text DEFAULT 'Anonymous Patron' NOT NULL,
	"email" text,
	"note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"source" text DEFAULT 'razorpay' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "storage_files" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"path" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "posts_slug_idx" ON "posts" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "posts_status_idx" ON "posts" USING btree ("status");--> statement-breakpoint
CREATE INDEX "posts_created_at_idx" ON "posts" USING btree ("created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "notes_slug_idx" ON "notes" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "notes_status_idx" ON "notes" USING btree ("status");--> statement-breakpoint
CREATE INDEX "notes_created_at_idx" ON "notes" USING btree ("created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "books_slug_idx" ON "books" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "idx_books_is_published" ON "books" USING btree ("is_published");--> statement-breakpoint
CREATE INDEX "books_created_at_idx" ON "books" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "now_entries_status_idx" ON "now_entries" USING btree ("status");--> statement-breakpoint
CREATE INDEX "now_entries_created_at_idx" ON "now_entries" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "now_entries_slug_idx" ON "now_entries" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "media_created_at_idx" ON "media" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "media_src_idx" ON "media" USING btree ("src");--> statement-breakpoint
CREATE INDEX "featured_items_type_idx" ON "featured_items" USING btree ("item_type");--> statement-breakpoint
CREATE INDEX "featured_items_pos_idx" ON "featured_items" USING btree ("position");--> statement-breakpoint
CREATE UNIQUE INDEX "subscribers_email_idx" ON "subscribers" USING btree ("email");--> statement-breakpoint
CREATE INDEX "subscribers_status_idx" ON "subscribers" USING btree ("status");--> statement-breakpoint
CREATE INDEX "subscribers_created_at_idx" ON "subscribers" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_contributions_payment_id" ON "contributions" USING btree ("payment_id");--> statement-breakpoint
CREATE INDEX "idx_contributions_order_id" ON "contributions" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "idx_contributions_created_at" ON "contributions" USING btree ("created_at");