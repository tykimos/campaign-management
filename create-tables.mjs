import pg from 'pg';
const { Client } = pg;

// PostgreSQL 직접 연결
const client = new Client({
  connectionString: 'postgresql://postgres.zaivjzyuxyajadfwfbkx:YHtSE5k7T8fL2dVa@aws-0-us-west-1.pooler.supabase.com:6543/postgres'
});

async function createTables() {
  try {
    await client.connect();
    console.log('데이터베이스에 연결되었습니다.\n');

    // 1. channel_types 테이블 생성
    console.log('1. channel_types 테이블 생성 중...');
    await client.query(`
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
      )
    `);
    console.log('   ✓ channel_types 테이블 생성 완료\n');

    // 2. channel_attributes 테이블 생성
    console.log('2. channel_attributes 테이블 생성 중...');
    await client.query(`
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
      )
    `);
    console.log('   ✓ channel_attributes 테이블 생성 완료\n');

    // 3. channel_type_attributes 테이블 생성
    console.log('3. channel_type_attributes 테이블 생성 중...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS public.channel_type_attributes (
        id SERIAL PRIMARY KEY,
        channel_type_id INTEGER NOT NULL REFERENCES public.channel_types(id) ON DELETE CASCADE,
        attribute_id INTEGER NOT NULL REFERENCES public.channel_attributes(id) ON DELETE CASCADE,
        is_required BOOLEAN DEFAULT FALSE,
        display_order INTEGER NOT NULL DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(channel_type_id, attribute_id)
      )
    `);
    console.log('   ✓ channel_type_attributes 테이블 생성 완료\n');

    // 4. channels_v2 테이블 생성
    console.log('4. channels_v2 테이블 생성 중...');
    await client.query(`
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
      )
    `);
    console.log('   ✓ channels_v2 테이블 생성 완료\n');

    // 5. RLS 활성화
    console.log('5. Row Level Security 활성화 중...');
    await client.query(`ALTER TABLE public.channel_types ENABLE ROW LEVEL SECURITY`);
    await client.query(`ALTER TABLE public.channel_attributes ENABLE ROW LEVEL SECURITY`);
    await client.query(`ALTER TABLE public.channel_type_attributes ENABLE ROW LEVEL SECURITY`);
    await client.query(`ALTER TABLE public.channels_v2 ENABLE ROW LEVEL SECURITY`);
    console.log('   ✓ RLS 활성화 완료\n');

    // 6. RLS 정책 생성
    console.log('6. RLS 정책 생성 중...');
    
    // 기존 정책 삭제 (있을 경우)
    await client.query(`DROP POLICY IF EXISTS "Allow all for authenticated" ON public.channel_types`);
    await client.query(`DROP POLICY IF EXISTS "Allow all for authenticated" ON public.channel_attributes`);
    await client.query(`DROP POLICY IF EXISTS "Allow all for authenticated" ON public.channel_type_attributes`);
    await client.query(`DROP POLICY IF EXISTS "Allow all for authenticated" ON public.channels_v2`);
    
    // 새 정책 생성
    await client.query(`CREATE POLICY "Allow all for authenticated" ON public.channel_types FOR ALL USING (true)`);
    await client.query(`CREATE POLICY "Allow all for authenticated" ON public.channel_attributes FOR ALL USING (true)`);
    await client.query(`CREATE POLICY "Allow all for authenticated" ON public.channel_type_attributes FOR ALL USING (true)`);
    await client.query(`CREATE POLICY "Allow all for authenticated" ON public.channels_v2 FOR ALL USING (true)`);
    console.log('   ✓ RLS 정책 생성 완료\n');

    // 7. 트리거 함수 생성
    console.log('7. 트리거 함수 생성 중...');
    await client.query(`
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
          NEW.updated_at = NOW();
          RETURN NEW;
      END;
      $$ LANGUAGE plpgsql
    `);
    console.log('   ✓ 트리거 함수 생성 완료\n');

    // 8. 트리거 생성
    console.log('8. 트리거 생성 중...');
    await client.query(`DROP TRIGGER IF EXISTS update_channel_types_updated_at ON public.channel_types`);
    await client.query(`CREATE TRIGGER update_channel_types_updated_at BEFORE UPDATE ON public.channel_types FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()`);
    
    await client.query(`DROP TRIGGER IF EXISTS update_channel_attributes_updated_at ON public.channel_attributes`);
    await client.query(`CREATE TRIGGER update_channel_attributes_updated_at BEFORE UPDATE ON public.channel_attributes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()`);
    
    await client.query(`DROP TRIGGER IF EXISTS update_channel_type_attributes_updated_at ON public.channel_type_attributes`);
    await client.query(`CREATE TRIGGER update_channel_type_attributes_updated_at BEFORE UPDATE ON public.channel_type_attributes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()`);
    
    await client.query(`DROP TRIGGER IF EXISTS update_channels_v2_updated_at ON public.channels_v2`);
    await client.query(`CREATE TRIGGER update_channels_v2_updated_at BEFORE UPDATE ON public.channels_v2 FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()`);
    console.log('   ✓ 트리거 생성 완료\n');

    // 9. 기본 채널 유형 삽입
    console.log('9. 기본 채널 유형 데이터 삽입 중...');
    await client.query(`
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
      ON CONFLICT (code) DO NOTHING
    `);
    console.log('   ✓ 19개 채널 유형 삽입 완료\n');

    // 10. 기본 속성 삽입
    console.log('10. 기본 속성 데이터 삽입 중...');
    await client.query(`
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
      ON CONFLICT (code) DO NOTHING
    `);
    console.log('   ✓ 12개 속성 삽입 완료\n');

    // 11. 기본 속성 연결
    console.log('11. 기본 속성 연결 중...');
    await client.query(`
      INSERT INTO public.channel_type_attributes (channel_type_id, attribute_id, is_required, display_order)
      SELECT 
        ct.id as channel_type_id,
        ca.id as attribute_id,
        CASE WHEN ca.code = 'name' THEN TRUE ELSE FALSE END as is_required,
        ca.display_order
      FROM public.channel_types ct
      CROSS JOIN public.channel_attributes ca
      WHERE ca.code IN ('name', 'registration_date', 'update_date', 'memo')
      ON CONFLICT (channel_type_id, attribute_id) DO NOTHING
    `);
    console.log('   ✓ 기본 속성 연결 완료\n');

    // 결과 확인
    const typeCount = await client.query('SELECT COUNT(*) FROM public.channel_types');
    const attrCount = await client.query('SELECT COUNT(*) FROM public.channel_attributes');
    const linkCount = await client.query('SELECT COUNT(*) FROM public.channel_type_attributes');

    console.log('========================================');
    console.log('✅ 데이터베이스 설정 완료!');
    console.log('========================================');
    console.log(`  - 채널 유형: ${typeCount.rows[0].count}개`);
    console.log(`  - 속성: ${attrCount.rows[0].count}개`);
    console.log(`  - 유형-속성 연결: ${linkCount.rows[0].count}개`);
    console.log('========================================\n');

  } catch (error) {
    console.error('오류 발생:', error);
  } finally {
    await client.end();
  }
}

createTables();