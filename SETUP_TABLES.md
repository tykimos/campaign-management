# Supabase 테이블 설정 가이드

## 1단계: Supabase Dashboard 접속
1. https://supabase.com/dashboard/project/zaivjzyuxyajadfwfbkx 접속
2. 로그인

## 2단계: SQL Editor 실행
1. 왼쪽 메뉴에서 "SQL Editor" 클릭
2. "New Query" 버튼 클릭

## 3단계: SQL 실행
1. `channel-tables.sql` 파일의 전체 내용을 복사
2. SQL Editor에 붙여넣기
3. "Run" 버튼 클릭

## 4단계: 테이블 확인
1. 왼쪽 메뉴에서 "Table Editor" 클릭
2. 다음 테이블들이 생성되었는지 확인:
   - channel_types
   - channel_attributes
   - channel_type_attributes
   - channels_v2

## 테이블이 생성되면:
- 앱을 새로고침하면 에러 없이 정상 작동합니다
- 채널 타입과 속성이 정상적으로 표시됩니다