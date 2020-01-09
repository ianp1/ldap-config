#include <SPI.h> 
#include <MFRC522.h> 
#include <Wire.h> 
#include <LiquidCrystal_I2C.h> 
#include <Keyboard.h>


#define SS_PIN A0 
#define RST_PIN 7 

#define CLEAR_TIMEOUT 1000

LiquidCrystal_I2C lcd(0x27, 16, 2);
MFRC522 mfrc522(SS_PIN, RST_PIN);
long long last_read_rfid = 0;
String last_read_rfid_value = "";

bool showingRfid = true;


void setup() {
  //Serial.begin(9600);
  Keyboard.begin();
  lcd.init();
  lcd.backlight();
  
  SPI.begin();
  mfrc522.PCD_Init();
}


void loop() {
  if (millis() - last_read_rfid > CLEAR_TIMEOUT && showingRfid) {
    showingRfid = false;
    lcd.clear();
    last_read_rfid = millis();
    last_read_rfid_value = "";
    lcd.setCursor(0, 0);
    lcd.print("Bitte RFID-Karte");
    lcd.setCursor(0, 1);
    lcd.print(" vorhalten");
  }
  if ( ! (mfrc522.PICC_IsNewCardPresent() && mfrc522.PICC_ReadCardSerial())) {
    return;
  }
  last_read_rfid = millis();
  
  //Serial.print("ID des RFID-TAGS:");CC598C1F
  String content= "";
  for (byte i = 0; i < mfrc522.uid.size; i++) {
    if (i != 0) {
      content += char('\0'+32);
      if (mfrc522.uid.uidByte[i] < 0x10) {
        content.concat(String("0"));
      }
      //content.concat(String(mfrc522.uid.uidByte[i] < 0x10 ? 0x5F+"0" : 0x5F+""));
    }
    content.concat(String(mfrc522.uid.uidByte[i], HEX));
  }
  content.toUpperCase(); 
  /*Serial.print("read: ");
  Serial.println(content);
  Serial.print("old: ");
  Serial.println(last_read_rfid_value);  
 */
  
  if (content != last_read_rfid_value) {
    showingRfid = true;
    last_read_rfid_value = content;

    for (byte i = 0; i < content.length(); i++) {
      Keyboard.write(content[i]);
    }

    lcd.clear();
    
    lcd.setCursor(0, 0);
    lcd.print("RFID-TAG ID:"); 
    lcd.setCursor(0, 1);
    lcd.print(content);
  }
  /*
  for (byte i = 0; i < mfrc522.uid.size; i++) {
    lcd.setCursor(3 * i, 1);
    lcd.print(mfrc522.uid.uidByte[i], HEX);
    if ( i + 1 < mfrc522.uid.size) {
      lcd.print("-");
    }
    Serial.print(mfrc522.uid.uidByte[i], HEX);
    Serial.print(" ");
  }
  
  
  Serial.println();*/

}
