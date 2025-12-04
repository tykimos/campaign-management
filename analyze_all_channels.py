import pandas as pd
import json
from datetime import datetime

# Excel 파일 경로
file_path = 'data/2026 NRF AI Co-Scientist Challenge Korea 경진대회 - 홍보 대시보드.xlsx'

# Excel 파일 읽기
excel_file = pd.ExcelFile(file_path)

# 채널 유형별 데이터 수집
all_channels = []
channel_type_attributes = {}

# 대시보드를 제외한 모든 시트 처리
channel_types = [sheet for sheet in excel_file.sheet_names if sheet != '대시보드']

print("=== 채널 유형별 속성 분석 ===\n")

for channel_type in channel_types:
    df = pd.read_excel(file_path, sheet_name=channel_type)
    
    # 컬럼 이름 정리 (공백 제거)
    df.columns = [col.strip() if isinstance(col, str) else col for col in df.columns]
    
    # Unnamed 컬럼 제거
    df = df[[col for col in df.columns if not str(col).startswith('Unnamed')]]
    
    print(f"\n{channel_type}:")
    print(f"  채널 수: {len(df)}")
    print(f"  속성: {list(df.columns)}")
    
    # 각 행을 채널로 변환
    for idx, row in df.iterrows():
        channel = {
            'channel_type': channel_type,
            'row_index': idx
        }
        
        # 모든 속성 저장
        for col in df.columns:
            value = row[col]
            # NaN이 아닌 값만 저장
            if pd.notna(value):
                # 날짜 타입 처리
                if isinstance(value, pd.Timestamp):
                    channel[col] = value.strftime('%Y-%m-%d')
                else:
                    channel[col] = str(value)
        
        all_channels.append(channel)
    
    # 유형별 속성 저장
    channel_type_attributes[channel_type] = list(df.columns)

# 공통 속성 찾기
all_attrs = set()
for attrs in channel_type_attributes.values():
    all_attrs.update(attrs)

common_attrs = set(all_attrs)
for attrs in channel_type_attributes.values():
    common_attrs = common_attrs.intersection(attrs)

print("\n=== 속성 분석 결과 ===")
print(f"\n공통 속성: {sorted(common_attrs)}")

# 유형별 특수 속성
print("\n유형별 특수 속성:")
special_attrs_by_type = {}
for channel_type, attrs in channel_type_attributes.items():
    special = set(attrs) - common_attrs
    if special:
        special_attrs_by_type[channel_type] = sorted(special)
        print(f"  {channel_type}: {sorted(special)}")

# 속성 매핑 정의
attribute_mapping = {
    # 공통 속성
    '이름': 'name',
    '게재일': 'posted_date',
    '등록일': 'registered_date',
    '삭제일': 'deleted_date',
    '조회수': 'view_count',
    '결과': 'result',
    '메모': 'memo',
    
    # URL 관련
    '주소': 'url',
    '홈페이지 주소': 'homepage_url',
    '이메일 주소': 'email',
    
    # 규모 관련  
    '회원수': 'member_count',
    '인원': 'personnel',
    
    # 연락처
    '전화번호': 'phone',
    '담당연락처': 'contact',
    '대표전화': 'main_phone',
    '언론/과학문화 담당': 'pr_contact',
    
    # 대학 관련
    '본분교': 'campus_type',
    '학제': 'academic_system',
    '지역': 'region',
    '설립구분': 'establishment_type'
}

# 결과 저장
output = {
    'total_channels': len(all_channels),
    'channel_types': channel_types,
    'common_attributes': sorted(common_attrs),
    'special_attributes_by_type': special_attrs_by_type,
    'attribute_mapping': attribute_mapping,
    'channels': all_channels[:5]  # 샘플 5개만
}

# JSON 파일로 저장
with open('channel_analysis.json', 'w', encoding='utf-8') as f:
    json.dump(output, f, ensure_ascii=False, indent=2)

print(f"\n총 {len(all_channels)}개 채널 데이터 분석 완료")
print("channel_analysis.json 파일로 저장됨")

# 데이터베이스 스키마 제안
print("\n=== 데이터베이스 스키마 제안 ===")
print("""
1. campaign_channel_types 테이블:
   - id (varchar, PK): 플랫폼서비스, 정부기관, 등
   - name (text): 표시 이름
   - display_order (int): 정렬 순서
   - attributes_config (jsonb): 유형별 필요 속성 정의

2. campaign_channels 테이블 수정:
   - channel_type (varchar): 채널 유형 ID
   - attributes (jsonb): 유형별 동적 속성 저장
   
   기존 컬럼들은 공통 속성으로 유지:
   - name, url, description
   - member_count, view_count
   - posted_date, registered_date
""")

# CSV 파일로 저장 (모든 채널 데이터)
channels_df = pd.DataFrame(all_channels)
channels_df.to_csv('all_channels.csv', index=False, encoding='utf-8-sig')
print("\nall_channels.csv 파일로 저장됨")