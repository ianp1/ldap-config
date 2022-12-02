#include <Wire.h>
#include <Adafruit_PN532.h>
#define PN532_SS 25
extern void bootLogTFT(String s);
extern void checkCard(String content);
Adafruit_PN532 nfc(PN532_SS);

void initCard() {
  nfc.begin();
  uint32_t versiondata = nfc.getFirmwareVersion();
  if (! versiondata) {
    bootLogTFT("Didn't find PN53x board");
    while (1); // halt
  }
  bootLogTFT("Found chip PN5" + String((versiondata>>24) & 0xFF, HEX)); 
  bootLogTFT("Firmware ver. " + String((versiondata>>16) & 0xFF, DEC) + '.' + String((versiondata>>8) & 0xFF, DEC));
  nfc.SAMConfig();
}

boolean readTag(){
 boolean varRet = false;
  uint8_t success;
  uint8_t uid[] = { 0, 0, 0, 0, 0, 0, 0 };  // Buffer to store the returned UID
  uint8_t uidLength;                        // Length of the UID (4 or 7 bytes depending on ISO14443A card type)
  success = nfc.readPassiveTargetID(PN532_MIFARE_ISO14443A, uid, &uidLength, 10);//Warte 10 ms auf eine neue Karte
  if (success) {
    varRet = true;
    Serial.println("Found an ISO14443A card");
    Serial.print("  UID Length: ");Serial.print(uidLength, DEC);Serial.println(" bytes");
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
        checkCard(content);
      }
      lastCardReadTimestamp = millis();
  }
  return varRet;
}
