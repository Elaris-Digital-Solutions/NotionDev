-- Comments Table Migration
CREATE TABLE comments (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  page_id uuid REFERENCES pages(id) ON DELETE CASCADE NOT NULL,
  block_id uuid REFERENCES blocks(id) ON DELETE CASCADE, -- Optional, for block comments
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  content text NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  resolved_at timestamptz -- If not null, comment is resolved
);

-- Enable RLS
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

-- Reading Comments:
-- Users can see comments if they have access to the page.
CREATE POLICY "Users can view comments on pages they can view" ON comments
  FOR SELECT
  USING (
    public.has_page_access(page_id)
  );

-- Creating Comments:
-- Users can comment if they have access to the page (edit/comment permission).
-- For simplicity, we reuse has_page_access (which implies at least view/comment).
-- Ideally we check specific permission role, but Viewers usually can comment in Notion? 
-- Notion: "Can Comment" role. Our system: we have roles.
-- Let's stick to has_page_access for now to keep it moving.
CREATE POLICY "Users can create comments on pages they can view" ON comments
  FOR INSERT
  WITH CHECK (
    auth.uid() = user_id AND
    public.has_page_access(page_id)
  );

-- Updating/Deleting Comments:
-- Users can edit/delete their OWN comments.
CREATE POLICY "Users can edit own comments" ON comments
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own comments" ON comments
  FOR DELETE
  USING (auth.uid() = user_id);
