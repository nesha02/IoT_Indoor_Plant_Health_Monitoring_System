import pandas as pd

# =========================
# FILE PATHS
# =========================
INPUT_PATH = "data/processed/dataset.csv"
OUTPUT_PATH = "data/final/labeled_dataset.csv"

# =========================
# LOAD DATA
# =========================
df = pd.read_csv(INPUT_PATH)

print("Loaded dataset shape:", df.shape)

# =========================
# LABEL FUNCTION
# Binary label:
# 1 = water needed
# 0 = no water needed
# =========================
def get_water_needed(row):
    plant = row["plant_type"]
    soil = row["soil_pct"]

    if plant == "money_plant":
        return 1 if soil < 30 else 0

    elif plant == "snake_plant":
        return 1 if soil < 25 else 0

    elif plant == "cactus":
        return 1 if soil < 20 else 0

    else:
        return None  # unknown plant type

# =========================
# APPLY LABELING
# =========================
df["water_needed"] = df.apply(get_water_needed, axis=1)

# Remove rows with unknown plant types, if any
df = df.dropna(subset=["water_needed"])

# Convert label to integer
df["water_needed"] = df["water_needed"].astype(int)

# =========================
# SAVE LABELED DATASET
# =========================
df.to_csv(OUTPUT_PATH, index=False)

print("Labeled dataset shape:", df.shape)
print("Label distribution:")
print(df["water_needed"].value_counts())
print("✅ labeled_dataset.csv created successfully!")