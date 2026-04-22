#define PUMP 25

void setup() {
  Serial.begin(115200);
  pinMode(PUMP, OUTPUT);

  digitalWrite(PUMP, HIGH); // OFF
  delay(2000);              // wait before starting

  Serial.println("Pump ON");
  digitalWrite(PUMP, LOW);  // ON
  delay(2000);              // run 2 sec

  Serial.println("Pump OFF");
  digitalWrite(PUMP, HIGH); // OFF
}

void loop() {
  // do nothing
}