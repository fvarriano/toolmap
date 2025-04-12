-- Create tables
CREATE TABLE tools (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  url TEXT,
  primary_tag TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

CREATE TABLE workflows (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  source_url TEXT NOT NULL,
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

CREATE TABLE workflow_tools (
  workflow_id UUID REFERENCES workflows(id) ON DELETE CASCADE,
  tool_id UUID REFERENCES tools(id) ON DELETE CASCADE,
  PRIMARY KEY (workflow_id, tool_id)
);

-- Create indexes for better query performance
CREATE INDEX idx_tools_primary_tag ON tools(primary_tag);
CREATE INDEX idx_workflows_created_at ON workflows(created_at);
CREATE INDEX idx_workflows_tags ON workflows USING GIN(tags);

-- Enable Row Level Security (RLS)
ALTER TABLE tools ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_tools ENABLE ROW LEVEL SECURITY;

-- Create policies (initially allowing all operations for simplicity)
CREATE POLICY "Allow all operations on tools" ON tools FOR ALL USING (true);
CREATE POLICY "Allow all operations on workflows" ON workflows FOR ALL USING (true);
CREATE POLICY "Allow all operations on workflow_tools" ON workflow_tools FOR ALL USING (true); 