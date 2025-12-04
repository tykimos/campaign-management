-- 채널 유형 시스템 설정 SQL
-- Supabase Dashboard에서 실행: https://supabase.com/dashboard/project/zaivjzyuxyajadfwfbkx/sql/new

-- 1. 채널 유형 테이블
CREATE TABLE IF NOT EXISTS public.channel_types (
    id SERIAL PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    icon VARCHAR(50),
    color VARCHAR(50),
    display_order INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. 속성 정의 테이블
CREATE TABLE IF NOT EXISTS public.channel_attributes (
    id SERIAL PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    data_type VARCHAR(20) NOT NULL,
    is_required BOOLEAN DEFAULT false,
    default_value TEXT,
    validation_rules JSONB,
    display_order INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. 채널 유형별 속성 매핑 테이블
CREATE TABLE IF NOT EXISTS public.channel_type_attributes (
    id SERIAL PRIMARY KEY,
    channel_type_id INT REFERENCES public.channel_types(id) ON DELETE CASCADE,
    attribute_id INT REFERENCES public.channel_attributes(id) ON DELETE CASCADE,
    is_required BOOLEAN DEFAULT false,
    display_order INT DEFAULT 0,
    UNIQUE(channel_type_id, attribute_id)
);

-- 4. 채널 테이블 (동적 속성 지원)
CREATE TABLE IF NOT EXISTS public.channels_v2 (
    id SERIAL PRIMARY KEY,
    channel_type_id INT REFERENCES public.channel_types(id),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    attributes JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id)
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_channels_v2_type ON public.channels_v2(channel_type_id);
CREATE INDEX IF NOT EXISTS idx_channels_v2_attributes ON public.channels_v2 USING GIN(attributes);

-- RLS 정책
ALTER TABLE public.channel_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.channel_attributes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.channel_type_attributes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.channels_v2 ENABLE ROW LEVEL SECURITY;

-- 모든 사용자가 읽을 수 있음
CREATE POLICY "Public read channel_types" ON public.channel_types FOR SELECT USING (true);
CREATE POLICY "Public read channel_attributes" ON public.channel_attributes FOR SELECT USING (true);
CREATE POLICY "Public read channel_type_attributes" ON public.channel_type_attributes FOR SELECT USING (true);
CREATE POLICY "Public read channels_v2" ON public.channels_v2 FOR SELECT USING (true);

-- 인증된 사용자만 수정 가능
CREATE POLICY "Auth users manage channel_types" ON public.channel_types 
    FOR ALL USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Auth users manage channel_attributes" ON public.channel_attributes 
    FOR ALL USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Auth users manage channel_type_attributes" ON public.channel_type_attributes 
    FOR ALL USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Auth users manage channels_v2" ON public.channels_v2 
    FOR ALL USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

-- 뷰: 채널과 유형 정보를 조인
CREATE OR REPLACE VIEW channels_with_type_v2 AS
SELECT 
    c.*,
    ct.code as type_code,
    ct.name as type_name,
    ct.icon as type_icon,
    ct.color as type_color,
    (
        SELECT jsonb_agg(
            jsonb_build_object(
                'code', ca.code,
                'name', ca.name,
                'data_type', ca.data_type,
                'is_required', cta.is_required,
                'value', c.attributes->ca.code
            ) ORDER BY cta.display_order
        )
        FROM channel_type_attributes cta
        JOIN channel_attributes ca ON cta.attribute_id = ca.id
        WHERE cta.channel_type_id = ct.id
    ) as type_attributes
FROM channels_v2 c
LEFT JOIN channel_types ct ON c.channel_type_id = ct.id;