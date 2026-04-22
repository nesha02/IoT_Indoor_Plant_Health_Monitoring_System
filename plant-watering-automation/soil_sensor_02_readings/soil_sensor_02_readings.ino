#define SOIL_PIN 34

void setup() {
  Serial.begin(115200);
}

void loop() {
  int value = analogRead(SOIL_PIN);
  Serial.println(value);
  delay(1000);
}