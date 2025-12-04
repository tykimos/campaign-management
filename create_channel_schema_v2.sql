-- 채널 유형별 동적 속성을 위한 데이터베이스 스키마 설계

-- 1. 채널 유형 테이블 (이미 정의된 유형들)
CREATE TABLE IF NOT EXISTS public.channel_types (
    id SERIAL PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL, -- platform_service, government, etc.
    name VARCHAR(100) NOT NULL, -- 플랫폼서비스, 정부기관, etc.
    description TEXT,
    icon VARCHAR(50),
    color VARCHAR(50),
    display_order INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. 속성 정의 테이블 (어떤 속성들이 있는지)
CREATE TABLE IF NOT EXISTS public.channel_attributes (
    id SERIAL PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL, -- url, member_count, email, etc.
    name VARCHAR(100) NOT NULL, -- URL, 회원수, 이메일, etc.
    data_type VARCHAR(20) NOT NULL, -- text, number, date, boolean, url, email
    is_required BOOLEAN DEFAULT false,
    default_value TEXT,
    validation_rules JSONB, -- {"min": 0, "max": 1000000, "pattern": "^https://"}
    display_order INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. 채널 유형별 속성 매핑 테이블 (어떤 유형이 어떤 속성을 가지는지)
CREATE TABLE IF NOT EXISTS public.channel_type_attributes (
    id SERIAL PRIMARY KEY,
    channel_type_id INT REFERENCES public.channel_types(id) ON DELETE CASCADE,
    attribute_id INT REFERENCES public.channel_attributes(id) ON DELETE CASCADE,
    is_required BOOLEAN DEFAULT false,
    display_order INT DEFAULT 0,
    UNIQUE(channel_type_id, attribute_id)
);

-- 4. 채널 테이블 (기본 정보 + JSONB로 동적 속성 저장)
CREATE TABLE IF NOT EXISTS public.channels_v2 (
    id SERIAL PRIMARY KEY,
    channel_type_id INT REFERENCES public.channel_types(id),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    attributes JSONB DEFAULT '{}', -- 동적 속성들을 JSON으로 저장
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    
    -- 인덱스
    INDEX idx_channel_type (channel_type_id),
    INDEX idx_attributes_gin (attributes)
);

-- 5. 채널 속성 값 테이블 (정규화된 방식 - 선택적)
CREATE TABLE IF NOT EXISTS public.channel_attribute_values (
    id SERIAL PRIMARY KEY,
    channel_id INT REFERENCES public.channels_v2(id) ON DELETE CASCADE,
    attribute_id INT REFERENCES public.channel_attributes(id),
    value_text TEXT,
    value_number NUMERIC,
    value_date DATE,
    value_boolean BOOLEAN,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(channel_id, attribute_id)
);

-- 샘플 데이터: 채널 유형 삽입
INSERT INTO public.channel_types (code, name, description, icon, color, display_order) VALUES
('platform_service', '플랫폼서비스', '온라인 플랫폼 및 서비스', '🌐', 'blue', 1),
('government', '정부기관', '정부 및 공공기관', '🏛️', 'gray', 2),
('competition', '공모전', '공모전 및 대회', '🏆', 'yellow', 3),
('portal_cafe', '포털카페', '네이버/다음 카페', '☕', 'amber', 4),
('sns_group', 'SNS그룹', '페이스북, 인스타그램 등', '📱', 'purple', 5),
('community', '커뮤니티', '온라인 커뮤니티', '👥', 'green', 6),
('blog', '블로그', '블로그 채널', '📝', 'orange', 7),
('open_chat', '오픈단톡방', '카카오톡 오픈채팅', '💬', 'pink', 8),
('discord', '디스코드', '디스코드 서버', '🎮', 'indigo', 9),
('university', '대학교공문', '대학교 공식 채널', '🎓', 'blue', 10),
('graduate', '대학원공문', '대학원 공식 채널', '🎓', 'blue', 11),
('highschool', '고등학교공문', '고등학교 공식 채널', '🏫', 'blue', 12),
('institution', '기관공문', '기관 공식 채널', '🏢', 'gray', 13),
('dm_academic', 'DM-학회', '학회 DM 채널', '📧', 'red', 14),
('dm_association', 'DM-협회', '협회 DM 채널', '📧', 'red', 15),
('dm_university', 'DM-대학', '대학 DM 채널', '📧', 'red', 16),
('outdoor_university', '옥외광고-대학', '대학 옥외광고', '🎯', 'teal', 17),
('outdoor_nst', '옥외광고-출연연NST', '출연연 옥외광고', '🎯', 'teal', 18),
('outdoor_partner', '옥외광고-협력기관', '협력기관 옥외광고', '🎯', 'teal', 19),
('performance', '퍼포먼스', '퍼포먼스 마케팅', '📊', 'cyan', 20),
('event_site', '이벤트사이트', '이벤트 사이트', '🎪', 'amber', 21)
ON CONFLICT (code) DO UPDATE 
SET name = EXCLUDED.name,
    description = EXCLUDED.description,
    icon = EXCLUDED.icon,
    color = EXCLUDED.color,
    display_order = EXCLUDED.display_order,
    updated_at = NOW();

-- 샘플 데이터: 속성 정의
INSERT INTO public.channel_attributes (code, name, data_type, display_order) VALUES
('url', 'URL', 'url', 1),
('member_count', '회원수', 'number', 2),
('view_count', '조회수', 'number', 3),
('avg_daily_views', '일평균 조회수', 'number', 4),
('posted_date', '게재일', 'date', 5),
('registered_date', '등록일', 'date', 6),
('deleted_date', '삭제일', 'date', 7),
('email', '이메일', 'email', 8),
('phone', '전화번호', 'text', 9),
('homepage_url', '홈페이지', 'url', 10),
('contact_person', '담당자', 'text', 11),
('contact_phone', '담당자 연락처', 'text', 12),
('pr_contact', '홍보 담당', 'text', 13),
('region', '지역', 'text', 14),
('campus_type', '본분교', 'text', 15),
('academic_system', '학제', 'text', 16),
('establishment_type', '설립구분', 'text', 17),
('address', '주소', 'text', 18),
('postal_code', '우편번호', 'text', 19),
('organization_size', '기관 규모', 'text', 20),
('memo', '메모', 'text', 21),
('status', '상태', 'text', 22),
('verification_status', '검증 상태', 'text', 23),
('last_post_date', '최근 게재일', 'date', 24),
('response_rate', '응답률', 'number', 25)
ON CONFLICT (code) DO UPDATE 
SET name = EXCLUDED.name,
    data_type = EXCLUDED.data_type,
    display_order = EXCLUDED.display_order;

-- 채널 유형별 속성 매핑 예시
-- 플랫폼서비스: URL, 회원수, 조회수
INSERT INTO public.channel_type_attributes (channel_type_id, attribute_id, is_required, display_order)
SELECT ct.id, ca.id, true, 1
FROM public.channel_types ct, public.channel_attributes ca
WHERE ct.code = 'platform_service' AND ca.code = 'url';

INSERT INTO public.channel_type_attributes (channel_type_id, attribute_id, is_required, display_order)
SELECT ct.id, ca.id, false, 2
FROM public.channel_types ct, public.channel_attributes ca
WHERE ct.code = 'platform_service' AND ca.code = 'member_count';

-- DM-학회: 이메일, 홈페이지, 담당자
INSERT INTO public.channel_type_attributes (channel_type_id, attribute_id, is_required, display_order)
SELECT ct.id, ca.id, true, 1
FROM public.channel_types ct, public.channel_attributes ca
WHERE ct.code = 'dm_academic' AND ca.code = 'email';

INSERT INTO public.channel_type_attributes (channel_type_id, attribute_id, is_required, display_order)
SELECT ct.id, ca.id, false, 2
FROM public.channel_types ct, public.channel_attributes ca
WHERE ct.code = 'dm_academic' AND ca.code = 'homepage_url';

-- 옥외광고-대학: 지역, 본분교, 학제, 주소
INSERT INTO public.channel_type_attributes (channel_type_id, attribute_id, is_required, display_order)
SELECT ct.id, ca.id, false, 1
FROM public.channel_types ct, public.channel_attributes ca
WHERE ct.code = 'outdoor_university' AND ca.code = 'region';

INSERT INTO public.channel_type_attributes (channel_type_id, attribute_id, is_required, display_order)
SELECT ct.id, ca.id, false, 2
FROM public.channel_types ct, public.channel_attributes ca
WHERE ct.code = 'outdoor_university' AND ca.code = 'campus_type';

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

-- 관리자만 수정 가능 (임시로 모든 사용자 허용)
CREATE POLICY "Public manage channel_types" ON public.channel_types FOR ALL USING (true);
CREATE POLICY "Public manage channel_attributes" ON public.channel_attributes FOR ALL USING (true);
CREATE POLICY "Public manage channel_type_attributes" ON public.channel_type_attributes FOR ALL USING (true);
CREATE POLICY "Public manage channels_v2" ON public.channels_v2 FOR ALL USING (true);

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