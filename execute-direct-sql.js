import fetch from 'node-fetch';

const SUPABASE_URL = 'https://zaivjzyuxyajadfwfbkx.supabase.co';
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InphaXZqenl1eHlhamFkZndmYmt4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczMzMwNDMxOSwiZXhwIjoyMDQ4ODgwMzE5fQ.sb_secret_dCVqXqJdhqBENbi0emxrYw_kuSuoNWx';

async function executeSQL(sql) {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc`, {
    method: 'POST',
    headers: {
      'apikey': SERVICE_KEY,
      'Authorization': `Bearer ${SERVICE_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query_text: sql })
  });
  
  if (!response.ok) {
    const error = await response.text();
    console.error('SQL execution failed:', error);
    return false;
  }
  
  return true;
}

async function createTables() {
  console.log('Creating tables in Supabase...\n');
  
  // Split SQL into individual statements
  const sqlStatements = [
    // 1. Create channel_types table
    `CREATE TABLE IF NOT EXISTS channel_types (
      id SERIAL PRIMARY KEY,
      code VARCHAR(50) UNIQUE NOT NULL,
      name VARCHAR(100) NOT NULL,
      description TEXT,
      icon VARCHAR(10),
      color VARCHAR(20),
      display_order INTEGER NOT NULL DEFAULT 0,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );`,
    
    // 2. Create channel_attributes table
    `CREATE TABLE IF NOT EXISTS channel_attributes (
      id SERIAL PRIMARY KEY,
      code VARCHAR(50) UNIQUE NOT NULL,
      name VARCHAR(100) NOT NULL,
      data_type VARCHAR(20) NOT NULL CHECK (data_type IN ('text', 'number', 'date', 'boolean', 'url', 'email')),
      is_required BOOLEAN DEFAULT FALSE,
      is_common BOOLEAN DEFAULT TRUE,
      display_order INTEGER NOT NULL DEFAULT 0,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );`,
    
    // 3. Create channel_type_attributes table
    `CREATE TABLE IF NOT EXISTS channel_type_attributes (
      id SERIAL PRIMARY KEY,
      channel_type_id INTEGER NOT NULL REFERENCES channel_types(id) ON DELETE CASCADE,
      attribute_id INTEGER NOT NULL REFERENCES channel_attributes(id) ON DELETE CASCADE,
      is_required BOOLEAN DEFAULT FALSE,
      display_order INTEGER NOT NULL DEFAULT 0,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      UNIQUE(channel_type_id, attribute_id)
    );`,
    
    // 4. Create channels_v2 table
    `CREATE TABLE IF NOT EXISTS channels_v2 (
      id SERIAL PRIMARY KEY,
      channel_type_id INTEGER NOT NULL REFERENCES channel_types(id),
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
    );`,
    
    // 5. Enable RLS
    `ALTER TABLE channel_types ENABLE ROW LEVEL SECURITY;`,
    `ALTER TABLE channel_attributes ENABLE ROW LEVEL SECURITY;`,
    `ALTER TABLE channel_type_attributes ENABLE ROW LEVEL SECURITY;`,
    `ALTER TABLE channels_v2 ENABLE ROW LEVEL SECURITY;`,
    
    // 6. Create RLS policies
    `CREATE POLICY "Enable read for all users" ON channel_types FOR SELECT USING (true);`,
    `CREATE POLICY "Enable all for all users" ON channel_types FOR ALL USING (true);`,
    `CREATE POLICY "Enable read for all users" ON channel_attributes FOR SELECT USING (true);`,
    `CREATE POLICY "Enable all for all users" ON channel_attributes FOR ALL USING (true);`,
    `CREATE POLICY "Enable read for all users" ON channel_type_attributes FOR SELECT USING (true);`,
    `CREATE POLICY "Enable all for all users" ON channel_type_attributes FOR ALL USING (true);`,
    `CREATE POLICY "Enable read for all users" ON channels_v2 FOR SELECT USING (true);`,
    `CREATE POLICY "Enable all for all users" ON channels_v2 FOR ALL USING (true);`,
    
    // 7. Create update trigger function
    `CREATE OR REPLACE FUNCTION update_updated_at_column()
    RETURNS TRIGGER AS $$
    BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;`,
    
    // 8. Create triggers
    `CREATE TRIGGER update_channel_types_updated_at BEFORE UPDATE ON channel_types
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();`,
    `CREATE TRIGGER update_channel_attributes_updated_at BEFORE UPDATE ON channel_attributes
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();`,
    `CREATE TRIGGER update_channel_type_attributes_updated_at BEFORE UPDATE ON channel_type_attributes
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();`,
    `CREATE TRIGGER update_channels_v2_updated_at BEFORE UPDATE ON channels_v2
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();`,
    
    // 9. Insert channel types
    `INSERT INTO channel_types (code, name, description, color, display_order) VALUES
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
    ON CONFLICT (code) DO NOTHING;`,
    
    // 10. Insert attributes
    `INSERT INTO channel_attributes (code, name, data_type, display_order) VALUES
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
    ON CONFLICT (code) DO NOTHING;`,
    
    // 11. Set up default type-attribute relationships
    `INSERT INTO channel_type_attributes (channel_type_id, attribute_id, is_required, display_order)
    SELECT 
      ct.id as channel_type_id,
      ca.id as attribute_id,
      CASE WHEN ca.code = 'name' THEN TRUE ELSE FALSE END as is_required,
      ca.display_order
    FROM channel_types ct
    CROSS JOIN channel_attributes ca
    WHERE ca.code IN ('name', 'registration_date', 'update_date', 'memo')
    ON CONFLICT (channel_type_id, attribute_id) DO NOTHING;`
  ];
  
  // Execute each statement
  for (let i = 0; i < sqlStatements.length; i++) {
    const sql = sqlStatements[i];
    const description = sql.substring(0, 50).replace(/\n/g, ' ');
    console.log(`[${i+1}/${sqlStatements.length}] Executing: ${description}...`);
    
    const success = await executeSQL(sql);
    if (!success) {
      console.log(`   ❌ Failed`);
    } else {
      console.log(`   ✅ Success`);
    }
  }
  
  console.log('\n✨ Database setup complete!');
}

// Run the setup
createTables().catch(console.error);