-- Add subtitle column to notes table
ALTER TABLE public.notes ADD COLUMN IF NOT EXISTS subtitle TEXT;
