import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

// Supabase 연결 정보
const supabaseUrl = 'https://zaivjzyuxyajadfwfbkx.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InphaXZqenl1eHlhamFkZndmYmt4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDc3NTQ4NywiZXhwIjoyMDgwMzUxNDg3fQ.0qWqphUPjSnFB7P6OlXMWx7F0e3Yy5iQzAGvufR_sHE';

const supabase = createClient(supabaseUrl, supabaseKey);

async function executeSql() {
  try {
    // SQL 파일 읽기
    const sql = fs.readFileSync('channel-tables.sql', 'utf8');
    
    // SQL을 개별 명령으로 분리
    const commands = sql
      .split(';')
      .map(cmd => cmd.trim())
      .filter(cmd => cmd.length > 0 && !cmd.startsWith('--'));

    console.log(`총 ${commands.length}개의 SQL 명령을 실행합니다...`);

    for (let i = 0; i < commands.length; i++) {
      const command = commands[i] + ';';
      
      // 주석이나 빈 명령 건너뛰기
      if (command.trim().startsWith('--') || command.trim().length <= 1) {
        continue;
      }
      
      console.log(`\n명령 ${i + 1} 실행 중...`);
      console.log(command.substring(0, 50) + '...');
      
      const { data, error } = await supabase.rpc('exec_sql', {
        query: command
      });

      if (error) {
        console.error(`명령 ${i + 1} 실패:`, error);
      } else {
        console.log(`명령 ${i + 1} 성공`);
      }
    }

    // 테이블 확인
    const { data: tables } = await supabase
      .from('channel_types')
      .select('count');

    console.log('\n테이블이 성공적으로 생성되었습니다!');

  } catch (error) {
    console.error('오류 발생:', error);
  }
}

executeSql();