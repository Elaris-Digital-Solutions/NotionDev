-- Migration: Phase 1 Hardening
-- Description: Migrates blocks to JSONB, adds version for locking, adds plain_text for search, and adds RPC for DB views.

-- 1. Add new columns 'plain_text' and 'version'
ALTER TABLE public.blocks 
ADD COLUMN IF NOT EXISTS plain_text text,
ADD COLUMN IF NOT EXISTS version integer DEFAULT 1;

-- 2. Populate 'plain_text' with existing content (assuming content was text)
UPDATE public.blocks 
SET plain_text = content 
WHERE content IS NOT NULL;

-- 3. Convert 'content' to JSONB
-- We assume the old content was a simple string. We wrap it in a Tiptap document structure.
-- If content was null or empty, we create an empty paragraph doc.
ALTER TABLE public.blocks 
ALTER COLUMN content TYPE jsonb 
USING (
  CASE 
    WHEN content IS NULL OR content = '' THEN 
      '{"type": "doc", "content": [{"type": "paragraph"}]}'::jsonb
    ELSE 
      jsonb_build_object(
        'type', 'doc', 
        'content', jsonb_build_array(
          jsonb_build_object(
            'type', 'paragraph', 
            'content', jsonb_build_array(
              jsonb_build_object(
                'type', 'text', 
                'text', content
              )
            )
          )
        )
      )
  END
);

-- 4. Create Indices
CREATE INDEX IF NOT EXISTS idx_blocks_content ON public.blocks USING GIN (content);
CREATE INDEX IF NOT EXISTS idx_blocks_plain_text ON public.blocks USING btree (plain_text);
CREATE INDEX IF NOT EXISTS idx_blocks_version ON public.blocks (version);

-- 5. Create RPC function for efficient Database View (Solving N+1)
CREATE OR REPLACE FUNCTION get_database_view(target_database_id uuid)
RETURNS TABLE (
  id uuid,
  title text,
  icon text,
  cover_image text,
  created_at timestamp with time zone,
  updated_at timestamp with time zone,
  properties jsonb
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id, 
    p.title, 
    p.icon, 
    p.cover_image,
    p.created_at,
    p.updated_at,
    jsonb_object_agg(
      dp.name, 
      COALESCE(ppv.value, 'null'::jsonb)
    ) AS properties
  FROM public.pages p
  LEFT JOIN public.page_property_values ppv ON ppv.page_id = p.id
  LEFT JOIN public.database_properties dp ON dp.id = ppv.property_id
  WHERE p.parent_database_id = target_database_id
  GROUP BY p.id;
END;
$$ LANGUAGE plpgsql;

-- 6. Add Optimistic Locking trigger (Optional but good for data integrity)
--    We will enforce this in the Application Layer (Mutation) as per the plan, 
--    but a function to check it is helpful if we move logic to DB later.
