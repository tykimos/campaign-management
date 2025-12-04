#!/usr/bin/env python3
import pandas as pd
import json
from datetime import datetime

# Read Excel file
file_path = "data/2025 NIA 딥페이크 범죄 대응을 위한 AI 탐지 모델 경진대회 - 홍보 대시보드.xlsx"
df = pd.read_excel(file_path)

# Display the data structure
print("=== Excel Data Structure ===")
print(f"Columns: {df.columns.tolist()}")
print(f"Shape: {df.shape}")
print("\n=== First 10 rows ===")
print(df.head(10))
print("\n=== Data Summary ===")
print(df.info())

# Convert to JSON for easier processing
data_dict = df.to_dict(orient='records')
print(f"\n=== Total Records: {len(data_dict)} ===")
print("\nSample record:")
print(json.dumps(data_dict[0], indent=2, default=str, ensure_ascii=False))

# Save as JSON for later processing
with open('data/campaign_data.json', 'w', encoding='utf-8') as f:
    json.dump(data_dict, f, indent=2, default=str, ensure_ascii=False)

print("\nData saved to data/campaign_data.json")