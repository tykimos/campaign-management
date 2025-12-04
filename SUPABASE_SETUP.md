# Supabase 데이터베이스 설정 가이드

## 1단계: Supabase 대시보드 접속
1. 다음 URL로 이동: https://supabase.com/dashboard/project/zaivjzyuxyajadfwfbkx/sql/new
2. Supabase 계정으로 로그인

## 2단계: SQL 실행
1. SQL Editor가 열리면 아래 SQL을 복사하여 붙여넣기
2. "Run" 버튼 클릭

```sql
-- =====================================================
-- Channel Management Tables
-- =====================================================

-- Channel Types Table
CREATE TABLE IF NOT EXISTS public.channel_types (
  id SERIAL PRIMARY KEY,
  code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  icon VARCHAR(10),
  color VARCHAR(20),
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.channel_types ENABLE ROW LEVEL SECURITY;

-- Channel Attributes Table
CREATE TABLE IF NOT EXISTS public.channel_attributes (
  id SERIAL PRIMARY KEY,
  code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  data_type VARCHAR(20) NOT NULL CHECK (data_type IN ('text', 'number', 'date', 'boolean', 'url', 'email')),
  is_required BOOLEAN DEFAULT FALSE,
  is_common BOOLEAN DEFAULT TRUE,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.channel_attributes ENABLE ROW LEVEL SECURITY;

-- Channel Type Attributes Junction Table
CREATE TABLE IF NOT EXISTS public.channel_type_attributes (
  id SERIAL PRIMARY KEY,
  channel_type_id INTEGER NOT NULL REFERENCES public.channel_types(id) ON DELETE CASCADE,
  attribute_id INTEGER NOT NULL REFERENCES public.channel_attributes(id) ON DELETE CASCADE,
  is_required BOOLEAN DEFAULT FALSE,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(channel_type_id, attribute_id)
);

ALTER TABLE public.channel_type_attributes ENABLE ROW LEVEL SECURITY;

-- Channels Table V2
CREATE TABLE IF NOT EXISTS public.channels_v2 (
  id SERIAL PRIMARY KEY,
  channel_type_id INTEGER NOT NULL REFERENCES public.channel_types(id),
  name VARCHAR(255) NOT NULL,
  url VARCHAR(500),
  member_count INTEGER,
  email VARCHAR(255),
  contact_person VARCHAR(100),
  contact_phone VARCHAR(50),
  main_phone VARCHAR(50),
  address TEXT,
  memo TEXT,
  registration_date DATE,
  update_date DATE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.channels_v2 ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Allow all for authenticated" ON public.channel_types FOR ALL USING (true);
CREATE POLICY "Allow all for authenticated" ON public.channel_attributes FOR ALL USING (true);
CREATE POLICY "Allow all for authenticated" ON public.channel_type_attributes FOR ALL USING (true);
CREATE POLICY "Allow all for authenticated" ON public.channels_v2 FOR ALL USING (true);

-- Create update trigger function if not exists
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers for updated_at
CREATE TRIGGER update_channel_types_updated_at BEFORE UPDATE ON public.channel_types
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_channel_attributes_updated_at BEFORE UPDATE ON public.channel_attributes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_channel_type_attributes_updated_at BEFORE UPDATE ON public.channel_type_attributes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_channels_v2_updated_at BEFORE UPDATE ON public.channels_v2
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

## 3단계: 기본 데이터 삽입
위 SQL이 성공적으로 실행되면, 다음 SQL을 실행하여 기본 데이터를 삽입:

```sql
-- Insert default channel types
INSERT INTO public.channel_types (code, name, description, color, display_order) VALUES
  ('platform_service', '플랫폼서비스', '온라인 플랫폼 및 서비스', 'blue', 1),
  ('government', '정부기관', '정부 및 공공기관', 'gray', 2),
  ('competition', '공모전', '공모전 및 대회', 'yellow', 3),
  ('portal_cafe', '포털카페', '네이버/다음 카페', 'amber', 4),
  ('sns_group', 'SNS그룹', '페이스북, 인스타그램 등', 'purple', 5),
  ('community', '커뮤니티', '온라인 커뮤니티', 'green', 6),
  ('open_chat', '오픈단톡방', '카카오톡 오픈채팅', 'pink', 7),
  ('discord', '디스코드', '디스코드 서버', 'indigo', 8),
  ('official_graduate', '공문-대학원', '대학원 공식 채널', 'blue', 9),
  ('official_university', '공문-대학교', '대학교 공식 채널', 'blue', 10),
  ('official_highschool', '공문-고등학교', '고등학교 공식 채널', 'blue', 11),
  ('dm_academic', 'DM-학회', '학회 DM 채널', 'red', 12),
  ('dm_association', 'DM-협회', '협회 DM 채널', 'red', 13),
  ('dm_university', 'DM-대학', '대학 DM 채널', 'red', 14),
  ('outdoor_university', '옥외광고-대학', '대학 옥외광고', 'teal', 15),
  ('outdoor_nst', '옥외광고-출연연NST', '출연연 옥외광고', 'teal', 16),
  ('outdoor_partner', '옥외광고-협력기관', '협력기관 옥외광고', 'teal', 17),
  ('performance', '퍼포먼스', '퍼포먼스 마케팅', 'cyan', 18),
  ('event_site', '이벤트사이트', '이벤트 사이트', 'amber', 19)
ON CONFLICT (code) DO NOTHING;

-- Insert default attributes
INSERT INTO public.channel_attributes (code, name, data_type, display_order) VALUES
  ('name', '이름', 'text', 1),
  ('registration_date', '등록일', 'date', 2),
  ('update_date', '갱신일', 'date', 3),
  ('memo', '메모', 'text', 4),
  ('member_count', '인원', 'number', 5),
  ('url', 'URL', 'url', 6),
  ('email', '이메일', 'email', 7),
  ('contact_person', '담당자', 'text', 8),
  ('contact_phone', '연락처', 'text', 9),
  ('main_phone', '대표전화', 'text', 10),
  ('address', '주소', 'text', 11),
  ('is_active', '비활성화', 'boolean', 12)
ON CONFLICT (code) DO NOTHING;

-- Set up default visible attributes for each channel type
INSERT INTO public.channel_type_attributes (channel_type_id, attribute_id, is_required, display_order)
SELECT 
  ct.id as channel_type_id,
  ca.id as attribute_id,
  CASE WHEN ca.code = 'name' THEN TRUE ELSE FALSE END as is_required,
  ca.display_order
FROM public.channel_types ct
CROSS JOIN public.channel_attributes ca
WHERE ca.code IN ('name', 'registration_date', 'update_date', 'memo')
ON CONFLICT (channel_type_id, attribute_id) DO NOTHING;
```

## 4단계: 확인
1. Table Editor로 이동
2. 다음 테이블들이 생성되었는지 확인:
   - channel_types (19개 레코드)
   - channel_attributes (12개 레코드)
   - channel_type_attributes (76개 레코드)
   - channels_v2 (비어있음)

## 5단계: 애플리케이션 테스트
1. 애플리케이션으로 돌아가서 새로고침
2. "채널유형 관리" 메뉴 클릭
3. 19개의 채널 유형이 표시되는지 확인
4. 각 유형의 속성 설정이 작동하는지 테스트

## 문제 해결
- 테이블이 이미 존재한다는 오류: 정상입니다. 계속 진행하세요.
- 권한 오류: Authentication > Policies에서 RLS 정책을 확인하세요.
- 데이터가 보이지 않음: 로그인 상태를 확인하세요.