import pandas as pd

# =========================
# FILE PATHS
# =========================
INPUT_PATH = "data/raw/iotbda_database.sensor_reading_collection.csv"
OUTPUT_PATH = "data/processed/dataset.csv"

# =========================
# LOAD DATA
# =========================
df = pd.read_csv(INPUT_PATH)

print("Original shape:", df.shape)

# =========================
# CLEAN 1: REMOVE INVALID SENSOR READINGS
# Remove rows where temperature AND humidity are both 0
# =========================
df = df[~((df["temperature"] == 0) & (df["humidity"] == 0))]

print("After removing invalid temp/humidity:", df.shape)

# =========================
# RESHAPE DATA (3 plants → 1 row per plant)
# =========================
rows = []

for _, row in df.iterrows():

    rows.append({
        "plant_type": row["plant1_type"],
        "soil_pct": row["soil1_pct"],
        "temperature": row["temperature"],
        "humidity": row["humidity"],
        "light": row["light"]
    })

    rows.append({
        "plant_type": row["plant2_type"],
        "soil_pct": row["soil2_pct"],
        "temperature": row["temperature"],
        "humidity": row["humidity"],
        "light": row["light"]
    })

    rows.append({
        "plant_type": row["plant3_type"],
        "soil_pct": row["soil3_pct"],
        "temperature": row["temperature"],
        "humidity": row["humidity"],
        "light": row["light"]
    })

processed_df = pd.DataFrame(rows)

print("After reshaping:", processed_df.shape)

# =========================
# CLEAN 2: REMOVE INVALID SOIL VALUES
# Keep only 0–100%
# =========================
processed_df = processed_df[
    (processed_df["soil_pct"] >= 0) & (processed_df["soil_pct"] <= 100)
]

print("After soil cleaning:", processed_df.shape)

# =========================
# CLEAN 3: REMOVE MISSING VALUES
# =========================
processed_df = processed_df.dropna()

print("After removing missing values:", processed_df.shape)

# =========================
# CLEAN 4: REMOVE DUPLICATES (SAFE)
# =========================
processed_df = processed_df.drop_duplicates()

print("After removing duplicates:", processed_df.shape)

# =========================
# FINAL FORMAT (STRICT)
# =========================
processed_df = processed_df[
    ["plant_type", "soil_pct", "temperature", "humidity", "light"]
]

# =========================
# SAVE DATASET
# =========================
processed_df.to_csv(OUTPUT_PATH, index=False)

print("✅ dataset.csv created successfully!")