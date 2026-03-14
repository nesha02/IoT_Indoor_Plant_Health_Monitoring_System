#include <Wire.h>
#include <BH1750.h>

BH1750 lightMeter;

void setup() {
  Serial.begin(115200);
  Wire.begin(21, 22);

  if (lightMeter.begin()) {
    Serial.println("BH1750 sensor initialized");
  } else {
    Serial.println("Error initializing BH1750");
  }
}

void loop() {
  float lux = lightMeter.readLightLevel();

  Serial.print("Light: ");
  Serial.print(lux);
  Serial.println(" lux");

  delay(2000);
}