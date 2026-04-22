#include "DHT.h"
#include <Wire.h>
#include <BH1750.h>

#include "model.h"

#include <TensorFlowLite_ESP32.h>
#include "tensorflow/lite/micro/all_ops_resolver.h"
#include "tensorflow/lite/micro/micro_error_reporter.h"
#include "tensorflow/lite/micro/micro_interpreter.h"
#include "tensorflow/lite/schema/schema_generated.h"

// ======================================================
// MONEY PLANT DEMO MODE - SMART TINYML IRRIGATION SYSTEM
// ======================================================

// ---------------- PINS ----------------
#define DHTPIN 19
#define DHTTYPE DHT22
#define SOIL1 35

#define PUMP   25
#define VALVE1 26

// ---------------- CALIBRATION ----------------
#define SOIL1_DRY 4095
#define SOIL1_WET 720

// ---------------- THRESHOLDS ----------------
#define START_LEVEL 30     // start watering below this
#define STOP_LEVEL 55      // normal stop target
#define HARD_MAX   62      // emergency upper stop

// ---------------- DEMO TIMING ----------------
#define HEALTHY_DELAY   3000     // 3 sec normal monitoring
#define DRY_DELAY       1000     // 1 sec when near dry zone
#define COOLDOWN_DELAY 10000     // 10 sec stabilization after watering

DHT dht(DHTPIN, DHTTYPE);
BH1750 lightMeter;

// ---------------- TINYML ----------------
namespace {
tflite::MicroErrorReporter micro_error_reporter;
tflite::AllOpsResolver resolver;
const tflite::Model* model = nullptr;
tflite::MicroInterpreter* interpreter = nullptr;

constexpr int tensorArenaSize = 8 * 1024;
uint8_t tensorArena[tensorArenaSize];

TfLiteTensor* input = nullptr;
TfLiteTensor* output = nullptr;
}

// ---------------- FUNCTIONS ----------------

float getSoilPct(int raw, int dry, int wet) {
  float pct = ((float)(dry - raw) / (dry - wet)) * 100.0;

  if (pct > 100) pct = 100;
  if (pct < 0) pct = 0;

  return pct;
}

void allOff() {
  digitalWrite(PUMP, HIGH);     // relay OFF
  digitalWrite(VALVE1, HIGH);   // relay OFF
}

float runModel(float soil, float temp, float hum, float light) {

  // money plant one-hot encoding
  input->data.f[0] = 0;
  input->data.f[1] = 1;
  input->data.f[2] = 0;

  input->data.f[3] = soil;
  input->data.f[4] = temp;
  input->data.f[5] = hum;
  input->data.f[6] = light;

  interpreter->Invoke();

  return output->data.f[0];
}

void waterPlant() {

  Serial.println(">>> WATERING STARTED");
  Serial.println("Opening valve...");

  digitalWrite(VALVE1, LOW);
  delay(500);

  Serial.println("Pump ON");
  digitalWrite(PUMP, LOW);

  unsigned long startTime = millis();

  while (true) {

    int raw = analogRead(SOIL1);
    float soil = getSoilPct(raw, SOIL1_DRY, SOIL1_WET);

    Serial.print("Live Soil %: ");
    Serial.println(soil);

    // Normal stop target
    if (soil >= STOP_LEVEL) {
      Serial.println("Target moisture reached.");
      break;
    }

    // Emergency protection
    if (soil >= HARD_MAX) {
      Serial.println("Emergency max moisture reached.");
      break;
    }

    // Timeout protection
    if (millis() - startTime > 10000) {
      Serial.println("Safety timeout reached.");
      break;
    }

    delay(1000);   // check every second while watering
  }

  allOff();

  Serial.println("Pump OFF");
  Serial.println("Valve CLOSED");
  Serial.println(">>> WATERING STOPPED");
}

// ---------------- SETUP ----------------

void setup() {

  Serial.begin(115200);

  pinMode(PUMP, OUTPUT);
  pinMode(VALVE1, OUTPUT);

  allOff();

  dht.begin();

  Wire.begin(21,22);
  lightMeter.begin();

  model = tflite::GetModel(plant_model);

  interpreter = new tflite::MicroInterpreter(
      model, resolver, tensorArena, tensorArenaSize, &micro_error_reporter);

  interpreter->AllocateTensors();

  input = interpreter->input(0);
  output = interpreter->output(0);

  Serial.println("==================================");
  Serial.println("Money Plant DEMO AI System Ready");
  Serial.println("TinyML + Auto Irrigation Enabled");
  Serial.println("==================================");
}

// ---------------- LOOP ----------------

void loop() {

  float hum = dht.readHumidity();
  float temp = dht.readTemperature();
  float light = lightMeter.readLightLevel();

  if (isnan(temp) || isnan(hum)) {
    Serial.println("Sensor Error: DHT reading failed");
    delay(2000);
    return;
  }

  int raw = analogRead(SOIL1);
  float soil = getSoilPct(raw, SOIL1_DRY, SOIL1_WET);

  float pred = runModel(soil, temp, hum, light);

  Serial.println("----------------------------------");
  Serial.print("Temperature: ");
  Serial.println(temp);

  Serial.print("Humidity: ");
  Serial.println(hum);

  Serial.print("Light: ");
  Serial.println(light);

  Serial.print("Soil Moisture %: ");
  Serial.println(soil);

  Serial.print("TinyML Prediction: ");
  Serial.println(pred, 4);

  // Decision logic
  if (soil < START_LEVEL && pred > 0.5) {

    Serial.println("Decision: WATER REQUIRED");
    waterPlant();

    Serial.println("Waiting for soil moisture to settle...");
    delay(COOLDOWN_DELAY);   // stabilization delay

    return;
  }
  else {
    Serial.println("Decision: NO WATERING NEEDED");
  }

  // Adaptive demo monitoring speed
  if (soil <= 35) {
    Serial.println("Monitoring Mode: Fast (near dry zone)");
    delay(DRY_DELAY);
  }
  else {
    Serial.println("Monitoring Mode: Normal");
    delay(HEALTHY_DELAY);
  }
}