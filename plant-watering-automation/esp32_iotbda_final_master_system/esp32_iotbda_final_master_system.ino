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

// ======================================================
// FINAL IOTBDA MASTER SYSTEM
// TinyML + 3 Plant Irrigation + MQTT Publishing
// ======================================================

// ---------------- WIFI ----------------
const char* ssid = "SLT-Fiber-2.4G";
const char* password = "HNYC6749";

// ---------------- MQTT ----------------
const char* mqtt_server = "broker.hivemq.com";
const char* SENSOR_TOPIC = "iotbda/sensors";
const char* EVENT_TOPIC  = "iotbda/watering_events";

WiFiClient espClient;
PubSubClient client(espClient);

// ---------------- SHARED SENSOR PINS ----------------
#define DHTPIN 19
#define DHTTYPE DHT22

#define SOIL1 35   // Money plant
#define SOIL2 34   // Snake plant
#define SOIL3 32   // Cactus

// ---------------- RELAY PINS ----------------
#define PUMP   25
#define VALVE1 26
#define VALVE2 27
#define VALVE3 14

// ---------------- CALIBRATION ----------------
#define SOIL1_DRY 4095
#define SOIL1_WET 720

#define SOIL2_DRY 4095
#define SOIL2_WET 900

#define SOIL3_DRY 4095
#define SOIL3_WET 800

// ---------------- START / STOP THRESHOLDS ----------------
// Money plant
#define MP_START 30
#define MP_STOP  55
#define MP_MAX   62

// Snake plant
#define SP_START 25
#define SP_STOP  42
#define SP_MAX   50

// Cactus
#define CA_START 20
#define CA_STOP  28
#define CA_MAX   35

// ---------------- DEMO TIMING ----------------
#define HEALTHY_DELAY   3000UL  // 3 sec
#define DRY_DELAY       1000UL  // 1 sec
#define COOLDOWN_DELAY 10000UL  // 10 sec for only the watered plant
#define WATER_TIMEOUT  10000UL  // 10 sec max watering

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

// ---------------- GLOBAL SCHEDULING ----------------
unsigned long nextCheckTime = 0;

// per-plant cooldown timers
unsigned long moneyCooldownUntil = 0;
unsigned long snakeCooldownUntil = 0;
unsigned long cactusCooldownUntil = 0;

// ---------------- HELPERS ----------------
float getSoilPct(int raw, int dry, int wet) {
  float pct = ((float)(dry - raw) / (dry - wet)) * 100.0;
  if (pct > 100) pct = 100;
  if (pct < 0) pct = 0;
  return pct;
}

void allOff() {
  digitalWrite(PUMP, HIGH);
  digitalWrite(VALVE1, HIGH);
  digitalWrite(VALVE2, HIGH);
  digitalWrite(VALVE3, HIGH);
}

void connectWiFi() {
  if (WiFi.status() == WL_CONNECTED) return;

  Serial.println("Connecting to WiFi...");
  WiFi.begin(ssid, password);

  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }

  Serial.println("\nWiFi Connected");
  Serial.print("IP: ");
  Serial.println(WiFi.localIP());
}

void connectMQTT() {
  client.setServer(mqtt_server, 1883);

  while (!client.connected()) {
    Serial.println("Connecting to MQTT Broker...");
    if (client.connect("ESP32_IOTBDA_MASTER_SYSTEM")) {
      Serial.println("MQTT Connected!");
    } else {
      Serial.print("MQTT failed, state=");
      Serial.println(client.state());
      delay(2000);
    }
  }
}

float runModel(int p1, int p2, int p3, float soil, float temp, float hum, float light) {
  input->data.f[0] = p1;
  input->data.f[1] = p2;
  input->data.f[2] = p3;
  input->data.f[3] = soil;
  input->data.f[4] = temp;
  input->data.f[5] = hum;
  input->data.f[6] = light;

  interpreter->Invoke();
  return output->data.f[0];
}

void publishSensorData(float temp, float hum, float light,
                       int soil1_raw, float soil1_pct,
                       int soil2_raw, float soil2_pct,
                       int soil3_raw, float soil3_pct) {
  String payload = "{";
  payload += "\"temperature\":" + String(temp, 2) + ",";
  payload += "\"humidity\":" + String(hum, 2) + ",";
  payload += "\"light\":" + String(light, 2) + ",";
  payload += "\"soil1_raw\":" + String(soil1_raw) + ",";
  payload += "\"soil1_pct\":" + String(soil1_pct, 2) + ",";
  payload += "\"soil2_raw\":" + String(soil2_raw) + ",";
  payload += "\"soil2_pct\":" + String(soil2_pct, 2) + ",";
  payload += "\"soil3_raw\":" + String(soil3_raw) + ",";
  payload += "\"soil3_pct\":" + String(soil3_pct, 2);
  payload += "}";

  client.publish(SENSOR_TOPIC, payload.c_str());
  Serial.println("Sensor data published");
}

void publishWateringEvent(const char* plantId,
                          const char* plantType,
                          float prediction,
                          float soilBefore,
                          float soilAfter,
                          unsigned long durationSec) {
  String payload = "{";
  payload += "\"plant_id\":\"" + String(plantId) + "\",";
  payload += "\"plant_type\":\"" + String(plantType) + "\",";
  payload += "\"prediction\":" + String(prediction, 4) + ",";
  payload += "\"soil_before\":" + String(soilBefore, 2) + ",";
  payload += "\"soil_after\":" + String(soilAfter, 2) + ",";
  payload += "\"duration_sec\":" + String(durationSec);
  payload += "}";

  client.publish(EVENT_TOPIC, payload.c_str());
  Serial.println("Watering event published");
}

void printCooldownRemaining(const char* plantName, unsigned long cooldownUntil) {
  unsigned long now = millis();
  if (cooldownUntil > now) {
    unsigned long remaining = (cooldownUntil - now) / 1000;
    Serial.print("Status: ");
    Serial.print(plantName);
    Serial.print(" settling / cooldown (");
    Serial.print(remaining);
    Serial.println(" sec left)");
  }
}

bool waterPlant(const char* plantName,
                const char* plantId,
                const char* plantType,
                int valvePin,
                int soilPin,
                int dry,
                int wet,
                float stopLevel,
                float hardMax,
                float predictionValue) {
  int rawBefore = analogRead(soilPin);
  float soilBefore = getSoilPct(rawBefore, dry, wet);

  Serial.println(">>> WATERING STARTED");
  Serial.print("Plant: ");
  Serial.println(plantName);
  Serial.println("Opening valve...");

  digitalWrite(valvePin, LOW);
  delay(500);

  Serial.println("Pump ON");
  digitalWrite(PUMP, LOW);

  unsigned long startTime = millis();
  float soilAfter = soilBefore;

  while (true) {
    int raw = analogRead(soilPin);
    float soil = getSoilPct(raw, dry, wet);
    soilAfter = soil;

    Serial.print("Live Soil %: ");
    Serial.println(soil);

    if (soil >= stopLevel) {
      Serial.println("Target moisture reached.");
      break;
    }

    if (soil >= hardMax) {
      Serial.println("Emergency max moisture reached.");
      break;
    }

    if (millis() - startTime > WATER_TIMEOUT) {
      Serial.println("Safety timeout reached.");
      break;
    }

    delay(1000);
  }

  allOff();

  Serial.println("Pump OFF");
  Serial.println("Valve CLOSED");
  Serial.println(">>> WATERING STOPPED");

  unsigned long durationSec = (millis() - startTime) / 1000;
  publishWateringEvent(plantId, plantType, predictionValue, soilBefore, soilAfter, durationSec);

  return true;
}

void checkMoneyPlant(float temp, float hum, float light, unsigned long now) {
  int raw = analogRead(SOIL1);
  float soil = getSoilPct(raw, SOIL1_DRY, SOIL1_WET);

  Serial.println("----------------------------------");
  Serial.println("Money Plant");
  Serial.print("Temperature: "); Serial.println(temp);
  Serial.print("Humidity: "); Serial.println(hum);
  Serial.print("Light: "); Serial.println(light);
  Serial.print("Soil Moisture %: "); Serial.println(soil);

  if (now < moneyCooldownUntil) {
    printCooldownRemaining("Money Plant", moneyCooldownUntil);
    return;
  }

  float pred = runModel(0, 1, 0, soil, temp, hum, light);

  Serial.print("TinyML Prediction: ");
  Serial.println(pred, 4);

  if (soil < MP_START && pred > 0.5) {
    Serial.println("Decision: WATER REQUIRED");
    if (waterPlant("Money Plant", "plant1", "money_plant",
                   VALVE1, SOIL1, SOIL1_DRY, SOIL1_WET,
                   MP_STOP, MP_MAX, pred)) {
      moneyCooldownUntil = millis() + COOLDOWN_DELAY;
      Serial.println("Money Plant entering settling cooldown...");
    }
  } else {
    Serial.println("Decision: NO WATERING NEEDED");
  }
}

void checkSnakePlant(float temp, float hum, float light, unsigned long now) {
  int raw = analogRead(SOIL2);
  float soil = getSoilPct(raw, SOIL2_DRY, SOIL2_WET);

  Serial.println("----------------------------------");
  Serial.println("Snake Plant");
  Serial.print("Temperature: "); Serial.println(temp);
  Serial.print("Humidity: "); Serial.println(hum);
  Serial.print("Light: "); Serial.println(light);
  Serial.print("Soil Moisture %: "); Serial.println(soil);

  if (now < snakeCooldownUntil) {
    printCooldownRemaining("Snake Plant", snakeCooldownUntil);
    return;
  }

  float pred = runModel(0, 0, 1, soil, temp, hum, light);

  Serial.print("TinyML Prediction: ");
  Serial.println(pred, 4);

  if (soil < SP_START && pred > 0.5) {
    Serial.println("Decision: WATER REQUIRED");
    if (waterPlant("Snake Plant", "plant2", "snake_plant",
                   VALVE2, SOIL2, SOIL2_DRY, SOIL2_WET,
                   SP_STOP, SP_MAX, pred)) {
      snakeCooldownUntil = millis() + COOLDOWN_DELAY;
      Serial.println("Snake Plant entering settling cooldown...");
    }
  } else {
    Serial.println("Decision: NO WATERING NEEDED");
  }
}

void checkCactus(float temp, float hum, float light, unsigned long now) {
  int raw = analogRead(SOIL3);
  float soil = getSoilPct(raw, SOIL3_DRY, SOIL3_WET);

  Serial.println("----------------------------------");
  Serial.println("Cactus");
  Serial.print("Temperature: "); Serial.println(temp);
  Serial.print("Humidity: "); Serial.println(hum);
  Serial.print("Light: "); Serial.println(light);
  Serial.print("Soil Moisture %: "); Serial.println(soil);

  if (now < cactusCooldownUntil) {
    printCooldownRemaining("Cactus", cactusCooldownUntil);
    return;
  }

  float pred = runModel(1, 0, 0, soil, temp, hum, light);

  Serial.print("TinyML Prediction: ");
  Serial.println(pred, 4);

  if (soil < CA_START && pred > 0.5) {
    Serial.println("Decision: WATER REQUIRED");
    if (waterPlant("Cactus", "plant3", "cactus",
                   VALVE3, SOIL3, SOIL3_DRY, SOIL3_WET,
                   CA_STOP, CA_MAX, pred)) {
      cactusCooldownUntil = millis() + COOLDOWN_DELAY;
      Serial.println("Cactus entering settling cooldown...");
    }
  } else {
    Serial.println("Decision: NO WATERING NEEDED");
  }
}

// ---------------- SETUP ----------------
void setup() {
  Serial.begin(115200);

  pinMode(PUMP, OUTPUT);
  pinMode(VALVE1, OUTPUT);
  pinMode(VALVE2, OUTPUT);
  pinMode(VALVE3, OUTPUT);

  allOff();

  dht.begin();
  Wire.begin(21, 22);
  lightMeter.begin();

  connectWiFi();
  connectMQTT();

  model = tflite::GetModel(plant_model);

  interpreter = new tflite::MicroInterpreter(
    model, resolver, tensorArena, tensorArenaSize, &micro_error_reporter
  );

  interpreter->AllocateTensors();

  input = interpreter->input(0);
  output = interpreter->output(0);

  nextCheckTime = millis();

  Serial.println("====================================================");
  Serial.println("FINAL IOTBDA MASTER SYSTEM READY");
  Serial.println("TinyML + Irrigation + MQTT Sensor/Event Publishing");
  Serial.println("====================================================");
}

// ---------------- LOOP ----------------
void loop() {
  if (WiFi.status() != WL_CONNECTED) {
    connectWiFi();
  }

  if (!client.connected()) {
    connectMQTT();
  }

  client.loop();

  unsigned long now = millis();

  if (now < nextCheckTime) {
    return;
  }

  float hum = dht.readHumidity();
  float temp = dht.readTemperature();
  float light = lightMeter.readLightLevel();

  if (isnan(temp) || isnan(hum)) {
    Serial.println("Sensor Error: DHT reading failed");
    nextCheckTime = millis() + 2000;
    return;
  }

  if (light < 0) light = 0;

  int soil1_raw = analogRead(SOIL1);
  int soil2_raw = analogRead(SOIL2);
  int soil3_raw = analogRead(SOIL3);

  float soil1_pct = getSoilPct(soil1_raw, SOIL1_DRY, SOIL1_WET);
  float soil2_pct = getSoilPct(soil2_raw, SOIL2_DRY, SOIL2_WET);
  float soil3_pct = getSoilPct(soil3_raw, SOIL3_DRY, SOIL3_WET);

  // publish current live sensor snapshot every monitoring cycle
  publishSensorData(temp, hum, light,
                    soil1_raw, soil1_pct,
                    soil2_raw, soil2_pct,
                    soil3_raw, soil3_pct);

  checkMoneyPlant(temp, hum, light, now);
  checkSnakePlant(temp, hum, light, now);
  checkCactus(temp, hum, light, now);

  bool nearDry =
    (soil1_pct <= 35) ||
    (soil2_pct <= 30) ||
    (soil3_pct <= 25);

  if (nearDry) {
    Serial.println("Monitoring Mode: Fast (one or more plants near dry zone)");
    nextCheckTime = millis() + DRY_DELAY;
  } else {
    Serial.println("Monitoring Mode: Normal");
    nextCheckTime = millis() + HEALTHY_DELAY;
  }
}