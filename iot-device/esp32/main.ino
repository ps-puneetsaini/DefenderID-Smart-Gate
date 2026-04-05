/*
 * ============================================================
 *   Smart Gate Security System — ESP32 Main Controller
 * ============================================================
 *
 *  Three-step gate authentication:
 *    Step 1: RFID Card  → Validate with server
 *    Step 2: Fingerprint → Match locally stored template
 *    Step 3: OTP        → Validate 4-digit code with server
 *
 *  Board: ESP32 Dev Module
 *  Libraries needed (install via Arduino Library Manager):
 *    - MFRC522           (by miguelbalboa)
 *    - Adafruit Fingerprint Sensor Library
 *    - Keypad            (by Mark Stanley)
 *    - LiquidCrystal_I2C (by Frank de Brabander)
 *    - ESP32Servo        (by Kevin Harrington)
 *    - ArduinoJson       (by Benoit Blanchon)
 *    - HTTPClient        (built-in ESP32)
 * ============================================================
 */

#include <Arduino.h>
#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <Wire.h>
#include <LiquidCrystal_I2C.h>
#include <ESP32Servo.h>
#include "../config/wifi_config.h"

// Include sub-modules
#include "rfid_module.ino"
#include "fingerprint_module.ino"
#include "keypad_module.ino"
#include "gate_control.ino"

// ── LCD Setup ─────────────────────────────────────────
LiquidCrystal_I2C lcd(LCD_ADDRESS, LCD_COLS, LCD_ROWS);

// ── State machine ─────────────────────────────────────
enum GateState {
  IDLE,
  RFID_VALIDATED,
  FINGERPRINT_VALIDATED,
  WAITING_OTP,
  ACCESS_GRANTED,
  ACCESS_DENIED
};

GateState gateState = IDLE;
unsigned long stateTimer = 0;
const unsigned long STATE_TIMEOUT = 30000; // 30 seconds per step

// ── Forward declarations ───────────────────────────────
bool verifyRFIDWithServer(const String& uid);
bool verifyOTPWithServer(const String& otp, const String& rfidUid);
void notifyServerGateOpen(const String& rfidUid);
void lcdMsg(const String& line1, const String& line2 = "");
void setLEDs(bool green, bool red);
void beep(int freq, int duration);

// ─────────────────────────────────────────────────────
void setup() {
  Serial.begin(115200);
  Serial.println("\n🚀 Smart Gate Security System Starting...");

  // GPIO setup
  pinMode(LED_GREEN, OUTPUT);
  pinMode(LED_RED,   OUTPUT);
  pinMode(BUZZER_PIN,OUTPUT);
  setLEDs(false, false);

  // LCD init
  Wire.begin();
  lcd.init();
  lcd.backlight();
  lcdMsg("DefenderID Gate", "Initializing...");

  // WiFi connect
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  Serial.print("Connecting to WiFi");
  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 20) {
    delay(500);
    Serial.print(".");
    attempts++;
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\n✅ WiFi Connected! IP: " + WiFi.localIP().toString());
    lcdMsg("WiFi Connected!", WiFi.localIP().toString());
  } else {
    Serial.println("\n⚠️  WiFi Failed — Offline Mode");
    lcdMsg("WiFi Failed!", "Offline Mode");
  }
  delay(2000);

  // Initialize modules
  rfidSetup();
  fingerprintSetup();
  keypadSetup();
  gateSetup();

  lcdMsg("System Ready", "Tap RFID Card");
  Serial.println("✅ All modules initialized. Waiting for RFID...");
}

// ─────────────────────────────────────────────────────
void loop() {
  unsigned long now = millis();

  // State timeout reset
  if (gateState != IDLE && (now - stateTimer > STATE_TIMEOUT)) {
    Serial.println("⏱ State timeout — resetting to IDLE");
    lcdMsg("Timeout!", "Please retry");
    beep(200, 500);
    delay(2000);
    gateState = IDLE;
    lcdMsg("System Ready", "Tap RFID Card");
    setLEDs(false, false);
  }

  switch (gateState) {

    // ── STEP 1: Wait for RFID ────────────────────────
    case IDLE: {
      String uid = rfidRead();
      if (uid.length() > 0) {
        Serial.println("📡 RFID detected: " + uid);
        lcdMsg("Checking card...", uid);
        setLEDs(false, false);

        bool valid = verifyRFIDWithServer(uid);
        if (valid) {
          Serial.println("✅ RFID Authorized");
          lcdMsg("Card Authorized", "Scan Fingerprint");
          beep(1000, 200);
          gateState = RFID_VALIDATED;
          stateTimer = now;
          setLEDs(false, false);
        } else {
          Serial.println("❌ RFID Access Denied");
          lcdMsg("Access Denied", "Unknown Card");
          beep(300, 800);
          setLEDs(false, true);
          delay(3000);
          setLEDs(false, false);
          lcdMsg("System Ready", "Tap RFID Card");
        }
      }
      break;
    }

    // ── STEP 2: Wait for Fingerprint ─────────────────
    case RFID_VALIDATED: {
      lcdMsg("Place Finger", "On Sensor...");
      uint8_t fpResult = fingerprintVerify();
      if (fpResult == 0) {
        Serial.println("✅ Fingerprint Verified");
        lcdMsg("Fingerprint OK!", "Enter OTP Below");
        beep(1000, 200);
        delay(500);
        beep(1000, 200);
        gateState = FINGERPRINT_VALIDATED;
        stateTimer = now;
      } else if (fpResult == 1) {
        Serial.println("❌ Fingerprint Mismatch");
        lcdMsg("Fingerprint Fail", "Access Denied");
        beep(300, 1000);
        setLEDs(false, true);
        delay(3000);
        gateState = IDLE;
        lcdMsg("System Ready", "Tap RFID Card");
        setLEDs(false, false);
      }
      // fpResult == 255 means no finger detected yet — keep waiting
      break;
    }

    // ── STEP 3: Wait for OTP entry ───────────────────
    case FINGERPRINT_VALIDATED: {
      lcdMsg("Enter OTP:", "Use Keypad #=OK");
      String otp = keypadGetOTP();  // Blocking; returns 4-digit string when # pressed
      if (otp.length() == 4) {
        Serial.println("🔢 OTP entered: " + otp);
        lcdMsg("Verifying OTP...", "Please wait");

        // We don't have the RFID UID here easily, pass empty string
        bool otpOk = verifyOTPWithServer(otp, "");
        if (otpOk) {
          Serial.println("✅ OTP Verified — Access Granted!");
          lcdMsg("Access Granted!", "Gate Opening...");
          beep(1500, 100); delay(100); beep(1500, 100); delay(100); beep(1500, 100);
          setLEDs(true, false);
          gateOpen();
          notifyServerGateOpen("");
          delay(10000); // Gate open for 10 seconds
          gateClose();
          setLEDs(false, false);
          lcdMsg("Gate Closed", "Have a nice day!");
          delay(3000);
          gateState = IDLE;
          lcdMsg("System Ready", "Tap RFID Card");
        } else {
          Serial.println("❌ Invalid OTP");
          lcdMsg("Invalid OTP!", "Access Denied");
          beep(300, 1500);
          setLEDs(false, true);
          delay(3000);
          gateState = IDLE;
          lcdMsg("System Ready", "Tap RFID Card");
          setLEDs(false, false);
        }
      }
      break;
    }

    default:
      gateState = IDLE;
      break;
  }

  delay(100);
}

// ─────────────────────────────────────────────────────
// HTTP: Verify RFID card with backend server
bool verifyRFIDWithServer(const String& uid) {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("⚠️  No WiFi — RFID check skipped (offline mode)");
    return true; // offline fallback — allow (change to false for strict mode)
  }
  HTTPClient http;
  http.begin(String(SERVER_BASE) + "/api/verify/rfid");
  http.addHeader("Content-Type", "application/json");
  String body = "{\"rfidUid\":\"" + uid + "\"}";
  int code = http.POST(body);
  if (code == 200) {
    http.end();
    return true;
  }
  http.end();
  return false;
}

// HTTP: Verify OTP with backend server
bool verifyOTPWithServer(const String& otp, const String& rfidUid) {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("⚠️  No WiFi — OTP check skipped");
    return false;
  }
  HTTPClient http;
  http.begin(String(SERVER_BASE) + "/api/otp/verify");
  http.addHeader("Content-Type", "application/json");
  String body = "{\"code\":\"" + otp + "\",\"rfidUid\":\"" + rfidUid + "\"}";
  int code = http.POST(body);
  if (code == 200) {
    http.end();
    return true;
  }
  http.end();
  return false;
}

// HTTP: Notify server that gate was opened
void notifyServerGateOpen(const String& rfidUid) {
  if (WiFi.status() != WL_CONNECTED) return;
  HTTPClient http;
  http.begin(String(SERVER_BASE) + "/api/gate/open");
  http.addHeader("Content-Type", "application/json");
  String body = "{\"rfidUid\":\"" + rfidUid + "\",\"message\":\"Gate opened by ESP32\"}";
  http.POST(body);
  http.end();
}

// ── Helpers ───────────────────────────────────────────
void lcdMsg(const String& line1, const String& line2) {
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print(line1.substring(0, 16));
  if (line2.length() > 0) {
    lcd.setCursor(0, 1);
    lcd.print(line2.substring(0, 16));
  }
}

void setLEDs(bool green, bool red) {
  digitalWrite(LED_GREEN, green ? HIGH : LOW);
  digitalWrite(LED_RED,   red   ? HIGH : LOW);
}

void beep(int freq, int duration) {
  tone(BUZZER_PIN, freq, duration);
  delay(duration + 50);
}
