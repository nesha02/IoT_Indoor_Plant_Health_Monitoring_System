#define VALVE1 26
#define VALVE2 27
#define VALVE3 14

void setup() {
  Serial.begin(115200);

  pinMode(VALVE1, OUTPUT);
  pinMode(VALVE2, OUTPUT);
  pinMode(VALVE3, OUTPUT);

  digitalWrite(VALVE1, HIGH);
  digitalWrite(VALVE2, HIGH);
  digitalWrite(VALVE3, HIGH);
}

void loop() {
  Serial.println("Valve 1");
  digitalWrite(VALVE1, LOW);   // ON
  delay(3000);
  digitalWrite(VALVE1, HIGH);  // OFF
  delay(2000);

  Serial.println("Valve 2");
  digitalWrite(VALVE2, LOW);
  delay(3000);
  digitalWrite(VALVE2, HIGH);
  delay(2000);

  Serial.println("Valve 3");
  digitalWrite(VALVE3, LOW);
  delay(3000);
  digitalWrite(VALVE3, HIGH);
  delay(3000);
}