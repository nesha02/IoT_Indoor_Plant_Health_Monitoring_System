#include <WiFi.h>
#include <PubSubClient.h>
#include "DHT.h"
#include <Wire.h>
#include <BH1750.h>

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

// ---------------- WIFI ----------------
const char* ssid = "SLT-Fiber-2.4G";
const char* password = "HNYC6749";

// ---------------- MQTT ----------------
const char* mqtt_server = "broker.hivemq.com";
const char* topic = "iotbda/sensors";

WiFiClient espClient;
PubSubClient client(espClient);

// ---------------- SENSOR OBJECTS ----------------
DHT dht(DHTPIN, DHTTYPE);
BH1750 lightMeter;

// ---------------- MQTT CONNECT ----------------
void connectMQTT() {

  client.setServer(mqtt_server, 1883);

  while (!client.connected()) {

    Serial.println("Connecting to MQTT Broker...");

    if (client.connect("ESP32_IOTBDA_Group")) {
      Serial.println("MQTT Connected!");
    } 
    else {
      Serial.print("MQTT connection failed, state=");
      Serial.println(client.state());
      delay(2000);
    }
  }
}

float getMoisturePercent(int raw, int dry, int wet) {

  float pct = ((float)(dry - raw) / (dry - wet)) * 100.0;

  // Clamp
  if (pct > 100) pct = 100;
  if (pct < 0) pct = 0;

  return pct;
}

// ---------------- SETUP ----------------
void setup() {

  Serial.begin(115200);

  Serial.println("Starting ESP32 IoT Plant Monitoring System");

  // Initialize sensors
  dht.begin();

  Wire.begin(21,22);
  
  if (lightMeter.begin()) {
    Serial.println("BH1750 Light Sensor Initialized");
  } 
  else {
    Serial.println("BH1750 initialization failed!");
  }

  // WiFi connection
  Serial.println("Connecting to WiFi...");
  WiFi.begin(ssid, password);

  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }

  Serial.println("\nWiFi Connected!");
  Serial.print("IP Address: ");
  Serial.println(WiFi.localIP());

  connectMQTT();
}

// ---------------- LOOP ----------------
void loop() {

  // -------- WIFI CHECK --------
  if (WiFi.status() != WL_CONNECTED) {

    Serial.println("WiFi disconnected! Reconnecting...");

    WiFi.begin(ssid, password);

    while (WiFi.status() != WL_CONNECTED) {
      delay(500);
      Serial.print(".");
    }

    Serial.println("\nWiFi Reconnected!");
  }

  // -------- MQTT CHECK --------
  if (!client.connected()) {
    connectMQTT();
  }

  client.loop();

  // -------- READ SENSORS --------

  float humidity = dht.readHumidity();
  float temperature = dht.readTemperature();

  int soil1_raw = analogRead(SOIL_PIN1);
  int soil2_raw = analogRead(SOIL_PIN2);
  int soil3_raw = analogRead(SOIL_PIN3);

  float soil1_pct = getMoisturePercent(soil1_raw, SOIL1_DRY, SOIL1_WET);
  float soil2_pct = getMoisturePercent(soil2_raw, SOIL2_DRY, SOIL2_WET);
  float soil3_pct = getMoisturePercent(soil3_raw, SOIL3_DRY, SOIL3_WET);

  float light = lightMeter.readLightLevel();

  // -------- ERROR HANDLING --------

  // DHT validation
  if (isnan(temperature) || isnan(humidity)) {
    Serial.println("DHT22 sensor error! Skipping reading.");
    return;
  }

  // Light sensor validation
  if (light < 0) {
    Serial.println("BH1750 reading error!");
    light = 0;
  }

  // Soil sensor validation (ESP32 ADC range: 0 - 4095)
  if (soil1_raw < 0 || soil1_raw > 4095) {
    Serial.println("Soil Sensor 1 abnormal reading!");
  }

  if (soil2_raw < 0 || soil2_raw > 4095) {
    Serial.println("Soil Sensor 2 abnormal reading!");
  }

  if (soil3_raw < 0 || soil3_raw > 4095) {
    Serial.println("Soil Sensor 3 abnormal reading!");
  }

  // -------- PRINT TO SERIAL --------

  Serial.println("----- Sensor Readings -----");

  Serial.print("Temperature: ");
  Serial.print(temperature);
  Serial.println(" °C");

  Serial.print("Humidity: ");
  Serial.print(humidity);
  Serial.println(" %");

  Serial.print("Soil1 Raw: ");
  Serial.print(soil1_raw);
  Serial.print(" | %: ");
  Serial.println(soil1_pct);

  Serial.print("Soil2 Raw: ");
  Serial.print(soil2_raw);
  Serial.print(" | %: ");
  Serial.println(soil2_pct);

  Serial.print("Soil3 Raw: ");
  Serial.print(soil3_raw);
  Serial.print(" | %: ");
  Serial.println(soil3_pct);

  Serial.print("Light Intensity: ");
  Serial.print(light);
  Serial.println(" lux");

  // -------- CREATE JSON PAYLOAD --------

  String payload = "{";
  payload += "\"temperature\":" + String(temperature,2) + ",";
  payload += "\"humidity\":" + String(humidity,2) + ",";

  payload += "\"soil1_raw\":" + String(soil1_raw) + ",";
  payload += "\"soil1_pct\":" + String(soil1_pct,2) + ",";

  payload += "\"soil2_raw\":" + String(soil2_raw) + ",";
  payload += "\"soil2_pct\":" + String(soil2_pct,2) + ",";

  payload += "\"soil3_raw\":" + String(soil3_raw) + ",";
  payload += "\"soil3_pct\":" + String(soil3_pct,2) + ",";
  
  payload += "\"light\":" + String(light,2);
  payload += "}";

  Serial.println("Publishing JSON:");
  Serial.println(payload);

  // -------- SEND TO MQTT --------

  client.publish(topic, payload.c_str());

  Serial.println("Data published to MQTT");

  // -------- SAMPLING INTERVAL --------
  delay(60000);   // 1 minute sampling
}