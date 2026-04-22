import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import OneHotEncoder
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score, classification_report, confusion_matrix
import joblib

# =========================
# FILE PATHS
# =========================
INPUT_PATH = "data/final/labeled_dataset.csv"
MODEL_PATH = "models/saved_models/logistic_model.pkl"

# =========================
# LOAD DATA
# =========================
df = pd.read_csv(INPUT_PATH)

print("Dataset shape:", df.shape)

# =========================
# FEATURES & TARGET
# =========================
X = df[["plant_type", "soil_pct", "temperature", "humidity", "light"]]
y = df["water_needed"]

# =========================
# ENCODE plant_type
# =========================
encoder = OneHotEncoder(sparse_output=False)

plant_encoded = encoder.fit_transform(X[["plant_type"]])

plant_encoded_df = pd.DataFrame(
    plant_encoded,
    columns=encoder.get_feature_names_out(["plant_type"])
)

# Combine encoded plant_type with numerical features
X_final = pd.concat(
    [plant_encoded_df, X.drop("plant_type", axis=1).reset_index(drop=True)],
    axis=1
)

# =========================
# TRAIN-TEST SPLIT
# =========================
X_train, X_test, y_train, y_test = train_test_split(
    X_final, y, test_size=0.2, random_state=42
)

# =========================
# MODEL (handles imbalance)
# =========================
model = LogisticRegression(class_weight="balanced", max_iter=1000)

# Train model
model.fit(X_train, y_train)

# =========================
# PREDICTIONS
# =========================
y_pred = model.predict(X_test)

# =========================
# PROBABILITIES (IMPORTANT)
# =========================
y_prob = model.predict_proba(X_test)[:, 1]

# =========================
# EVALUATION
# =========================
print("\nAccuracy:", accuracy_score(y_test, y_pred))

print("\nClassification Report:")
print(classification_report(y_test, y_pred))

print("\nConfusion Matrix:")
print(confusion_matrix(y_test, y_pred))

# =========================
# SAVE MODEL + ENCODER
# =========================
joblib.dump({
    "model": model,
    "encoder": encoder,
    "feature_columns": X_final.columns.tolist()
}, MODEL_PATH)

print("\n✅ Model, encoder, and features saved successfully!")