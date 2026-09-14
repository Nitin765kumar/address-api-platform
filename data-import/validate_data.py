import pandas as pd

FILE_PATH = "mdds_villages.xlsx"

print("Reading Excel file...")

df = pd.read_excel(
    FILE_PATH,
    sheet_name="allVillagesofIndia",
    header=1,
    engine="openpyxl"
)

print("\n========== DATASET SUMMARY ==========")
print(f"Total rows: {len(df):,}")
print(f"Total columns: {len(df.columns)}")

print("\n========== UNIQUE COUNTS ==========")

print(f"States / UTs: {df['State Code'].nunique():,}")
print(f"Districts: {df[['State Code', 'District Code']].drop_duplicates().shape[0]:,}")
print(f"Sub-Districts: {df[['State Code', 'District Code', 'Sub-District Code']].drop_duplicates().shape[0]:,}")
print(f"Villages: {df['Village Code'].nunique():,}")

print("\n========== DUPLICATE CODE CHECK ==========")

print(f"Duplicate Village Codes: {df['Village Code'].duplicated().sum():,}")

district_keys = ['State Code', 'District Code']
duplicate_districts = df.duplicated(subset=district_keys).sum()
print(f"Duplicate State + District combinations: {duplicate_districts:,}")

subdistrict_keys = ['State Code', 'District Code', 'Sub-District Code']
duplicate_subdistricts = df.duplicated(subset=subdistrict_keys).sum()
print(f"Duplicate State + District + Sub-District combinations: {duplicate_subdistricts:,}")

print("\n========== REQUIRED FIELD CHECK ==========")

required_columns = [
    'State Code',
    'State Name (In English)',
    'District Code',
    'District Name (In English)',
    'Sub-District Code',
    'Sub-District Name (In English)',
    'Village Code',
    'Village Name (In English)'
]
print("\n========== CODE-NAME CONSISTENCY CHECK ==========")

state_check = (
    df.groupby("State Code")["State Name (In English)"]
    .nunique()
)

district_check = (
    df.groupby(["State Code", "District Code"])["District Name (In English)"]
    .nunique()
)

subdistrict_check = (
    df.groupby(
        ["State Code", "District Code", "Sub-District Code"]
    )["Sub-District Name (In English)"]
    .nunique()
)

village_check = (
    df.groupby("Village Code")["Village Name (In English)"]
    .nunique()
)

print(
    f"State codes with multiple names: "
    f"{(state_check > 1).sum():,}"
)

print(
    f"District code combinations with multiple names: "
    f"{(district_check > 1).sum():,}"
)

print(
    f"Sub-District code combinations with multiple names: "
    f"{(subdistrict_check > 1).sum():,}"
)

print(
    f"Village codes with multiple names: "
    f"{(village_check > 1).sum():,}"
)

print("\n========== DATASET VALIDATION COMPLETE ==========")

for column in required_columns:
    missing = df[column].isna().sum()
    print(f"{column}: {missing:,} missing")

print("\n========== DATASET VALIDATION COMPLETE ==========")