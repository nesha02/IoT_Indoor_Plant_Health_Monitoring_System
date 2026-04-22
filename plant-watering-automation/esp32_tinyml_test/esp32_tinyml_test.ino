#include <WiFi.h>
#include <PubSubClient.h>
#include "DHT.h"
#include <Wire.h>
#include <BH1750.h>

#include "model.h"

#include <TensorFlowLite_ESP32.h>
#include "tensorflow/lite/micro/all_ops_resolver.h"
#include "tensorflow/lite/micro/micro_error_reporter.h"
#include "tensorflow/lite/micro/micro_interpreter.h"
#include "tensorflow/lite/schema/schema_generated.h"

// ---------------- SENSOR PINS ----------------
#define DHTPIN 19
#define DHTTYPE DHT22

#define SOIL_PIN1 35
#define SOIL_PIN2 34
#define SOIL_PIN3 32

// -------- CALIBRATION VALUES --------
#define SOIL1_DRY 4095
#define SOIL1_WET 720

#define SOIL2_DRY 4095
#define SOIL2_WET 900

#define SOIL3_DRY 4095
#define SOIL3_WET 800

DHT dht(DHTPIN, DHTTYPE);
BH1750 lightMeter;

// ---------------- TFLITE ----------------
tflite::MicroErrorReporter micro_error_reporter;
tflite::ErrorReporter* error_reporter = &micro_error_reporter;
const tflite::Model* model = nullptr;
tflite::AllOpsResolver resolver;

constexpr int tensorArenaSize = 8 * 1024;
uint8_t tensorArena[tensorArenaSize];

tflite::MicroInterpreter* interpreter = nullptr;
TfLiteTensor* input = nullptr;
TfLiteTensor* output = nullptr;

// ---------------- FUNCTIONS ----------------
float getMoisturePercent(int raw, int dry, int wet) {
  float pct = ((float)(dry - raw) / (dry - wet)) * 100.0;

  if (pct > 100) pct = 100;
  if (pct < 0) pct = 0;

  return pct;
}

// ---------------- SETUP ----------------
void setup() {

  Serial.begin(115200);
  delay(2000);

  Serial.println("Starting TinyML Plant Watering Test");

  dht.begin();

  Wire.begin(21,22);

  if (lightMeter.begin()) {
    Serial.println("BH1750 OK");
  }

  // Load model
  model = tflite::GetModel(plant_model);

  if (model->version() != TFLITE_SCHEMA_VERSION) {
    Serial.println("Model schema mismatch!");
    while (1);
  }

  static tflite::MicroInterpreter static_interpreter(
      model, resolver, tensorArena, tensorArenaSize, error_reporter);

  interpreter = &static_interpreter;

  if (interpreter->AllocateTensors() != kTfLiteOk) {
    Serial.println("Tensor allocation failed!");
    while (1);
  }

  input = interpreter->input(0);
  output = interpreter->output(0);

  Serial.println("TinyML Ready!");
}

// ---------------- LOOP ----------------
void loop() {

  float humidity = dht.readHumidity();
  float temperature = dht.readTemperature();

  int soil1_raw = analogRead(SOIL_PIN1);
  float soil1_pct = getMoisturePercent(soil1_raw, SOIL1_DRY, SOIL1_WET);

  float light = lightMeter.readLightLevel();

  if (isnan(humidity) || isnan(temperature)) {
    Serial.println("DHT Error");
    delay(3000);
    return;
  }

  if (light < 0) light = 0;

  // MONEY PLANT INPUT
  input->data.f[0] = 0;           // cactus
  input->data.f[1] = 1;           // money plant
  input->data.f[2] = 0;           // snake plant
  input->data.f[3] = soil1_pct;
  input->data.f[4] = temperature;
  input->data.f[5] = humidity;
  input->data.f[6] = light;

  // Run model
  if (interpreter->Invoke() != kTfLiteOk) {
    Serial.println("Inference failed!");
    delay(3000);
    return;
  }

  float prediction = output->data.f[0];

  Serial.println("------ MONEY PLANT ------");
  Serial.print("Soil %: ");
  Serial.println(soil1_pct);

  Serial.print("Temp: ");
  Serial.println(temperature);

  Serial.print("Humidity: ");
  Serial.println(humidity);

  Serial.print("Light: ");
  Serial.println(light);

  Serial.print("Prediction: ");
  Serial.println(prediction, 4);

  if (prediction < 0.3) {
    Serial.println("Decision: NO WATER");
  }
  else if (prediction < 0.7) {
    Serial.println("Decision: LIGHT WATER");
  }
  else {
    Serial.println("Decision: FULL WATER");
  }

  Serial.println("-------------------------");

  delay(10000);
}
