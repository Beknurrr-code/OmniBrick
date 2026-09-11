/**
 * ==============================================================================
 * BRAIN BRICK — PHYSICAL ESP32 ROBOT FIRMWARE (v1.0.0)
 * ==============================================================================
 * Shipathon 2026 / Next Gen Award
 * Creator: Beknur (15 y.o., Astana)
 * 
 * Hardware Requirements:
 * - ESP32 DevKit V1 (30 or 38 pins)
 * - Dual H-Bridge Motor Driver (TB6612FNG or L298N)
 * - 2x DC Gear Motors (Differential Drive)
 * - Ultrasonic Distance Sensor (HC-SR04 or HC-SR04P)
 * - 2S Li-Ion Battery Pack (7.4V) with 5V step-down regulator
 * 
 * Protocol:
 * - Bluetooth Low Energy (BLE) GATT Server
 * - Service UUID:        19b10000-e8f2-537e-4f6c-d104768a1214
 * - Command Char (Write): 19b10001-e8f2-537e-4f6c-d104768a1214
 * - Telemetry (Notify):  19b10002-e8f2-537e-4f6c-d104768a1214
 * ==============================================================================
 */

#include <Arduino.h>
#include <BLEDevice.h>
#include <BLEServer.h>
#include <BLEUtils.h>
#include <BLE2902.h>
#include <ArduinoJson.h> // Ensure ArduinoJson v6 or v7 is installed

// ─── PIN DEFINITIONS ───
// Left Motor (M1)
#define PIN_M1_PWM  25
#define PIN_M1_IN1  26
#define PIN_M1_IN2  27

// Right Motor (M2)
#define PIN_M2_PWM  14
#define PIN_M2_IN1  12
#define PIN_M2_IN2  13

// Ultrasonic Distance Sensor (HC-SR04)
#define PIN_TRIG    5
#define PIN_ECHO    18

// Status LED (Onboard Blue LED)
#define PIN_STATUS_LED 2

// Battery Voltage ADC (via voltage divider 10k/10k)
#define PIN_BATTERY 34

// ─── BLE UUID CONSTANTS ───
#define SERVICE_UUID           "19b10000-e8f2-537e-4f6c-d104768a1214"
#define CHARACTERISTIC_UUID_RX "19b10001-e8f2-537e-4f6c-d104768a1214"
#define CHARACTERISTIC_UUID_TX "19b10002-e8f2-537e-4f6c-d104768a1214"

// ─── GLOBALS ───
BLEServer* pServer = nullptr;
BLECharacteristic* pTxCharacteristic = nullptr;
bool deviceConnected = false;
bool oldDeviceConnected = false;

// Motor speeds (-100 to 100)
int currentSpeedM1 = 0;
int currentSpeedM2 = 0;
unsigned long motorDeadline = 0;
unsigned long lastCommandTime = 0;
const unsigned long WATCHDOG_TIMEOUT_MS = 1500; // Auto-halt if phone disconnects

// ─── MOTOR DRIVER FUNCTIONS ───
void initMotors() {
  pinMode(PIN_M1_IN1, OUTPUT);
  pinMode(PIN_M1_IN2, OUTPUT);
  pinMode(PIN_M1_PWM, OUTPUT);

  pinMode(PIN_M2_IN1, OUTPUT);
  pinMode(PIN_M2_IN2, OUTPUT);
  pinMode(PIN_M2_PWM, OUTPUT);

  // Configure ESP32 LEDC PWM
  ledcAttach(PIN_M1_PWM, 20000, 8); // 20kHz, 8-bit resolution (0..255)
  ledcAttach(PIN_M2_PWM, 20000, 8);
}

void setLeftMotor(int speed) {
  speed = constrain(speed, -100, 100);
  currentSpeedM1 = speed;
  int pwmVal = map(abs(speed), 0, 100, 0, 255);

  if (speed > 0) {
    digitalWrite(PIN_M1_IN1, HIGH);
    digitalWrite(PIN_M1_IN2, LOW);
  } else if (speed < 0) {
    digitalWrite(PIN_M1_IN1, LOW);
    digitalWrite(PIN_M1_IN2, HIGH);
  } else {
    digitalWrite(PIN_M1_IN1, LOW);
    digitalWrite(PIN_M1_IN2, LOW);
  }
  ledcWrite(PIN_M1_PWM, pwmVal);
}

void setRightMotor(int speed) {
  speed = constrain(speed, -100, 100);
  currentSpeedM2 = speed;
  int pwmVal = map(abs(speed), 0, 100, 0, 255);

  if (speed > 0) {
    digitalWrite(PIN_M2_IN1, HIGH);
    digitalWrite(PIN_M2_IN2, LOW);
  } else if (speed < 0) {
    digitalWrite(PIN_M2_IN1, LOW);
    digitalWrite(PIN_M2_IN2, HIGH);
  } else {
    digitalWrite(PIN_M2_IN1, LOW);
    digitalWrite(PIN_M2_IN2, LOW);
  }
  ledcWrite(PIN_M2_PWM, pwmVal);
}

void haltAllMotors() {
  setLeftMotor(0);
  setRightMotor(0);
  motorDeadline = 0;
}

// ─── ULTRASONIC SENSOR ───
int readUltrasonicDistanceCm() {
  digitalWrite(PIN_TRIG, LOW);
  delayMicroseconds(2);
  digitalWrite(PIN_TRIG, HIGH);
  delayMicroseconds(10);
  digitalWrite(PIN_TRIG, LOW);

  long duration = pulseIn(PIN_ECHO, HIGH, 25000); // 25ms timeout (~400cm)
  if (duration <= 0) return 999;
  int distanceCm = duration * 0.034 / 2;
  return constrain(distanceCm, 2, 400);
}

// ─── BATTERY LEVEL ───
int readBatteryPercentage() {
  int raw = analogRead(PIN_BATTERY);
  // Assuming 2S Li-ion (6.4V empty .. 8.4V full) with voltage divider
  float voltage = (raw / 4095.0) * 3.3 * 2.0; 
  int pct = map((int)(voltage * 100), 640, 840, 0, 100);
  return constrain(pct, 10, 100);
}

// ─── COMMAND PARSER (JSON) ───
void parseIncomingCommand(const String& jsonStr) {
  StaticJsonDocument<256> doc;
  DeserializationError error = deserializeJson(doc, jsonStr);
  if (error) {
    Serial.print("JSON Parse Error: ");
    Serial.println(error.c_str());
    return;
  }

  lastCommandTime = millis();
  const char* cmd = doc["cmd"] | "";

  if (strcmp(cmd, "DIFF_DRIVE") == 0) {
    int m1 = doc["m1"] | 0;
    int m2 = doc["m2"] | 0;
    unsigned long duration = doc["time"] | 1000;

    setLeftMotor(m1);
    setRightMotor(m2);
    motorDeadline = millis() + duration;
    Serial.printf("Actuating M1: %d%%, M2: %d%% for %lums\n", m1, m2, duration);
  }
  else if (strcmp(cmd, "TURN") == 0) {
    int deg = doc["deg"] | 45;
    const char* dir = doc["dir"] | "right";
    unsigned long turnTime = (deg * 1000) / 90; // Calibrated ~1 sec per 90 deg

    if (strcmp(dir, "left") == 0) {
      setLeftMotor(-60);
      setRightMotor(60);
    } else {
      setLeftMotor(60);
      setRightMotor(-60);
    }
    motorDeadline = millis() + turnTime;
  }
  else if (strcmp(cmd, "HALT") == 0) {
    haltAllMotors();
    Serial.println("EMERGENCY HALT EXECUTED");
  }
}

// ─── BLE CALLBACKS ───
class ServerCallbacks : public BLEServerCallbacks {
  void onConnect(BLEServer* pServer) {
    deviceConnected = true;
    digitalWrite(PIN_STATUS_LED, HIGH);
    Serial.println(">>> OmniBrick Mobile Connected!");
  }

  void onDisconnect(BLEServer* pServer) {
    deviceConnected = false;
    digitalWrite(PIN_STATUS_LED, LOW);
    haltAllMotors();
    Serial.println("<<< Disconnected! Safety halt engaged.");
  }
};

class CommandCallbacks : public BLECharacteristicCallbacks {
  void onWrite(BLECharacteristic* pCharacteristic) {
    String rxValue = pCharacteristic->getValue();
    if (rxValue.length() > 0) {
      rxValue.trim();
      Serial.print("BLE RX: ");
      Serial.println(rxValue);
      parseIncomingCommand(rxValue);
    }
  }
};

// ─── SETUP ───
void setup() {
  Serial.begin(115200);
  Serial.println("Starting OmniBrick Robot OS v1.0.0...");

  pinMode(PIN_STATUS_LED, OUTPUT);
  pinMode(PIN_TRIG, OUTPUT);
  pinMode(PIN_ECHO, INPUT);
  initMotors();

  // Initialize BLE
  BLEDevice::init("OmniBrick-Rover");
  pServer = BLEDevice::createServer();
  pServer->setCallbacks(new ServerCallbacks());

  BLEService* pService = pServer->createService(SERVICE_UUID);

  // Command RX Characteristic
  BLECharacteristic* pRxCharacteristic = pService->createCharacteristic(
    CHARACTERISTIC_UUID_RX,
    BLECharacteristic::PROPERTY_WRITE | BLECharacteristic::PROPERTY_WRITE_NR
  );
  pRxCharacteristic->setCallbacks(new CommandCallbacks());

  // Telemetry TX Characteristic
  pTxCharacteristic = pService->createCharacteristic(
    CHARACTERISTIC_UUID_TX,
    BLECharacteristic::PROPERTY_NOTIFY
  );
  pTxCharacteristic->addDescriptor(new BLE2902());

  pService->start();

  // Start BLE Advertising
  BLEAdvertising* pAdvertising = BLEDevice::getAdvertising();
  pAdvertising->addServiceUUID(SERVICE_UUID);
  pAdvertising->setScanResponse(true);
  pAdvertising->setMinPreferred(0x06);
  pAdvertising->setMinPreferred(0x12);
  BLEDevice::startAdvertising();

  Serial.println("BLE Advertising active as 'OmniBrick-Rover'. Waiting for phone link...");
}

// ─── MAIN LOOP (20Hz TELEMETRY + WATCHDOG) ───
void loop() {
  unsigned long now = millis();

  // 1. Motor Duration Timeout
  if (motorDeadline > 0 && now >= motorDeadline) {
    haltAllMotors();
  }

  // 2. Safety Watchdog: Halt if no command received for >1500ms while active
  if ((currentSpeedM1 != 0 || currentSpeedM2 != 0) && (now - lastCommandTime > WATCHDOG_TIMEOUT_MS)) {
    Serial.println("Watchdog trigger: Link timeout, stopping actuators.");
    haltAllMotors();
  }

  // 3. Fast Hardware Reflex: Obstacle emergency braking (<18cm)
  int distanceCm = readUltrasonicDistanceCm();
  if (distanceCm < 18 && (currentSpeedM1 > 0 || currentSpeedM2 > 0)) {
    Serial.println("Obstacle reflex triggered! Emergency stop.");
    haltAllMotors();
  }

  // 4. Send Telemetry at ~20Hz (every 50ms)
  static unsigned long lastTelemTime = 0;
  if (deviceConnected && (now - lastTelemTime >= 50)) {
    lastTelemTime = now;

    StaticJsonDocument<192> telemDoc;
    telemDoc["battery"] = readBatteryPercentage();
    telemDoc["sonar"] = distanceCm;
    telemDoc["m1_spd"] = currentSpeedM1;
    telemDoc["m2_spd"] = currentSpeedM2;

    String telemStr;
    serializeJson(telemDoc, telemStr);

    pTxCharacteristic->setValue((uint8_t*)telemStr.c_str(), telemStr.length());
    pTxCharacteristic->notify();
  }

  // Handle Disconnection Re-advertising
  if (!deviceConnected && oldDeviceConnected) {
    delay(500);
    pServer->startAdvertising();
    Serial.println("Restarting BLE advertising...");
    oldDeviceConnected = deviceConnected;
  }
  if (deviceConnected && !oldDeviceConnected) {
    oldDeviceConnected = deviceConnected;
  }

  delay(10);
}
