#include <SPI.h>
#include <Adafruit_GFX.h>
#include <Adafruit_ST7789.h>
#include <TJpg_Decoder.h>
extern String geraet;
extern bool isMQTTConnected();
extern int checkWifi();
#define TFT_DC 21
#define TFT_CS 22
#define TFT_RESET 17// Optional -1 to disable
//VSPI ->MOSI 23, MISO 19, CLK 18 ändern in initTFT()
//HSPI ->MOSI 13, MISO 12, CLK 14
Adafruit_ST7789 * tft = NULL;
int displayStatus = 0;
int lastDisplayStatus = -1;
/* 0-> Status Log
 * 1-> Start Bildschirm
 * 2-> CardInfo
 * 3-> Gerät Info
*/
// ts
#include <XPT2046_Touchscreen.h>
#define TS_CS 16
int16_t x, y, z;
bool is_touched = false;
XPT2046_Touchscreen ts(TS_CS);

//Funktionen
void initTFT() {
  tft = new Adafruit_ST7789(TFT_CS, TFT_DC, TFT_RESET);
  tft->init(240, 320);
  //tft->setSPISpeed(40000000);
  tft->invertDisplay(false);
  tft->setRotation(1);
  tft->fillScreen(ST77XX_BLACK);
  tft->setCursor(0, 0);
  tft->setTextColor(ST77XX_WHITE);
}

void bootLogTFT(String s) {
  Serial.println(s);
  tft->println(s);
}

void initTouch() {
  if (! ts.begin()) {
    bootLogTFT("STMPE not found!");
    while(1);
  }
  ts.setRotation(1);
}

bool onDecode(int16_t x, int16_t y, uint16_t w, uint16_t h, uint16_t* bitmap) {
  tft->drawRGBBitmap(x,y, bitmap, w, h);
  return 1;
}

//TODO: Name und alle Einweisungen des Terminals
void showCardInfo(){
  tft->fillRect(0,25,319,239, ST77XX_BLACK);
  tft->setCursor(0, 26);
  tft->setTextSize(3);
  tft->setTextColor(ST77XX_WHITE);
  tft->print("Einweisung: ");
  tft->println(einweisung);
  tft->print("Sicherheitsbelehrung: ");
  tft->println(sicherheitsbelehrung);
  if (is_touched) {
    displayStatus = 1;
  }
}


void handleTouh() {
  if (ts.touched()) {
    is_touched = true;
    TS_Point p = ts.getPoint();
    x = p.x;
    y = p.y;
    z = p.z;
        Serial.print("->("); 
        Serial.print(x); Serial.print(", "); 
        Serial.print(y); Serial.print(", "); 
        Serial.print(z);
        Serial.println(")");
  } else {
    is_touched= false;
  }
}


void displayStatusBar() {
  //Fill Top
  uint16_t color = ST77XX_WHITE;
  tft->fillRect(0,0,319,25, color);
  //Draw Name
  tft->setCursor(3, 3);
  color = ST77XX_BLACK;
  tft->setTextSize(2);
  tft->setTextColor(color);
  tft->print(geraet);
  //Draw MQTT
  tft->setCursor(140, 3);
  if (isMQTTConnected()) {
    color = ST77XX_GREEN;
  } else {
    color = ST77XX_RED;
  }
  tft->setTextColor(color);
  tft->print("MQTT");
  
  //Draw Time
  color = ST77XX_BLACK;
  time_t now = time(nullptr);
  struct tm timeinfo;
  gmtime_r(&now, &timeinfo);
  tft->setCursor(195, 3);
  tft->setTextColor(color);
  tft->print(timeinfo.tm_hour);
  tft->print(":");
  if (timeinfo.tm_min<10) {
    tft->print(0);
  }
  tft->print(timeinfo.tm_min);
  //Draw Wifi
  int srenth = checkWifi();
  if (srenth) {
    if (srenth < -50) {
      color = ST77XX_GREEN;
    }else {
      color = ST77XX_YELLOW;
    }
  }else {
    color = ST77XX_RED;
  }
  tft->setCursor(260, 3);
  tft->setTextColor(color);
  tft->print(srenth);
  tft->print("db");
  /*
  int ofsetX = 306;
  int ofsetY = 0;
  tft->drawLine(ofsetX + 0,ofsetY + 7,ofsetX + 4,ofsetY + 3, color);
  tft->drawLine(ofsetX + 4,ofsetY + 3,ofsetX + 7,ofsetY + 3, color);
  tft->drawLine(ofsetX + 7,ofsetY + 3,ofsetX + 11,ofsetY + 7, color);

  tft->drawLine(ofsetX + 2,ofsetY + 8,ofsetX + 4,ofsetY + 6, color);
  tft->drawLine(ofsetX + 4,ofsetY + 6,ofsetX + 7,ofsetY + 6, color);
  tft->drawLine(ofsetX + 7,ofsetY + 6,ofsetX + 9,ofsetY + 8, color);

  tft->drawRect(ofsetX + 5,ofsetY + 9,2,2, color);*/
}

void showUnit(int i) {
  //Clear draw bereich
  //Schreibe namen
  // GeräteKosten
  // Bild in groß
  // Wenn in benutzung von wem und seit wann
  // Wenn nicht, dann "Halte deine Karte vor das Terminal um das Gerät zu aktiviren"
  // Zurück displayStatus = 1; ausgewahltesGerat = -1;
  if (is_touched) {
    displayStatus = 1;
  }
}

void handleDisplayMenue() {
  if (lastDisplayStatus == displayStatus) {
    return;
  }
  if (displayStatus == 1) {// Menue
    ausgewahltesGerat = -1;
    bool skipDraw = false;
    if (is_touched){
      is_touched = false;
      if (y>30) {//Reagiere
        skipDraw = true;
        displayStatus = 3;
        if (x<100) {
          if (y<130) {
            //Gerät 1
            ausgewahltesGerat = 0;
          }else {
            //Gerät 2
            ausgewahltesGerat = 1;
          }
        }else if (y<200) {
          if (y<130) {
            //Gerät 3
            ausgewahltesGerat = 2;
          }else {
            //Gerät 4
            ausgewahltesGerat = 3;
          }
        }else {
          if (y<130) {
            //Gerät 5
            ausgewahltesGerat = 4;
          }else {
            //Gerät 6
            ausgewahltesGerat = 5;
          }
        }
      }
      //react to image
    }
    if (!skipDraw) {
      tft->fillRect(0,25,319,239, ST77XX_WHITE);
      TJpgDec.drawFsJpg(0,30, "/Heldenhelfer.jpg", LittleFS);
      TJpgDec.drawFsJpg(0,130, "/test.jpg", LittleFS);
      TJpgDec.drawFsJpg(100,30, "/test.jpg", LittleFS);
      TJpgDec.drawFsJpg(100,130, "/test.jpg", LittleFS);
      TJpgDec.drawFsJpg(200,30, "/test.jpg", LittleFS);
      TJpgDec.drawFsJpg(200,130, "/test.jpg", LittleFS);
    }
  }
  if (displayStatus == 2) {// Card info
    showCardInfo();
  }
  if (displayStatus == 3) {// Gerät info
    showUnit(ausgewahltesGerat);
  }
  lastDisplayStatus = displayStatus;
}
