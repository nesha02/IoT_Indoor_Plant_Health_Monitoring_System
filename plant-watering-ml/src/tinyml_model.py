import pandas as pd
import tensorflow as tf
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import OneHotEncoder
import joblib
import os

# =========================
# PATHS
# =========================
INPUT_PATH = "data/final/labeled_dataset.csv"
MODEL_DIR = "models/tinyml_model"
ENCODER_PATH = "models/tinyml_encoder.pkl"

# =========================
# LOAD DATA
# =========================
df = pd.read_csv(INPUT_PATH)

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

X_final = pd.concat(
    [plant_encoded_df, X.drop("plant_type", axis=1).reset_index(drop=True)],
    axis=1
)

# Save encoder for deployment reference
joblib.dump({
    "encoder": encoder,
    "feature_columns": X_final.columns.tolist()
}, ENCODER_PATH)

# =========================
# TRAIN / TEST SPLIT
# =========================
X_train, X_test, y_train, y_test = train_test_split(
    X_final, y, test_size=0.2, random_state=42
)

# Convert to float32 for TensorFlow / TFLite
X_train = X_train.astype("float32")
X_test = X_test.astype("float32")
y_train = y_train.astype("float32")
y_test = y_test.astype("float32")

# =========================
# BUILD SMALL MODEL
# =========================
model = tf.keras.Sequential([
    tf.keras.layers.Input(shape=(X_train.shape[1],)),
    tf.keras.layers.Dense(8, activation="relu"),
    tf.keras.layers.Dense(1, activation="sigmoid")
])

model.compile(
    optimizer="adam",
    loss="binary_crossentropy",
    metrics=["accuracy"]
)

# =========================
# TRAIN
# =========================
history = model.fit(
    X_train, y_train,
    validation_data=(X_test, y_test),
    epochs=10,
    batch_size=32,
    verbose=1
)

# =========================
# EVALUATE
# =========================
loss, acc = model.evaluate(X_test, y_test, verbose=0)
print(f"\nTest Accuracy: {acc:.4f}")

# =========================
# SAVE MODEL
# =========================
model.save("models/tinyml_model.keras")
print("✅ TensorFlow model saved!")


from sklearn.metrics import classification_report, confusion_matrix
import numpy as np

# =========================
# PREDICTIONS
# =========================
y_pred_prob = model.predict(X_test)
y_pred = (y_pred_prob > 0.5).astype(int)

# =========================
# REPORT
# =========================
print("\nClassification Report:")
print(classification_report(y_test, y_pred))

print("\nConfusion Matrix:")
print(confusion_matrix(y_test, y_pred))