import pandas as pd
import json

# Excel 파일 읽기
file_path = 'data/2026 NRF AI Co-Scientist Challenge Korea 경진대회 - 홍보 대시보드.xlsx'

# 채널 시트 읽기
channels_df = pd.read_excel(file_path, sheet_name='채널')

print("=== 채널 데이터 분석 ===\n")
print(f"총 채널 수: {len(channels_df)}")
print(f"\n컬럼 목록: {list(channels_df.columns)}")

# 채널 유형 분석
if '유형' in channels_df.columns:
    channel_types = channels_df['유형'].unique()
    print(f"\n채널 유형 종류 ({len(channel_types)}개):")
    for idx, ch_type in enumerate(sorted(channel_types), 1):
        count = len(channels_df[channels_df['유형'] == ch_type])
        print(f"  {idx}. {ch_type} ({count}개)")

# 각 유형별 속성 분석
print("\n=== 유형별 속성 분석 ===\n")

channel_type_attributes = {}

for ch_type in sorted(channel_types):
    type_df = channels_df[channels_df['유형'] == ch_type]
    
    # null이 아닌 컬럼들 찾기
    non_null_columns = []
    for col in type_df.columns:
        if type_df[col].notna().any():
            non_null_columns.append(col)
    
    channel_type_attributes[ch_type] = non_null_columns
    
    print(f"\n{ch_type} 유형의 속성:")
    print(f"  사용 컬럼: {non_null_columns}")
    
    # 샘플 데이터 출력
    if len(type_df) > 0:
        sample = type_df.iloc[0]
        print(f"  샘플 데이터:")
        for col in non_null_columns:
            if pd.notna(sample[col]):
                print(f"    - {col}: {sample[col]}")

# 공통 속성과 유형별 특수 속성 찾기
all_columns = set()
for attrs in channel_type_attributes.values():
    all_columns.update(attrs)

common_attrs = set(all_columns)
for attrs in channel_type_attributes.values():
    common_attrs = common_attrs.intersection(attrs)

print("\n=== 속성 분류 ===")
print(f"\n공통 속성: {sorted(common_attrs)}")

print("\n유형별 특수 속성:")
for ch_type, attrs in sorted(channel_type_attributes.items()):
    special_attrs = set(attrs) - common_attrs
    if special_attrs:
        print(f"  {ch_type}: {sorted(special_attrs)}")

# JSON으로 저장
output = {
    'channel_types': sorted(channel_types.tolist()),
    'common_attributes': sorted(common_attrs),
    'type_specific_attributes': {}
}

for ch_type in sorted(channel_types):
    type_df = channels_df[channels_df['유형'] == ch_type]
    attrs = []
    for col in type_df.columns:
        if type_df[col].notna().any():
            attrs.append(col)
    output['type_specific_attributes'][ch_type] = sorted(set(attrs) - common_attrs)

# JSON 파일로 저장
with open('channel_types_config.json', 'w', encoding='utf-8') as f:
    json.dump(output, f, ensure_ascii=False, indent=2)

print("\n\nchannel_types_config.json 파일로 저장 완료!")

# 채널 데이터 전체를 CSV로 저장 (DB 임포트용)
channels_df.to_csv('channels_data.csv', index=False, encoding='utf-8-sig')
print("channels_data.csv 파일로 저장 완료!")