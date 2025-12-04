import pandas as pd

# Excel 파일 경로
file_path = 'data/2026 NRF AI Co-Scientist Challenge Korea 경진대회 - 홍보 대시보드.xlsx'

# Excel 파일의 모든 시트 이름 확인
excel_file = pd.ExcelFile(file_path)
print("Excel 파일의 시트 목록:")
for idx, sheet in enumerate(excel_file.sheet_names, 1):
    print(f"  {idx}. {sheet}")

print("\n각 시트의 데이터 확인:")
for sheet_name in excel_file.sheet_names:
    df = pd.read_excel(file_path, sheet_name=sheet_name)
    print(f"\n=== {sheet_name} 시트 ===")
    print(f"  행 수: {len(df)}")
    print(f"  열 수: {len(df.columns)}")
    print(f"  컬럼: {list(df.columns)[:10]}")  # 처음 10개 컬럼만 표시
    if '...' in str(df.columns) and len(df.columns) > 10:
        print(f"  ... 총 {len(df.columns)}개 컬럼")
    
    # 첫 몇 행 데이터 미리보기
    if len(df) > 0:
        print(f"  첫 행 데이터:")
        for col in df.columns[:5]:  # 처음 5개 컬럼의 데이터만
            print(f"    {col}: {df.iloc[0][col]}")