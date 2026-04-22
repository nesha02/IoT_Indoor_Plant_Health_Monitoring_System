#define PUMP 25
#define VALVE1 26
#define VALVE2 27
#define VALVE3 14

void setup() {
  Serial.begin(115200);
  pinMode(PUMP, OUTPUT);
  pinMode(VALVE1, OUTPUT);
  pinMode(VALVE2, OUTPUT);
  pinMode(VALVE3, OUTPUT);

  digitalWrite(PUMP, HIGH);
  digitalWrite(VALVE1, HIGH);
  digitalWrite(VALVE2, HIGH);
  digitalWrite(VALVE3, HIGH);
}

void loop() {
  Serial.println("IN1");
  digitalWrite(PUMP, LOW);
  delay(1500);
  digitalWrite(PUMP, HIGH);
  delay(1000);

  Serial.println("IN2");
  digitalWrite(VALVE1, LOW);
  delay(1500);
  digitalWrite(VALVE1, HIGH);
  delay(1000);

  Serial.println("IN3");
  digitalWrite(VALVE2, LOW);
  delay(1500);
  digitalWrite(VALVE2, HIGH);
  delay(1000);

  Serial.println("IN4");
  digitalWrite(VALVE3, LOW);
  delay(1500);
  digitalWrite(VALVE3, HIGH);
  delay(2000);
}