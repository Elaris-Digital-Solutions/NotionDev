-- Enable replication for Realtime on core tables
-- Supabase requires adding tables to the 'supabase_realtime' publication

-- Pages: Collaborative editing of titles/icons
ALTER PUBLICATION supabase_realtime ADD TABLE pages;

-- Blocks: Collaborative content editing
ALTER PUBLICATION supabase_realtime ADD TABLE blocks;

-- Comments: Live chat
ALTER PUBLICATION supabase_realtime ADD TABLE comments;

-- Page Properties: Live database updates
ALTER PUBLICATION supabase_realtime ADD TABLE page_property_values;
