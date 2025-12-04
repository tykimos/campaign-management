-- Campaign Postings Table for tracking channel postings per campaign
CREATE TABLE IF NOT EXISTS public.campaign_postings (
  id SERIAL PRIMARY KEY,
  campaign_id INTEGER REFERENCES public.campaigns(id) ON DELETE CASCADE,
  channel_id INTEGER REFERENCES public.channels_v2(id) ON DELETE CASCADE,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'failed')),
  result TEXT,
  memo TEXT,
  posted_date DATE,
  metrics JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(campaign_id, channel_id)
);

-- Enable RLS
ALTER TABLE public.campaign_postings ENABLE ROW LEVEL SECURITY;

-- Create RLS policy
CREATE POLICY "Enable all access for campaign_postings" 
  ON public.campaign_postings 
  FOR ALL 
  USING (true);

-- Create trigger for updated_at
CREATE TRIGGER update_campaign_postings_updated_at 
  BEFORE UPDATE ON public.campaign_postings
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_campaign_postings_campaign_id ON public.campaign_postings(campaign_id);
CREATE INDEX idx_campaign_postings_channel_id ON public.campaign_postings(channel_id);
CREATE INDEX idx_campaign_postings_status ON public.campaign_postings(status);