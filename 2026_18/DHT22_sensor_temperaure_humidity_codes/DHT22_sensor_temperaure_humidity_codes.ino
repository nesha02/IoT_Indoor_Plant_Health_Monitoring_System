#include "DHT.h"

#define DHTPIN 19        // GPIO 19
#define DHTTYPE DHT22   // DHT 22

DHT dht(DHTPIN, DHTTYPE);

void setup() {
  Serial.begin(115200);
  dht.begin();
  Serial.println("DHT22 test starting...");
}

void loop() {
  float humidity = dht.readHumidity();
  float temperature = dht.readTemperature();

  if (isnan(humidity) || isnan(temperature)) {
    Serial.println("Failed to read from DHT sensor!");
  } else {
    Serial.print("Temperature: ");
    Serial.print(temperature);
    Serial.print(" °C  |  Humidity: ");
    Serial.print(humidity);
    Serial.println(" %");
  }

  delay(2000);
}