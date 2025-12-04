-- Insert campaign for NIA 딥페이크 경진대회
INSERT INTO campaigns (
  name,
  description,
  status,
  start_date,
  end_date,
  target_views,
  target_registrations,
  budget,
  created_by
)
VALUES (
  '2025 NIA 딥페이크 범죄 대응을 위한 AI 탐지 모델 경진대회',
  'NIA 주최 딥페이크 탐지 AI 모델 개발 경진대회 홍보 캠페인',
  'active',
  '2024-11-01',
  '2025-01-31',
  500000,
  1000,
  0,
  (SELECT id FROM users WHERE role = 'admin' LIMIT 1)
)
RETURNING id;

-- Store the campaign ID (you'll need to replace {{CAMPAIGN_ID}} with the actual ID from above)
-- For now, we'll use a subquery to get it

-- Insert channels if they don't exist
-- AIF플랫폼 channels
INSERT INTO campaign_channels (name, category, url, is_active, posting_fee, description, created_by)
SELECT * FROM (VALUES
  ('AIF 공식', 'AIF플랫폼', 'https://aif.or.kr', true, 0, 'AIF 공식 플랫폼', (SELECT id FROM users WHERE role = 'admin' LIMIT 1)),
  ('데이콘', 'AIF플랫폼', 'https://dacon.io', true, 0, '데이콘 AI 경진대회 플랫폼', (SELECT id FROM users WHERE role = 'admin' LIMIT 1)),
  ('캐글', 'AIF플랫폼', 'https://kaggle.com', true, 0, 'Kaggle 국제 AI 경진대회 플랫폼', (SELECT id FROM users WHERE role = 'admin' LIMIT 1))
) AS t(name, category, url, is_active, posting_fee, description, created_by)
WHERE NOT EXISTS (SELECT 1 FROM campaign_channels WHERE name = t.name);

-- 정부기관 channels
INSERT INTO campaign_channels (name, category, url, is_active, posting_fee, description, created_by)
SELECT * FROM (VALUES
  ('NIA 공식', '정부기관', 'https://www.nia.or.kr', true, 0, '한국지능정보사회진흥원', (SELECT id FROM users WHERE role = 'admin' LIMIT 1)),
  ('과기정통부', '정부기관', 'https://www.msit.go.kr', true, 0, '과학기술정보통신부', (SELECT id FROM users WHERE role = 'admin' LIMIT 1))
) AS t(name, category, url, is_active, posting_fee, description, created_by)
WHERE NOT EXISTS (SELECT 1 FROM campaign_channels WHERE name = t.name);

-- 공모전 channels
INSERT INTO campaign_channels (name, category, url, is_active, posting_fee, description, created_by)
SELECT * FROM (VALUES
  ('씽굿', '공모전', 'https://www.thinkcontest.com', true, 0, '씽굿 공모전 포털', (SELECT id FROM users WHERE role = 'admin' LIMIT 1)),
  ('위비티', '공모전', 'https://www.wevity.com', true, 0, '위비티 공모전 플랫폼', (SELECT id FROM users WHERE role = 'admin' LIMIT 1)),
  ('공모전닷컴', '공모전', 'https://www.contest.or.kr', true, 0, '공모전 종합 포털', (SELECT id FROM users WHERE role = 'admin' LIMIT 1))
) AS t(name, category, url, is_active, posting_fee, description, created_by)
WHERE NOT EXISTS (SELECT 1 FROM campaign_channels WHERE name = t.name);

-- 포털카페 channels
INSERT INTO campaign_channels (name, category, url, is_active, posting_fee, description, created_by)
SELECT * FROM (VALUES
  ('네이버 AI 카페', '포털카페', 'https://cafe.naver.com', true, 0, '네이버 AI 관련 카페', (SELECT id FROM users WHERE role = 'admin' LIMIT 1)),
  ('다음 머신러닝 카페', '포털카페', 'https://cafe.daum.net', true, 0, '다음 머신러닝 카페', (SELECT id FROM users WHERE role = 'admin' LIMIT 1))
) AS t(name, category, url, is_active, posting_fee, description, created_by)
WHERE NOT EXISTS (SELECT 1 FROM campaign_channels WHERE name = t.name);

-- SNS그룹 channels
INSERT INTO campaign_channels (name, category, url, is_active, posting_fee, description, created_by)
SELECT * FROM (VALUES
  ('페이스북 AI 그룹', 'SNS그룹', 'https://facebook.com/groups', true, 0, '페이스북 AI 커뮤니티', (SELECT id FROM users WHERE role = 'admin' LIMIT 1)),
  ('링크드인 AI 그룹', 'SNS그룹', 'https://linkedin.com', true, 0, '링크드인 AI 전문가 그룹', (SELECT id FROM users WHERE role = 'admin' LIMIT 1))
) AS t(name, category, url, is_active, posting_fee, description, created_by)
WHERE NOT EXISTS (SELECT 1 FROM campaign_channels WHERE name = t.name);

-- 커뮤니티 channels
INSERT INTO campaign_channels (name, category, url, is_active, posting_fee, description, created_by)
SELECT * FROM (VALUES
  ('OKKY', '커뮤니티', 'https://okky.kr', true, 0, 'OKKY 개발자 커뮤니티', (SELECT id FROM users WHERE role = 'admin' LIMIT 1)),
  ('클리앙', '커뮤니티', 'https://www.clien.net', true, 0, '클리앙 IT 커뮤니티', (SELECT id FROM users WHERE role = 'admin' LIMIT 1))
) AS t(name, category, url, is_active, posting_fee, description, created_by)
WHERE NOT EXISTS (SELECT 1 FROM campaign_channels WHERE name = t.name);

-- 오픈단톡방 channels
INSERT INTO campaign_channels (name, category, url, is_active, posting_fee, description, created_by)
SELECT * FROM (VALUES
  ('AI 연구 오픈채팅', '오픈단톡방', 'https://open.kakao.com', true, 0, '카카오톡 AI 연구 오픈채팅방', (SELECT id FROM users WHERE role = 'admin' LIMIT 1)),
  ('딥러닝 스터디', '오픈단톡방', 'https://open.kakao.com', true, 0, '카카오톡 딥러닝 스터디 방', (SELECT id FROM users WHERE role = 'admin' LIMIT 1))
) AS t(name, category, url, is_active, posting_fee, description, created_by)
WHERE NOT EXISTS (SELECT 1 FROM campaign_channels WHERE name = t.name);

-- 디스코드 channels
INSERT INTO campaign_channels (name, category, url, is_active, posting_fee, description, created_by)
SELECT * FROM (VALUES
  ('AI Korea Discord', '디스코드', 'https://discord.gg', true, 0, '한국 AI 디스코드 서버', (SELECT id FROM users WHERE role = 'admin' LIMIT 1))
) AS t(name, category, url, is_active, posting_fee, description, created_by)
WHERE NOT EXISTS (SELECT 1 FROM campaign_channels WHERE name = t.name);

-- 대학원공문/대학교공문 channels
INSERT INTO campaign_channels (name, category, url, is_active, posting_fee, description, created_by)
SELECT * FROM (VALUES
  ('서울대 AI대학원', '대학원공문', 'https://snu.ac.kr', true, 0, '서울대학교 AI대학원', (SELECT id FROM users WHERE role = 'admin' LIMIT 1)),
  ('KAIST AI대학원', '대학원공문', 'https://kaist.ac.kr', true, 0, 'KAIST AI대학원', (SELECT id FROM users WHERE role = 'admin' LIMIT 1)),
  ('연세대 컴퓨터과학과', '대학교공문', 'https://yonsei.ac.kr', true, 0, '연세대학교 컴퓨터과학과', (SELECT id FROM users WHERE role = 'admin' LIMIT 1)),
  ('고려대 AI학과', '대학교공문', 'https://korea.ac.kr', true, 0, '고려대학교 AI학과', (SELECT id FROM users WHERE role = 'admin' LIMIT 1))
) AS t(name, category, url, is_active, posting_fee, description, created_by)
WHERE NOT EXISTS (SELECT 1 FROM campaign_channels WHERE name = t.name);

-- DM channels
INSERT INTO campaign_channels (name, category, url, is_active, posting_fee, description, created_by)
SELECT * FROM (VALUES
  ('이메일 DM', 'DM', 'mailto:', true, 0, '이메일 다이렉트 메시지', (SELECT id FROM users WHERE role = 'admin' LIMIT 1)),
  ('카카오톡 DM', 'DM', 'https://kakao.com', true, 0, '카카오톡 다이렉트 메시지', (SELECT id FROM users WHERE role = 'admin' LIMIT 1))
) AS t(name, category, url, is_active, posting_fee, description, created_by)
WHERE NOT EXISTS (SELECT 1 FROM campaign_channels WHERE name = t.name);

-- Other channels
INSERT INTO campaign_channels (name, category, url, is_active, posting_fee, description, created_by)
SELECT * FROM (VALUES
  ('육아맘고', '기타', '#', true, 0, '육아맘 커뮤니티', (SELECT id FROM users WHERE role = 'admin' LIMIT 1)),
  ('퍼포먼스', '기타', '#', true, 0, '퍼포먼스 마케팅', (SELECT id FROM users WHERE role = 'admin' LIMIT 1)),
  ('이벤트', '기타', '#', true, 0, '이벤트 프로모션', (SELECT id FROM users WHERE role = 'admin' LIMIT 1))
) AS t(name, category, url, is_active, posting_fee, description, created_by)
WHERE NOT EXISTS (SELECT 1 FROM campaign_channels WHERE name = t.name);

-- Now insert campaign posts with performance data
-- We'll insert posts for channels based on the Excel data
-- Using a CTE to get the campaign ID
WITH campaign AS (
  SELECT id FROM campaigns 
  WHERE name = '2025 NIA 딥페이크 범죄 대응을 위한 AI 탐지 모델 경진대회'
  LIMIT 1
)
-- Insert posts for AIF플랫폼 (8 게재 out of 12 등록, 129602 조회수)
INSERT INTO campaign_posts (
  campaign_id, 
  channel_id, 
  post_url, 
  title,
  posted_date, 
  view_count, 
  click_count, 
  registration_count, 
  status, 
  posted_by
)
SELECT 
  (SELECT id FROM campaign),
  ch.id,
  'https://example.com/post/' || ch.id,
  '딥페이크 AI 탐지 모델 경진대회 참가 안내',
  '2024-11-15',
  CASE 
    WHEN ch.name = 'AIF 공식' THEN 50000
    WHEN ch.name = '데이콘' THEN 45000
    WHEN ch.name = '캐글' THEN 34602
    ELSE 10000
  END,
  CASE 
    WHEN ch.name = 'AIF 공식' THEN 2500
    WHEN ch.name = '데이콘' THEN 2000
    WHEN ch.name = '캐글' THEN 1500
    ELSE 500
  END,
  CASE 
    WHEN ch.name = 'AIF 공식' THEN 150
    WHEN ch.name = '데이콘' THEN 120
    WHEN ch.name = '캐글' THEN 80
    ELSE 30
  END,
  'posted',
  (SELECT id FROM users WHERE role = 'admin' LIMIT 1)
FROM campaign_channels ch
WHERE ch.category = 'AIF플랫폼'
LIMIT 3;

-- Insert posts for 정부기관 (1 게재 out of 3 등록, 148 조회수)
INSERT INTO campaign_posts (
  campaign_id, 
  channel_id, 
  post_url, 
  title,
  posted_date, 
  view_count, 
  click_count, 
  registration_count, 
  status, 
  posted_by
)
SELECT 
  (SELECT id FROM campaign),
  ch.id,
  'https://example.com/post/' || ch.id,
  'NIA 딥페이크 탐지 경진대회 공고',
  '2024-11-10',
  148,
  15,
  5,
  'posted',
  (SELECT id FROM users WHERE role = 'admin' LIMIT 1)
FROM campaign_channels ch
WHERE ch.name = 'NIA 공식'
LIMIT 1;

-- Insert posts for 공모전 (16 게재 out of 23 등록, 37980 조회수)
INSERT INTO campaign_posts (
  campaign_id, 
  channel_id, 
  post_url, 
  title,
  posted_date, 
  view_count, 
  click_count, 
  registration_count, 
  status, 
  posted_by
)
SELECT 
  (SELECT id FROM campaign),
  ch.id,
  'https://example.com/post/' || ch.id,
  '총 상금 1억원! NIA 딥페이크 AI 경진대회',
  '2024-11-12',
  CASE 
    WHEN ch.name = '씽굿' THEN 15000
    WHEN ch.name = '위비티' THEN 12000
    WHEN ch.name = '공모전닷컴' THEN 10980
    ELSE 5000
  END,
  CASE 
    WHEN ch.name = '씽굿' THEN 800
    WHEN ch.name = '위비티' THEN 650
    WHEN ch.name = '공모전닷컴' THEN 500
    ELSE 200
  END,
  CASE 
    WHEN ch.name = '씽굿' THEN 60
    WHEN ch.name = '위비티' THEN 45
    WHEN ch.name = '공모전닷컴' THEN 35
    ELSE 15
  END,
  'posted',
  (SELECT id FROM users WHERE role = 'admin' LIMIT 1)
FROM campaign_channels ch
WHERE ch.category = '공모전';

-- Insert posts for 포털카페 (116 게재 out of 116 등록, 509 조회수)
INSERT INTO campaign_posts (
  campaign_id, 
  channel_id, 
  post_url, 
  title,
  posted_date, 
  view_count, 
  click_count, 
  registration_count, 
  status, 
  posted_by
)
SELECT 
  (SELECT id FROM campaign),
  ch.id,
  'https://example.com/post/' || ch.id,
  '[홍보] 딥페이크 탐지 AI 경진대회 참가자 모집',
  '2024-11-20',
  CASE 
    WHEN ch.name LIKE '네이버%' THEN 300
    WHEN ch.name LIKE '다음%' THEN 209
    ELSE 100
  END,
  CASE 
    WHEN ch.name LIKE '네이버%' THEN 30
    WHEN ch.name LIKE '다음%' THEN 20
    ELSE 10
  END,
  CASE 
    WHEN ch.name LIKE '네이버%' THEN 3
    WHEN ch.name LIKE '다음%' THEN 2
    ELSE 1
  END,
  'posted',
  (SELECT id FROM users WHERE role = 'admin' LIMIT 1)
FROM campaign_channels ch
WHERE ch.category = '포털카페';

-- Insert posts for SNS그룹 (8 게재 out of 92 등록, 113 조회수)
INSERT INTO campaign_posts (
  campaign_id, 
  channel_id, 
  post_url, 
  title,
  posted_date, 
  view_count, 
  click_count, 
  registration_count, 
  status, 
  posted_by
)
SELECT 
  (SELECT id FROM campaign),
  ch.id,
  'https://example.com/post/' || ch.id,
  'AI 전문가 여러분, 딥페이크 탐지 경진대회에 도전하세요!',
  '2024-11-18',
  CASE 
    WHEN ch.name LIKE '페이스북%' THEN 70
    WHEN ch.name LIKE '링크드인%' THEN 43
    ELSE 30
  END,
  CASE 
    WHEN ch.name LIKE '페이스북%' THEN 8
    WHEN ch.name LIKE '링크드인%' THEN 5
    ELSE 3
  END,
  CASE 
    WHEN ch.name LIKE '페이스북%' THEN 1
    WHEN ch.name LIKE '링크드인%' THEN 1
    ELSE 0
  END,
  'posted',
  (SELECT id FROM users WHERE role = 'admin' LIMIT 1)
FROM campaign_channels ch
WHERE ch.category = 'SNS그룹';

-- Insert posts for 커뮤니티 (14 게재 out of 25 등록, 2619 조회수)
INSERT INTO campaign_posts (
  campaign_id, 
  channel_id, 
  post_url, 
  title,
  posted_date, 
  view_count, 
  click_count, 
  registration_count, 
  status, 
  posted_by
)
SELECT 
  (SELECT id FROM campaign),
  ch.id,
  'https://example.com/post/' || ch.id,
  '[경진대회] NIA 딥페이크 범죄 대응 AI 모델 개발 챌린지',
  '2024-11-16',
  CASE 
    WHEN ch.name = 'OKKY' THEN 1500
    WHEN ch.name = '클리앙' THEN 1119
    ELSE 500
  END,
  CASE 
    WHEN ch.name = 'OKKY' THEN 120
    WHEN ch.name = '클리앙' THEN 85
    ELSE 40
  END,
  CASE 
    WHEN ch.name = 'OKKY' THEN 12
    WHEN ch.name = '클리앙' THEN 8
    ELSE 4
  END,
  'posted',
  (SELECT id FROM users WHERE role = 'admin' LIMIT 1)
FROM campaign_channels ch
WHERE ch.category = '커뮤니티';

-- Insert posts for 오픈단톡방 (19 게재 out of 22 등록, 조회수 0)
INSERT INTO campaign_posts (
  campaign_id, 
  channel_id, 
  post_url, 
  title,
  posted_date, 
  view_count, 
  click_count, 
  registration_count, 
  status, 
  posted_by
)
SELECT 
  (SELECT id FROM campaign),
  ch.id,
  'https://example.com/post/' || ch.id,
  '💡 딥페이크 AI 탐지 경진대회 안내',
  '2024-11-22',
  0,
  0,
  0,
  'posted',
  (SELECT id FROM users WHERE role = 'admin' LIMIT 1)
FROM campaign_channels ch
WHERE ch.category = '오픈단톡방';

-- Insert posts for 디스코드 (4 게재 out of 4 등록, 조회수 0)
INSERT INTO campaign_posts (
  campaign_id, 
  channel_id, 
  post_url, 
  title,
  posted_date, 
  view_count, 
  click_count, 
  registration_count, 
  status, 
  posted_by
)
SELECT 
  (SELECT id FROM campaign),
  ch.id,
  'https://example.com/post/' || ch.id,
  '🤖 NIA AI Competition - Deepfake Detection',
  '2024-11-23',
  0,
  0,
  0,
  'posted',
  (SELECT id FROM users WHERE role = 'admin' LIMIT 1)
FROM campaign_channels ch
WHERE ch.category = '디스코드';

-- Insert posts for DM (325 게재 out of 314 등록 - 실제로는 314만 등록, 조회수 0)
INSERT INTO campaign_posts (
  campaign_id, 
  channel_id, 
  post_url, 
  title,
  posted_date, 
  view_count, 
  click_count, 
  registration_count, 
  status, 
  posted_by
)
SELECT 
  (SELECT id FROM campaign),
  ch.id,
  'mailto:example@email.com',
  '귀하를 NIA 딥페이크 탐지 AI 경진대회에 초대합니다',
  '2024-11-25',
  0,
  0,
  0,
  'posted',
  (SELECT id FROM users WHERE role = 'admin' LIMIT 1)
FROM campaign_channels ch
WHERE ch.category = 'DM';