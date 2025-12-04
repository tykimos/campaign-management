import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://zaivjzyuxyajadfwfbkx.supabase.co';
const supabaseServiceKey = 'sb_secret_dCVqXqJdhqBENbi0emxrYw_kuSuoNWx';

// Create Supabase client with service role key
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function createTables() {
  try {
    console.log('Creating tables with Service Role Key...');
    
    // SQL statements split into individual operations
    const sqlStatements = [
      // Create channel_types table
      `CREATE TABLE IF NOT EXISTS public.channel_types (
        id SERIAL PRIMARY KEY,
        code VARCHAR(50) UNIQUE NOT NULL,
        name VARCHAR(100) NOT NULL,
        description TEXT,
        icon VARCHAR(10),
        color VARCHAR(20),
        display_order INTEGER NOT NULL DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )`,
      
      // Create channel_attributes table
      `CREATE TABLE IF NOT EXISTS public.channel_attributes (
        id SERIAL PRIMARY KEY,
        code VARCHAR(50) UNIQUE NOT NULL,
        name VARCHAR(100) NOT NULL,
        data_type VARCHAR(20) NOT NULL CHECK (data_type IN ('text', 'number', 'date', 'boolean', 'url', 'email')),
        is_required BOOLEAN DEFAULT FALSE,
        is_common BOOLEAN DEFAULT TRUE,
        display_order INTEGER NOT NULL DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )`,
      
      // Create channel_type_attributes junction table
      `CREATE TABLE IF NOT EXISTS public.channel_type_attributes (
        id SERIAL PRIMARY KEY,
        channel_type_id INTEGER NOT NULL REFERENCES public.channel_types(id) ON DELETE CASCADE,
        attribute_id INTEGER NOT NULL REFERENCES public.channel_attributes(id) ON DELETE CASCADE,
        is_required BOOLEAN DEFAULT FALSE,
        display_order INTEGER NOT NULL DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(channel_type_id, attribute_id)
      )`,
      
      // Create channels_v2 table
      `CREATE TABLE IF NOT EXISTS public.channels_v2 (
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
      )`
    ];

    // Execute each SQL statement using fetch with service role key
    for (const sql of sqlStatements) {
      const response = await fetch(`${supabaseUrl}/rest/v1/rpc`, {
        method: 'POST',
        headers: {
          'apikey': supabaseServiceKey,
          'Authorization': `Bearer ${supabaseServiceKey}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        },
        body: JSON.stringify({
          query: sql
        })
      });
      
      if (!response.ok) {
        console.log(`Failed to execute: ${sql.substring(0, 50)}...`);
        console.log('Response status:', response.status);
        const text = await response.text();
        console.log('Response:', text);
      } else {
        console.log(`✓ Executed: ${sql.substring(0, 50)}...`);
      }
    }

    // Try alternative approach - directly insert data
    console.log('\nInserting default data...');
    
    // Insert channel types
    const channelTypes = [
      { code: 'platform_service', name: '플랫폼서비스', description: '온라인 플랫폼 및 서비스', color: 'blue', display_order: 1 },
      { code: 'government', name: '정부기관', description: '정부 및 공공기관', color: 'gray', display_order: 2 },
      { code: 'competition', name: '공모전', description: '공모전 및 대회', color: 'yellow', display_order: 3 },
      { code: 'portal_cafe', name: '포털카페', description: '네이버/다음 카페', color: 'amber', display_order: 4 },
      { code: 'sns_group', name: 'SNS그룹', description: '페이스북, 인스타그램 등', color: 'purple', display_order: 5 },
      { code: 'community', name: '커뮤니티', description: '온라인 커뮤니티', color: 'green', display_order: 6 },
      { code: 'open_chat', name: '오픈단톡방', description: '카카오톡 오픈채팅', color: 'pink', display_order: 7 },
      { code: 'discord', name: '디스코드', description: '디스코드 서버', color: 'indigo', display_order: 8 },
      { code: 'official_graduate', name: '공문-대학원', description: '대학원 공식 채널', color: 'blue', display_order: 9 },
      { code: 'official_university', name: '공문-대학교', description: '대학교 공식 채널', color: 'blue', display_order: 10 },
      { code: 'official_highschool', name: '공문-고등학교', description: '고등학교 공식 채널', color: 'blue', display_order: 11 },
      { code: 'dm_academic', name: 'DM-학회', description: '학회 DM 채널', color: 'red', display_order: 12 },
      { code: 'dm_association', name: 'DM-협회', description: '협회 DM 채널', color: 'red', display_order: 13 },
      { code: 'dm_university', name: 'DM-대학', description: '대학 DM 채널', color: 'red', display_order: 14 },
      { code: 'outdoor_university', name: '옥외광고-대학', description: '대학 옥외광고', color: 'teal', display_order: 15 },
      { code: 'outdoor_nst', name: '옥외광고-출연연NST', description: '출연연 옥외광고', color: 'teal', display_order: 16 },
      { code: 'outdoor_partner', name: '옥외광고-협력기관', description: '협력기관 옥외광고', color: 'teal', display_order: 17 },
      { code: 'performance', name: '퍼포먼스', description: '퍼포먼스 마케팅', color: 'cyan', display_order: 18 },
      { code: 'event_site', name: '이벤트사이트', description: '이벤트 사이트', color: 'amber', display_order: 19 }
    ];

    const { data: typesData, error: typesError } = await supabase
      .from('channel_types')
      .upsert(channelTypes, { onConflict: 'code' })
      .select();

    if (typesError) {
      console.error('Error inserting channel types:', typesError);
    } else {
      console.log('✓ Inserted channel types:', typesData?.length || 0);
    }

    // Insert attributes
    const attributes = [
      { code: 'name', name: '이름', data_type: 'text', display_order: 1 },
      { code: 'registration_date', name: '등록일', data_type: 'date', display_order: 2 },
      { code: 'update_date', name: '갱신일', data_type: 'date', display_order: 3 },
      { code: 'memo', name: '메모', data_type: 'text', display_order: 4 },
      { code: 'member_count', name: '인원', data_type: 'number', display_order: 5 },
      { code: 'url', name: 'URL', data_type: 'url', display_order: 6 },
      { code: 'email', name: '이메일', data_type: 'email', display_order: 7 },
      { code: 'contact_person', name: '담당자', data_type: 'text', display_order: 8 },
      { code: 'contact_phone', name: '연락처', data_type: 'text', display_order: 9 },
      { code: 'main_phone', name: '대표전화', data_type: 'text', display_order: 10 },
      { code: 'address', name: '주소', data_type: 'text', display_order: 11 },
      { code: 'is_active', name: '비활성화', data_type: 'boolean', display_order: 12 }
    ];

    const { data: attrsData, error: attrsError } = await supabase
      .from('channel_attributes')
      .upsert(attributes, { onConflict: 'code' })
      .select();

    if (attrsError) {
      console.error('Error inserting attributes:', attrsError);
    } else {
      console.log('✓ Inserted attributes:', attrsData?.length || 0);
    }

    // Set up default type-attribute relationships
    const { data: types } = await supabase.from('channel_types').select('id');
    const { data: attrs } = await supabase.from('channel_attributes').select('id, code, display_order');
    
    if (types && attrs) {
      const defaultAttrCodes = ['name', 'registration_date', 'update_date', 'memo'];
      const typeAttributes = [];
      
      for (const type of types) {
        for (const attr of attrs.filter(a => defaultAttrCodes.includes(a.code))) {
          typeAttributes.push({
            channel_type_id: type.id,
            attribute_id: attr.id,
            is_required: attr.code === 'name',
            display_order: attr.display_order
          });
        }
      }
      
      const { error: relError } = await supabase
        .from('channel_type_attributes')
        .upsert(typeAttributes, { onConflict: 'channel_type_id,attribute_id' });
        
      if (relError) {
        console.error('Error creating type-attribute relationships:', relError);
      } else {
        console.log('✓ Created type-attribute relationships');
      }
    }

    // Verify tables
    console.log('\nVerifying tables...');
    
    const { count: typesCount } = await supabase
      .from('channel_types')
      .select('*', { count: 'exact', head: true });
    
    const { count: attrsCount } = await supabase
      .from('channel_attributes')
      .select('*', { count: 'exact', head: true });
    
    const { count: typeAttrsCount } = await supabase
      .from('channel_type_attributes')
      .select('*', { count: 'exact', head: true });

    console.log('\n✅ Setup completed:');
    console.log(`- channel_types: ${typesCount || 0} records`);
    console.log(`- channel_attributes: ${attrsCount || 0} records`);
    console.log(`- channel_type_attributes: ${typeAttrsCount || 0} records`);
    
  } catch (error) {
    console.error('Error:', error);
  }
}

createTables();