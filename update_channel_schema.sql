-- 채널 유형 테이블 생성
CREATE TABLE IF NOT EXISTS public.campaign_channel_types (
    id VARCHAR(50) PRIMARY KEY,
    name TEXT NOT NULL,
    display_order INT DEFAULT 0,
    icon VARCHAR(50),
    attributes_config JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- campaign_channels 테이블 수정
ALTER TABLE public.campaign_channels 
ADD COLUMN IF NOT EXISTS channel_type VARCHAR(50),
ADD COLUMN IF NOT EXISTS attributes JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS member_count INT,
ADD COLUMN IF NOT EXISTS view_count INT,
ADD COLUMN IF NOT EXISTS posted_date DATE,
ADD COLUMN IF NOT EXISTS registered_date DATE,
ADD COLUMN IF NOT EXISTS deleted_date DATE,
ADD COLUMN IF NOT EXISTS result TEXT,
ADD COLUMN IF NOT EXISTS memo TEXT,
ADD COLUMN IF NOT EXISTS email TEXT,
ADD COLUMN IF NOT EXISTS phone TEXT,
ADD COLUMN IF NOT EXISTS homepage_url TEXT;

-- 채널 유형 데이터 삽입
INSERT INTO public.campaign_channel_types (id, name, display_order, icon, attributes_config) VALUES
('platform_service', '플랫폼서비스', 1, '🌐', '{"required": ["name", "url"], "optional": ["member_count", "view_count"]}'),
('government', '정부기관', 2, '🏛️', '{"required": ["name"], "optional": ["url", "view_count"]}'),
('competition', '공모전', 3, '🏆', '{"required": ["name", "url"], "optional": ["view_count"]}'),
('portal_cafe', '포털카페', 4, '☕', '{"required": ["name", "url"], "optional": ["member_count", "view_count"]}'),
('sns_group', 'SNS그룹', 5, '📱', '{"required": ["name", "url"], "optional": ["member_count", "view_count"]}'),
('community', '커뮤니티', 6, '👥', '{"required": ["name", "url"], "optional": ["member_count", "view_count"]}'),
('blog', '블로그', 7, '📝', '{"required": ["name", "url"], "optional": ["view_count"]}'),
('open_chat', '오픈단톡방', 8, '💬', '{"required": ["name"], "optional": ["member_count", "url"]}'),
('discord', '디스코드', 9, '🎮', '{"required": ["name"], "optional": ["member_count", "url"]}'),
('university', '대학교공문', 10, '🎓', '{"required": ["name"], "optional": ["url", "email"]}'),
('graduate', '대학원공문', 11, '🎓', '{"required": ["name"], "optional": ["url", "email"]}'),
('highschool', '고등학교공문', 12, '🏫', '{"required": ["name"], "optional": ["url", "email"]}'),
('institution', '기관공문', 13, '🏢', '{"required": ["name"], "optional": ["url", "email"]}'),
('dm_academic', 'DM-학회', 14, '📧', '{"required": ["name", "email"], "optional": ["homepage_url"]}'),
('dm_association', 'DM-협회', 15, '📧', '{"required": ["name", "email"], "optional": ["homepage_url", "phone"]}'),
('dm_university', 'DM-대학', 16, '📧', '{"required": ["name", "email"], "optional": []]}'),
('outdoor_university', '옥외광고-대학', 17, '🎯', '{"required": ["name"], "optional": ["region", "campus_type", "academic_system"]}'),
('outdoor_nst', '옥외광고-출연연NST', 18, '🎯', '{"required": ["name"], "optional": ["contact", "main_phone"]}'),
('outdoor_partner', '옥외광고-협력기관', 19, '🎯', '{"required": ["name"], "optional": ["contact", "main_phone"]}'),
('performance', '퍼포먼스', 20, '📊', '{"required": ["name"], "optional": ["url", "view_count"]}'),
('event_site', '이벤트사이트', 21, '🎪', '{"required": ["name", "url"], "optional": ["view_count"]}')
ON CONFLICT (id) DO UPDATE 
SET name = EXCLUDED.name,
    display_order = EXCLUDED.display_order,
    icon = EXCLUDED.icon,
    attributes_config = EXCLUDED.attributes_config,
    updated_at = NOW();

-- 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_channels_channel_type ON public.campaign_channels(channel_type);
CREATE INDEX IF NOT EXISTS idx_channels_attributes ON public.campaign_channels USING GIN (attributes);

-- RLS 정책 (채널 유형 테이블)
ALTER TABLE public.campaign_channel_types ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read channel types" 
    ON public.campaign_channel_types 
    FOR SELECT 
    USING (true);

CREATE POLICY "Public insert channel types" 
    ON public.campaign_channel_types 
    FOR INSERT 
    WITH CHECK (true);

CREATE POLICY "Public update channel types" 
    ON public.campaign_channel_types 
    FOR UPDATE 
    USING (true)
    WITH CHECK (true);

-- 뷰 생성 (채널과 유형 조인)
CREATE OR REPLACE VIEW campaign_channels_with_type AS
SELECT 
    cc.*,
    cct.name as type_name,
    cct.icon as type_icon,
    cct.attributes_config
FROM campaign_channels cc
LEFT JOIN campaign_channel_types cct ON cc.channel_type = cct.id;