#include "DHT.h"
#include <Wire.h>
#include <BH1750.h>

#define DHTPIN 19
#define DHTTYPE DHT22

// Soil sensor pins
#define SOIL_PIN1 35
#define SOIL_PIN2 34
#define SOIL_PIN3 32

DHT dht(DHTPIN, DHTTYPE);
BH1750 lightMeter;

void setup() {

  Serial.begin(115200);

  dht.begin();

  Wire.begin(21, 22);   // SDA, SCL for ESP32
  lightMeter.begin();

  Serial.println("Combined Sensor Test Starting...");
}

void loop() {

  // Read DHT
  float humidity = dht.readHumidity();
  float temperature = dht.readTemperature();

  // Read Soil Sensors
  int soil1 = analogRead(SOIL_PIN1);
  int soil2 = analogRead(SOIL_PIN2);
  int soil3 = analogRead(SOIL_PIN3);

  // Read Light Sensor
  float lux = lightMeter.readLightLevel();

  Serial.println("------------");

  // Print Temperature & Humidity
  if (isnan(humidity) || isnan(temperature)) {
    Serial.println("DHT Read Error!");
  } 
  else {

    Serial.print("Temperature: ");
    Serial.print(temperature);
    Serial.println(" °C");

    Serial.print("Humidity: ");
    Serial.print(humidity);
    Serial.println(" %");
  }

  // Soil sensors
  Serial.print("Soil Sensor 1: ");
  Serial.println(soil1);

  Serial.print("Soil Sensor 2: ");
  Serial.println(soil2);

  Serial.print("Soil Sensor 3: ");
  Serial.println(soil3);

  // Light sensor
  Serial.print("Light Intensity: ");
  Serial.print(lux);
  Serial.println(" lux");

  delay(2000);
}