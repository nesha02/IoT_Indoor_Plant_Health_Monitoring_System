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

  int soil1 = analogRead(SOIL_PIN1);
  int soil2 = analogRead(SOIL_PIN2);
  int soil3 = analogRead(SOIL_PIN3);

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
  if (soil1 < 0 || soil1 > 4095) {
    Serial.println("Soil Sensor 1 abnormal reading!");
  }

  if (soil2 < 0 || soil2 > 4095) {
    Serial.println("Soil Sensor 2 abnormal reading!");
  }

  if (soil3 < 0 || soil3 > 4095) {
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

  Serial.print("Soil Sensor 1: ");
  Serial.println(soil1);

  Serial.print("Soil Sensor 2: ");
  Serial.println(soil2);

  Serial.print("Soil Sensor 3: ");
  Serial.println(soil3);

  Serial.print("Light Intensity: ");
  Serial.print(light);
  Serial.println(" lux");

  // -------- CREATE JSON PAYLOAD --------

  String payload = "{";
  payload += "\"temperature\":" + String(temperature,2) + ",";
  payload += "\"humidity\":" + String(humidity,2) + ",";
  payload += "\"soil1\":" + String(soil1) + ",";
  payload += "\"soil2\":" + String(soil2) + ",";
  payload += "\"soil3\":" + String(soil3) + ",";
  payload += "\"light\":" + String(light,2);
  payload += "}";

  Serial.println("Publishing JSON:");
  Serial.println(payload);

  // -------- SEND TO MQTT --------

  client.publish(topic, payload.c_str());

  Serial.println("Data published to MQTT");

  // -------- SAMPLING INTERVAL --------
  delay(5000);   // 5 seconds sampling
}