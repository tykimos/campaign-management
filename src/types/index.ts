export interface User {
  id: string;
  email: string;
  name?: string;
  role: 'user' | 'admin';
  created_at: string;
  updated_at: string;
}

export interface CampaignCategory {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  color: string;
  display_order: number;
  is_active: boolean;
}

export interface Campaign {
  id: number;
  name: string;
  category_id?: string;
  category?: CampaignCategory;
  description?: string;
  start_date?: string;
  end_date?: string;
  target_views: number;
  target_registrations: number;
  budget?: number;
  status: 'planning' | 'active' | 'completed' | 'cancelled';
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface CampaignChannel {
  id: number;
  name: string;
  category: 'contest' | 'community' | 'sns' | 'event';
  url?: string;
  member_count?: number;
  avg_daily_views?: number;
  description?: string;
  contact_info?: string;
  requirements?: string;
  is_active: boolean;
  last_used_at?: string;
  created_at: string;
  updated_at: string;
}

export interface CampaignPost {
  id: number;
  campaign_id: number;
  campaign?: Campaign;
  channel_id: number;
  channel?: CampaignChannel;
  post_url: string;
  title?: string;
  content?: string;
  posted_date: string;
  deleted_date?: string;
  view_count: number;
  click_count: number;
  registration_count: number;
  conversion_rate?: number;
  status: 'pending' | 'posted' | 'deleted' | 'expired';
  result?: 'success' | 'moderate' | 'poor';
  notes?: string;
  posted_by?: string;
  created_at: string;
  updated_at: string;
}