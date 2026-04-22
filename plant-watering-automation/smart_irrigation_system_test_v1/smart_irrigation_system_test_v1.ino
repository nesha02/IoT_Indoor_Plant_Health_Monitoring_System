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

  // Turn everything OFF
  digitalWrite(PUMP, HIGH);
  digitalWrite(VALVE1, HIGH);
  digitalWrite(VALVE2, HIGH);
  digitalWrite(VALVE3, HIGH);

  delay(3000); // settle time

  // ===== TEST VALVE 1 =====
  Serial.println("Testing Valve 1");

  digitalWrite(VALVE1, LOW);   // Open valve 1
  delay(1000);

  digitalWrite(PUMP, LOW);     // Pump ON
  delay(2000);                 // Run for 2 sec

  digitalWrite(PUMP, HIGH);    // Pump OFF
  delay(500);

  digitalWrite(VALVE1, HIGH);  // Close valve 1
  delay(3000);


  // ===== TEST VALVE 2 =====
  Serial.println("Testing Valve 2");

  digitalWrite(VALVE2, LOW);
  delay(1000);

  digitalWrite(PUMP, LOW);
  delay(2000);

  digitalWrite(PUMP, HIGH);
  delay(500);

  digitalWrite(VALVE2, HIGH);
  delay(3000);


  // ===== TEST VALVE 3 =====
  Serial.println("Testing Valve 3");

  digitalWrite(VALVE3, LOW);
  delay(1000);

  digitalWrite(PUMP, LOW);
  delay(2000);

  digitalWrite(PUMP, HIGH);
  delay(500);

  digitalWrite(VALVE3, HIGH);

  Serial.println("Test complete");
}

void loop() {
  // nothing
}