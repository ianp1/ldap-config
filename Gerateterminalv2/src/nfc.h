#include <Wire.h>
#include <Adafruit_PN532.h>
#include "makercardHTTP.h"
#define PN532_SS 25
#define PN532_RST 27
extern void bootLogTFT(String s);
extern void checkCard(String content);
//TODO: RESET einbauen, über Pin
Adafruit_PN532 nfc(PN532_SS);

void initCard() {
  nfc.begin();
  delay(1000);
  uint32_t versiondata = nfc.getFirmwareVersion();
  delay(1000);
  bool suc = nfc.SAMConfig();
  if (! versiondata) {
    bootLogTFT("Didn't find PN53x board");
    delay(1000);
    ESP.restart();
  }
  bootLogTFT("Found chip PN5" + String((versiondata>>24) & 0xFF, HEX)); 
  bootLogTFT("Firmware ver. " + String((versiondata>>16) & 0xFF, DEC) + '.' + String((versiondata>>8) & 0xFF, DEC));
  bootLogTFT(String("NFC INIT: " + String(suc)));
  while (!suc) {
    bootLogTFT("NFC Error: Restart");
    delay(1000);
    ESP.restart();
  }
}

boolean readTag(){
 boolean varRet = false;
  uint8_t success;
  uint8_t uid[] = { 0, 0, 0, 0, 0, 0, 0 };  // Buffer to store the returned UID
  uint8_t uidLength;                        // Length of the UID (4 or 7 bytes depending on ISO14443A card type)
  success = nfc.readPassiveTargetID(PN532_MIFARE_ISO14443A, uid, &uidLength, 50);//Warte 500 ms auf eine neue Karte
  if (success) {
    timestampLastChange = millis();
    varRet = true;
    //Serial.println("Found an ISO14443A card");
    //Serial.print("  UID Length: ");Serial.print(uidLength, DEC);Serial.println(" bytes");
    Serial.print("  UID Value: ");
    nfc.PrintHex(uid, uidLength);
    Serial.println("");
    String content= "";
      for (byte i = 0; i < uidLength; i++) 
      {
        if (i != 0) {
          content.concat(String(uid[i] < 0x10 ? "_0" : "_"));
        } else {
          content.concat(String(uid[i] < 0x10 ? "0" : ""));
        }
        content.concat(String(uid[i], HEX));
      }
      content.toUpperCase();
      Serial.println("Card read:" + content);
      Serial.println("Last card read: " + lastCardRead);
      if (lastCardRead != content) {
        lastCardRead = content;
        Machine::loadMachines(content);
        //checkCard(content);
      }
      lastCardReadTimestamp = millis();
  }
  return varRet;
}
