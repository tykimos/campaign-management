-- =====================================================
-- Campaign Management System Database Schema
-- Version: 1.1.0
-- Updated: 2024-12-04
-- =====================================================

-- =====================================================
-- 0. Drop existing tables (if any)
-- =====================================================

DROP TABLE IF EXISTS public.campaign_posts CASCADE;
DROP TABLE IF EXISTS public.campaign_channels CASCADE;
DROP TABLE IF EXISTS public.campaign_categories CASCADE;
DROP TABLE IF EXISTS public.campaigns CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;

-- Drop sequences
DROP SEQUENCE IF EXISTS campaign_number_seq CASCADE;

-- =====================================================
-- 1. Table Creation
-- =====================================================

-- 1.1 Users table (auth.users integration)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  role TEXT DEFAULT 'user', -- user, admin
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- 1.2 Campaign Categories table
CREATE TABLE IF NOT EXISTS public.campaign_categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  color TEXT DEFAULT 'bg-blue-100',
  display_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.campaign_categories ENABLE ROW LEVEL SECURITY;

-- 1.3 Campaigns table
CREATE TABLE IF NOT EXISTS public.campaigns (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  category_id TEXT REFERENCES public.campaign_categories(id),
  description TEXT,
  start_date DATE,
  end_date DATE,
  target_views INT DEFAULT 0,
  target_registrations INT DEFAULT 0,
  budget DECIMAL(18,2),
  status TEXT DEFAULT 'planning', -- planning, active, completed, cancelled
  created_by UUID REFERENCES public.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;

-- 1.4 Campaign Channels table (posting channels)
CREATE TABLE IF NOT EXISTS public.campaign_channels (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL, -- contest, community, sns, etc
  url TEXT,
  member_count INT,
  avg_daily_views INT,
  description TEXT,
  contact_info TEXT,
  requirements TEXT, -- posting requirements
  is_active BOOLEAN DEFAULT TRUE,
  last_used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_channels_category ON public.campaign_channels(category);
CREATE INDEX IF NOT EXISTS idx_channels_active ON public.campaign_channels(is_active);

ALTER TABLE public.campaign_channels ENABLE ROW LEVEL SECURITY;

-- 1.5 Campaign Posts table (posting history and performance)
CREATE TABLE IF NOT EXISTS public.campaign_posts (
  id BIGSERIAL PRIMARY KEY,
  campaign_id BIGINT REFERENCES public.campaigns(id) ON DELETE CASCADE,
  channel_id BIGINT REFERENCES public.campaign_channels(id),
  post_url TEXT NOT NULL,
  title TEXT,
  content TEXT,
  posted_date DATE NOT NULL,
  deleted_date DATE,
  view_count INT DEFAULT 0,
  click_count INT DEFAULT 0,
  registration_count INT DEFAULT 0,
  conversion_rate DECIMAL(5,2), -- percentage
  status TEXT DEFAULT 'pending', -- pending, posted, deleted, expired
  result TEXT, -- success, moderate, poor
  notes TEXT,
  posted_by UUID REFERENCES public.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_posts_campaign ON public.campaign_posts(campaign_id);
CREATE INDEX IF NOT EXISTS idx_posts_channel ON public.campaign_posts(channel_id);
CREATE INDEX IF NOT EXISTS idx_posts_posted_date ON public.campaign_posts(posted_date DESC);
CREATE INDEX IF NOT EXISTS idx_posts_status ON public.campaign_posts(status);

ALTER TABLE public.campaign_posts ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 2. Row Level Security (RLS) Policies
-- =====================================================

-- 2.1 Users table policies (FIXED: Removed infinite recursion)
CREATE POLICY "Users can view own profile" 
  ON public.users FOR SELECT 
  USING (auth.uid() = id);

CREATE POLICY "Admin can view all users" 
  ON public.users FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users u 
      WHERE u.id = auth.uid() AND u.role = 'admin'
      LIMIT 1
    )
  );

CREATE POLICY "Users can update own profile" 
  ON public.users FOR UPDATE 
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" 
  ON public.users FOR INSERT 
  WITH CHECK (auth.uid() = id);

-- 2.2 Campaign Categories policies (everyone can view)
CREATE POLICY "Anyone can view categories" 
  ON public.campaign_categories FOR SELECT 
  USING (true);

CREATE POLICY "Admin can manage categories" 
  ON public.campaign_categories FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role = 'admin'
      LIMIT 1
    )
  );

CREATE POLICY "Admin can update categories" 
  ON public.campaign_categories FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role = 'admin'
      LIMIT 1
    )
  );

CREATE POLICY "Admin can delete categories" 
  ON public.campaign_categories FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role = 'admin'
      LIMIT 1
    )
  );

-- 2.3 Campaigns policies
CREATE POLICY "Anyone can view active campaigns" 
  ON public.campaigns FOR SELECT 
  USING (true);

CREATE POLICY "Authenticated users can create campaigns" 
  ON public.campaigns FOR INSERT 
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update own campaigns" 
  ON public.campaigns FOR UPDATE 
  USING (
    created_by = auth.uid() OR 
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role = 'admin'
      LIMIT 1
    )
  );

CREATE POLICY "Users can delete own campaigns" 
  ON public.campaigns FOR DELETE 
  USING (
    created_by = auth.uid() OR 
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role = 'admin'
      LIMIT 1
    )
  );

-- 2.4 Campaign Channels policies
CREATE POLICY "Anyone can view channels" 
  ON public.campaign_channels FOR SELECT 
  USING (true);

CREATE POLICY "Authenticated users can create channels" 
  ON public.campaign_channels FOR INSERT 
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update channels" 
  ON public.campaign_channels FOR UPDATE
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admin can delete channels" 
  ON public.campaign_channels FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role = 'admin'
      LIMIT 1
    )
  );

-- 2.5 Campaign Posts policies
CREATE POLICY "Anyone can view posts" 
  ON public.campaign_posts FOR SELECT 
  USING (true);

CREATE POLICY "Authenticated users can create posts" 
  ON public.campaign_posts FOR INSERT 
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update own posts" 
  ON public.campaign_posts FOR UPDATE 
  USING (
    posted_by = auth.uid() OR 
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role = 'admin'
      LIMIT 1
    )
  );

CREATE POLICY "Users can delete own posts" 
  ON public.campaign_posts FOR DELETE 
  USING (
    posted_by = auth.uid() OR 
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role = 'admin'
      LIMIT 1
    )
  );

-- =====================================================
-- 3. Triggers and Functions
-- =====================================================

-- 3.1 Updated_at auto update function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers to tables
DROP TRIGGER IF EXISTS update_users_updated_at ON public.users;
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_campaigns_updated_at ON public.campaigns;
CREATE TRIGGER update_campaigns_updated_at BEFORE UPDATE ON public.campaigns
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_campaign_channels_updated_at ON public.campaign_channels;
CREATE TRIGGER update_campaign_channels_updated_at BEFORE UPDATE ON public.campaign_channels
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_campaign_posts_updated_at ON public.campaign_posts;
CREATE TRIGGER update_campaign_posts_updated_at BEFORE UPDATE ON public.campaign_posts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_campaign_categories_updated_at ON public.campaign_categories;
CREATE TRIGGER update_campaign_categories_updated_at BEFORE UPDATE ON public.campaign_categories
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 3.2 User creation trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (id, email, created_at, updated_at)
  VALUES (new.id, new.email, now(), now())
  ON CONFLICT (id) DO NOTHING;
  
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 3.3 Calculate conversion rate trigger
CREATE OR REPLACE FUNCTION calculate_conversion_rate()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.view_count > 0 THEN
    NEW.conversion_rate = (NEW.registration_count::DECIMAL / NEW.view_count) * 100;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS calculate_post_conversion ON public.campaign_posts;
CREATE TRIGGER calculate_post_conversion
  BEFORE INSERT OR UPDATE OF view_count, registration_count ON public.campaign_posts
  FOR EACH ROW EXECUTE FUNCTION calculate_conversion_rate();

-- =====================================================
-- 4. Sample Data
-- =====================================================

-- Campaign Categories
INSERT INTO public.campaign_categories (id, name, description, icon, color, display_order) VALUES
('contest', '공모전', '각종 경진대회 및 공모전', '🏆', 'bg-yellow-100', 1),
('seminar', '세미나', '교육 및 세미나 프로그램', '📚', 'bg-blue-100', 2),
('community', '커뮤니티', '온라인 커뮤니티 게시', '👥', 'bg-green-100', 3),
('sns', 'SNS', '소셜 미디어 마케팅', '📱', 'bg-purple-100', 4),
('event', '이벤트', '오프라인 이벤트', '🎉', 'bg-pink-100', 5)
ON CONFLICT (id) DO NOTHING;

-- Sample Campaign Channels (Contest Platforms)
INSERT INTO public.campaign_channels (name, category, url, member_count, avg_daily_views, description, is_active) VALUES
('스펙토리', 'contest', 'https://www.spectory.net', NULL, 5000, '대학생 공모전 플랫폼', true),
('씽굿', 'contest', 'https://www.thinkcontest.com', NULL, 3000, '공모전 통합 플랫폼', true),
('씽유', 'contest', 'https://thinkyou.co.kr', NULL, 2000, '공모전 정보 사이트', true),
('온오프믹스', 'contest', 'https://onoffmix.com', NULL, 10000, '이벤트 및 모임 플랫폼', true),
('올콘', 'contest', 'https://www.all-con.co.kr', NULL, 4000, '공모전 전문 플랫폼', true),
('요즘것들', 'contest', 'https://www.allforyoung.com', NULL, 8000, '청년 대상 플랫폼', true),
('이벤터스', 'contest', 'https://event-us.kr', NULL, 6000, '이벤트 통합 플랫폼', true),
('인크루트', 'contest', 'https://gongmo.incruit.com', NULL, 5000, '채용 연계 공모전', true),
('링커리어', 'contest', 'https://linkareer.com', 297, 15000, '대학생 커리어 플랫폼', true),
('데모데이', 'contest', 'http://www.demoday.co.kr', 21, 2000, '창업 경진대회 플랫폼', true),
('슈퍼루키', 'contest', 'https://www.superookie.com', NULL, 3000, '신입 대상 플랫폼', true),
('위비티', 'contest', 'https://www.wevity.com', NULL, 8000, '대외활동 통합 플랫폼', true),
('캠퍼즈', 'contest', 'https://www.campuz.net', NULL, 4000, '대학생 커뮤니티', true),
('컬처플', 'contest', 'https://www.cultureple.com', NULL, 3000, '문화 콘텐츠 플랫폼', true),
('코워커', 'contest', 'https://co-worker.co.kr', 6212, 5000, '협업 프로젝트 플랫폼', true),
('콘테스트 코리아', 'contest', 'https://www.contestkorea.com', 98, 7000, '공모전 종합 플랫폼', true),
('G콘테스트', 'contest', 'https://gcontest.co.kr', 13, 2000, '공모전 정보 사이트', true),
('공모전알고', 'contest', 'https://www.contestalgo.com', NULL, 3500, '공모전 알림 서비스', true),
('공모탑', 'contest', 'https://www.gongmotop.com', 13, 2500, '공모전 전문 플랫폼', true),
('대티즌', 'contest', 'https://www.detizen.com', NULL, 4000, '대학생 활동 플랫폼', true)
ON CONFLICT DO NOTHING;

-- Sample Community Channels
INSERT INTO public.campaign_channels (name, category, url, description, is_active) VALUES
('이오플래닛', 'community', 'https://eopla.net', '개발자 커뮤니티', true),
('디씨인사이드 프로그래밍', 'community', 'https://gall.dcinside.com', '프로그래밍 갤러리', true),
('인디터웹', 'community', 'https://inditor.co.kr', '인디 개발자 커뮤니티', true),
('AI Dev', 'community', 'http://aidev.co.kr', '인공지능 개발자 모임', true),
('AITUTOR21', 'community', 'http://aitutor21.com', 'AI 교육 커뮤니티', true),
('데브코리아', 'community', 'http://devkorea.co.kr', '개발자 커뮤니티', true),
('구루비', 'community', 'http://gurubee.net', '개발자 & DBA 커뮤니티', true),
('Iamroot', 'community', 'http://www.iamroot.org', '리눅스 커널 스터디', true),
('aigee', 'community', 'https://aigee.ai', 'AI 전문 커뮤니티', true),
('커리어리', 'community', 'https://careerly.co.kr', '직장인 커리어 플랫폼', true),
('뎁스노트', 'community', 'https://devsnote.com', '개발 노트 공유', true),
('파이토치', 'community', 'https://discuss.pytorch.kr', '파이토치 한국 포럼', true),
('하모니케이알', 'community', 'https://hamonikr.org', '한국 리눅스 커뮤니티', true),
('자바스크립트데브', 'community', 'https://jsdev.kr', '자바스크립트 개발자', true),
('오키코리아', 'community', 'https://okky.kr', 'IT 통합 커뮤니티', true),
('PHP스쿨', 'community', 'https://phpschool.com', 'PHP 개발자 커뮤니티', true),
('스프', 'community', 'https://soup.pw', '프로젝트 공유 플랫폼', true),
('CodeIgniter 한국', 'community', 'https://www.cikorea.net', 'CI 프레임워크 포럼', true),
('LDS', 'community', 'https://www.linuxdata.org', '리눅스 데이터 시스템', true),
('창업코리아', 'community', 'https://www.dream.go.kr', '창업 커뮤니티', true),
('대구창조경제혁신센터', 'community', 'https://startup.daegu.go.kr', '지역 창업 지원', true),
('넥스트유니콘', 'community', 'https://www.nextunicorn.kr', '스타트업 플랫폼', true),
('돌고넷', 'community', 'http://dolgo.net', '개발자 Q&A 커뮤니티', true)
ON CONFLICT DO NOTHING;

-- Sample Campaigns (with actual user ID - will be updated when user logs in)
INSERT INTO public.campaigns (name, category_id, description, start_date, end_date, target_views, target_registrations, status, budget) VALUES
('제3회 네트워크 지능화를 위한 인공지능 해커톤', 'contest', '네트워크 AI 기술 경진대회', '2024-09-01', '2024-10-31', 10000, 100, 'completed', 500000),
('딥페이크 범죄 대응을 위한 AI 탐지 모델 경진대회', 'contest', '딥페이크 탐지 기술 개발', '2024-11-01', '2024-12-31', 15000, 200, 'active', 1000000),
('2024 AI 개발자 세미나', 'seminar', 'AI 최신 기술 트렌드 공유', '2024-12-10', '2024-12-10', 5000, 500, 'planning', 300000),
('인공지능 윤리 워크샵', 'seminar', 'AI 윤리 가이드라인 교육', '2024-12-15', '2024-12-15', 3000, 150, 'planning', 200000),
('머신러닝 스터디 모집', 'community', '주간 ML 스터디 그룹', '2024-12-01', '2025-02-28', 2000, 50, 'active', 0)
ON CONFLICT DO NOTHING;

-- Sample Posts (will need to update campaign_id and channel_id based on actual IDs)
-- These will be inserted after campaigns and channels are created
INSERT INTO public.campaign_posts (
  campaign_id, 
  channel_id, 
  post_url, 
  title,
  posted_date, 
  view_count, 
  click_count, 
  registration_count,
  status,
  result
) 
SELECT 
  c.id,
  ch.id,
  'https://example.com/post/' || c.id || '-' || ch.id,
  c.name || ' - ' || ch.name,
  CURRENT_DATE - INTERVAL '5 days',
  FLOOR(RANDOM() * 1000 + 100),
  FLOOR(RANDOM() * 100 + 10),
  FLOOR(RANDOM() * 20 + 1),
  'posted',
  CASE WHEN RANDOM() > 0.5 THEN 'success' ELSE 'moderate' END
FROM 
  public.campaigns c
  CROSS JOIN public.campaign_channels ch
WHERE 
  c.status IN ('active', 'completed')
  AND ch.category = 'contest'
LIMIT 10
ON CONFLICT DO NOTHING;

-- More sample posts with various statuses
INSERT INTO public.campaign_posts (
  campaign_id, 
  channel_id, 
  post_url,
  title, 
  posted_date, 
  view_count, 
  click_count, 
  registration_count,
  status
) 
SELECT 
  c.id,
  ch.id,
  'https://example.com/community/' || c.id || '-' || ch.id,
  c.name || ' 커뮤니티 게재',
  CURRENT_DATE - INTERVAL '10 days',
  FLOOR(RANDOM() * 500 + 50),
  FLOOR(RANDOM() * 50 + 5),
  FLOOR(RANDOM() * 10),
  'posted'
FROM 
  public.campaigns c
  CROSS JOIN public.campaign_channels ch
WHERE 
  c.status IN ('active', 'completed')
  AND ch.category = 'community'
LIMIT 10
ON CONFLICT DO NOTHING;

-- =====================================================
-- 5. Additional Indexes for Performance
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_posts_performance ON public.campaign_posts(view_count, click_count, registration_count);
CREATE INDEX IF NOT EXISTS idx_campaigns_dates ON public.campaigns(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_campaigns_status ON public.campaigns(status);

-- Update statistics
ANALYZE public.campaigns;
ANALYZE public.campaign_channels;
ANALYZE public.campaign_posts;