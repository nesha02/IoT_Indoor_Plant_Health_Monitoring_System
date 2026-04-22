import tensorflow as tf
from pathlib import Path

# =========================
# PATHS
# =========================
MODEL_PATH = "models/tinyml_model.keras"
FLOAT_TFLITE = "models/model_float.tflite"
QUANT_TFLITE = "models/model_quant.tflite"

# =========================
# LOAD MODEL
# =========================
model = tf.keras.models.load_model(MODEL_PATH)

# =========================
# FLOAT MODEL
# =========================
converter = tf.lite.TFLiteConverter.from_keras_model(model)
tflite_model = converter.convert()

Path(FLOAT_TFLITE).write_bytes(tflite_model)
print("✅ Float TFLite model saved!")

# =========================
# QUANTIZED MODEL (IMPORTANT)
# =========================
converter = tf.lite.TFLiteConverter.from_keras_model(model)

# Optimization → reduces size
converter.optimizations = [tf.lite.Optimize.DEFAULT]

tflite_quant = converter.convert()

Path(QUANT_TFLITE).write_bytes(tflite_quant)
print("✅ Quantized TFLite model saved!")