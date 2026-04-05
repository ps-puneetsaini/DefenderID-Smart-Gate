/*
 * RFID Module — RC522 via SPI
 * Reads card UID and returns it as a hex string.
 *
 * Wiring (RC522 → ESP32):
 *   SDA  → GPIO5  (RFID_SS_PIN)
 *   SCK  → GPIO18
 *   MOSI → GPIO23
 *   MISO → GPIO19
 *   IRQ  → (not connected)
 *   GND  → GND
 *   RST  → GPIO22 (RFID_RST_PIN)
 *   3.3V → 3.3V  ⚠️ Do NOT connect to 5V!
 */

#include <SPI.h>
#include <MFRC522.h>

MFRC522 mfrc522(RFID_SS_PIN, RFID_RST_PIN);

void rfidSetup() {
  SPI.begin();
  mfrc522.PCD_Init();
  Serial.println("📡 RFID RC522 initialized");
  Serial.print("RFID firmware version: ");
  mfrc522.PCD_DumpVersionToSerial();
}

// Returns UID as uppercase hex string (e.g. "A1B2C3D4"), or "" if no card present
String rfidRead() {
  if (!mfrc522.PICC_IsNewCardPresent()) return "";
  if (!mfrc522.PICC_ReadCardSerial())  return "";

  String uid = "";
  for (byte i = 0; i < mfrc522.uid.size; i++) {
    if (mfrc522.uid.uidByte[i] < 0x10) uid += "0";
    uid += String(mfrc522.uid.uidByte[i], HEX);
  }
  uid.toUpperCase();

  mfrc522.PICC_HaltA();
  mfrc522.PCD_StopCrypto1();

  Serial.println("📡 RFID UID read: " + uid);
  return uid;
}
