#include <SPI.h>
#include <Adafruit_GFX.h>
#include <Adafruit_ILI9341.h>
#include <TJpg_Decoder.h>
extern String geraet;
extern bool isMQTTConnected();
extern int checkWifi();
#define TFT_DC 21
#define TFT_CS 22
#define TFT_RESET 17// Optional -1 to disable
//VSPI ->MOSI 23, MISO 19, CLK 18 ändern in initTFT()
//HSPI ->MOSI 13, MISO 12, CLK 14
SPIClass * vspi = NULL;
Adafruit_ILI9341 * tft = NULL;
int displayStatus = 0;
/* 0-> Status Log
 * 1-> Start Bildschirm
 * 2-> CardInfo
 * 3-> Gerät Info
*/
// Touch
#include "Adafruit_STMPE610.h"
#define STMPE_CS 16
uint16_t x, y;
uint8_t z;
bool is_touched = false;
Adafruit_STMPE610 touch = Adafruit_STMPE610(STMPE_CS);

//Funktionen
void initTFT() {
  vspi = new SPIClass(VSPI);
  vspi->begin();
  tft = new Adafruit_ILI9341(vspi, TFT_DC, TFT_CS, TFT_RESET);
  tft->begin();
  tft->setRotation(0);
  tft->fillScreen(ILI9341_BLACK);
  tft->setCursor(0, 0);
  tft->setTextColor(ILI9341_WHITE);
}

void bootLogTFT(String s) {
  Serial.println(s);
  tft->println(s);
}

void initTouch() {
  if (! touch.begin()) {
    bootLogTFT("STMPE not found!");
    while(1);
  }
}

bool onDecode(int16_t x, int16_t y, uint16_t w, uint16_t h, uint16_t* bitmap) {
  tft->drawRGBBitmap(x,y, bitmap, w, h);
  return 1;
}

//TODO: Name und alle Einweisungen des Terminals
void showCardInfo(){
  tft->fillRect(0,25,319,239, ILI9341_BLACK);
  tft->setCursor(0, 26);
  tft->setTextSize(3);
  tft->setTextColor(ILI9341_WHITE);
  tft->print("Einweisung: ");
  tft->println(einweisung);
  tft->print("Sicherheitsbelehrung: ");
  tft->println(sicherheitsbelehrung);
  if (is_touched) {
    displayStatus = 1;
  }
}


void handleTouh() {
  if (touch.touched()) {
    is_touched = true;
    while (! touch.bufferEmpty()) {
        Serial.print(touch.bufferSize());
        touch.readData(&x, &y, &z);
        Serial.print("->("); 
        Serial.print(x); Serial.print(", "); 
        Serial.print(y); Serial.print(", "); 
        Serial.print(z);
        Serial.println(")");
    }
  } else {
    is_touched= false;
  }
}


void displayStatusBar() {
  //Fill Top
  uint16_t color = ILI9341_WHITE;
  tft->fillRect(0,0,319,25, color);
  //Draw Name
  tft->setCursor(3, 3);
  color = ILI9341_BLACK;
  tft->setTextSize(2);
  tft->setTextColor(color);
  tft->print(geraet);
  //Draw MQTT
  tft->setCursor(155, 3);
  if (isMQTTConnected()) {
    color = ILI9341_GREEN;
  } else {
    color = ILI9341_RED;
  }
  tft->setTextColor(color);
  tft->print("MQTT");
  
  //Draw Time
  color = ILI9341_BLACK;
  time_t now = time(nullptr);
  struct tm *tmp;
  gmtime_r(&now, tmp);
  tft->setCursor(203, 3);
  tft->setTextColor(color);
  tft->print(tmp->tm_hour);
  tft->print(":");
  tft->print(tmp->tm_min);
  //Draw Wifi
  int srenth = checkWifi();
  if (srenth) {
    if (srenth < -50) {
      color = ILI9341_GREEN;
    }else {
      color = ILI9341_YELLOW;
    }
  }else {
    color = ILI9341_RED;
  }
  tft->setCursor(257, 3);
  tft->setTextColor(color);
  tft->print(srenth);
  tft->print("db");
  int ofsetX = 306;
  int ofsetY = 0;
  tft->drawLine(ofsetX + 0,ofsetY + 7,ofsetX + 4,ofsetY + 3, color);
  tft->drawLine(ofsetX + 4,ofsetY + 3,ofsetX + 7,ofsetY + 3, color);
  tft->drawLine(ofsetX + 7,ofsetY + 3,ofsetX + 11,ofsetY + 7, color);

  tft->drawLine(ofsetX + 2,ofsetY + 8,ofsetX + 4,ofsetY + 6, color);
  tft->drawLine(ofsetX + 4,ofsetY + 6,ofsetX + 7,ofsetY + 6, color);
  tft->drawLine(ofsetX + 7,ofsetY + 6,ofsetX + 9,ofsetY + 8, color);

  tft->drawRect(ofsetX + 5,ofsetY + 9,2,2, color);
}

void showUnit(int i) {
  //Clear draw bereich
  //Schreibe namen
  // GeräteKosten
  // Bild in groß
  // Wenn in benutzung von wem und seit wann
  // Wenn nicht, dann "Halte deine Karte vor das Terminal um das Gerät zu aktiviren"
  // Zurück displayStatus = 1; ausgewahltesGerat = -1;
}

void handleDisplayMenue() {
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
      tft->fillRect(0,25,319,239, ILI9341_WHITE);
      TJpgDec.drawFsJpg(0,30, "test.jpg");
      TJpgDec.drawFsJpg(0,130, "test.jpg");
      TJpgDec.drawFsJpg(100,30, "test.jpg");
      TJpgDec.drawFsJpg(100,130, "test.jpg");
      TJpgDec.drawFsJpg(200,30, "test.jpg");
      TJpgDec.drawFsJpg(200,130, "test.jpg");
    }
  }
  if (displayStatus == 2) {// Card info
    showCardInfo();
  }
  if (displayStatus == 3) {// Gerät info
    showUnit(ausgewahltesGerat);
  }
}
