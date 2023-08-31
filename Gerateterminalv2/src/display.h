#include <Adafruit_GFX.h>
#include <Adafruit_ST7789.h>
#include "jpdecoder/TJpg_Decoder.h"

#include <SPI.h>

extern String geraet;
extern bool isMQTTConnected();
extern int checkWifi();
#define LED_PIN 4
#define DIMM_INTERVAL 30000  // 5 Minuten
#define LED_PWM_HIGH 240
#define LED_PWM_LOW 30
#define TFT_DC 21
#define TFT_CS 22
#define TFT_RESET 17  // Optional -1 to disable
// VSPI ->MOSI 23, MISO 19, CLK 18 ändern in initTFT()
// HSPI ->MOSI 13, MISO 12, CLK 14
Adafruit_ST7789 *tft = NULL;
// ts
#include <XPT2046_Touchscreen.h>
#define TS_CS 16
int16_t x, y, z;
bool is_touched = false;
XPT2046_Touchscreen ts(TS_CS);

int displayStatus = 0;
int lastDisplayStatus = -1;
long timestampLastChange = millis();
unsigned long debounceTouch = millis();
/* 0-> Status Log
 * 1-> Start Bildschirm
 * 2-> CardInfo
 * 3-> Gerät Info
 */

// Funktionen
void initTFT() {
    analogWrite(LED_PIN, LED_PWM_HIGH);
    tft = new Adafruit_ST7789(TFT_CS, TFT_DC, TFT_RESET);
    tft->init(240, 320);
    // tft->setSPISpeed(40000000);
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
    if (!ts.begin()) {
        bootLogTFT("STMPE not found!");
        delay(5000);
        ESP.restart();
    }
    ts.setRotation(1);
}

bool onDecode(int16_t x, int16_t y, uint16_t w, uint16_t h, uint16_t *bitmap) {
    tft->drawRGBBitmap(x, y, bitmap, w, h);
    return 1;
}

// TODO: Name und alle Einweisungen des Terminals
void showCardInfo() {
    if (lastDisplayStatus != displayStatus) {
        lastDisplayStatus = displayStatus;
        tft->fillRect(0, 25, 319, 239, ST77XX_BLACK);
        tft->setCursor(0, 46);
        tft->setTextSize(3);
        tft->setTextColor(ST77XX_WHITE);
        tft->print("Einweisung: ");
        if (einweisung == -1) {
            tft->setTextColor(ST77XX_RED);
        } else {
            tft->setTextColor(ST77XX_GREEN);
        }
        tft->println(einweisung);
        tft->setTextColor(ST77XX_WHITE);
        tft->print("Sicherheitsbelehrung: ");
        if (sicherheitsbelehrung == -1) {
            tft->setTextColor(ST77XX_RED);
        } else {
            tft->setTextColor(ST77XX_GREEN);
        }
        tft->println(sicherheitsbelehrung);
    }
    if (is_touched) {
        displayStatus = 1;
        is_touched = false;
    }
}

void handleTouh() {
    //Nur alle 300ms akzeptieren
    if (millis() - debounceTouch < 300) {
        if (ts.touched()) {
            debounceTouch = millis();
        }
        return;
    }
    if (ts.touched()) {
        is_touched = true;
        TS_Point p = ts.getPoint();
        x = map(p.x, 3850, 180, 0, 320);
        y = map(p.y, 3850, 180, 0, 240);
        z = p.z;
        Serial.print("->(");
        Serial.print(x);
        Serial.print(", ");
        Serial.print(y);
        Serial.print(", ");
        Serial.print(z);
        Serial.println(")");
        if (z < 1000) {
            is_touched = false;
            return;
        }
        debounceTouch = millis();
        timestampLastChange = millis();
    } else {
        is_touched = false;
    }
}

void displayStatusBar() {
    // Fill Top
    uint16_t color = ST77XX_WHITE;
    tft->fillRect(0, 0, 319, 25, color);
    // Draw Name
    tft->setCursor(3, 3);
    color = ST77XX_BLACK;
    tft->setTextSize(2);
    tft->setTextColor(color);
    tft->print(geraet);
    // Draw MQTT
    tft->setCursor(145, 3);
    if (isMQTTConnected()) {
        color = ST77XX_GREEN;
    } else {
        color = ST77XX_RED;
    }
    tft->setTextColor(color);
    tft->print("MQTT");

    // Draw Time
    color = ST77XX_BLACK;
    time_t now = time(nullptr);
    struct tm timeinfo;
    localtime_r(&now, &timeinfo);
    tft->setCursor(195, 3);
    tft->setTextColor(color);
    tft->print(timeinfo.tm_hour);
    tft->print(":");
    if (timeinfo.tm_min < 10) {
        tft->print(0);
    }
    tft->print(timeinfo.tm_min);
    // Draw Wifi
    int srenth = checkWifi();
    if (srenth) {
        if (srenth > -60) {
            color = ST77XX_GREEN;
        } else {
            color = ST77XX_YELLOW;
        }
    } else {
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
    // Clear draw bereich
    if (ausgewahltesGerat == -1 ||ausgewahltesGerat >= docc["maschines"].size()) {
        showCardInfo();
    } else if (lastDisplayStatus != displayStatus) {
        const char *nameC = docc["maschines"][i]["name"];
        char imgC[25] = "/";
        strcat(imgC, docc["maschines"][i]["img"]);
        const char *costC = docc["maschines"][i]["cost"];
        lastDisplayStatus = displayStatus;
        int xText = 110;
        tft->fillRect(0, 25, 319, 239, ST77XX_BLACK);
        TJpgDec.drawFsJpg(0, 30, imgC, LittleFS);  // Bild in groß imgNamesBig[ausgewahltesGerat]
        tft->setCursor(xText, 30);
        tft->setTextSize(3);
        tft->setTextColor(ST77XX_WHITE);
        tft->println(nameC);  // Schreibe namen names[ausgewahltesGerat]
        tft->setTextSize(2);
        tft->setCursor(xText, tft->getCursorY());
        tft->print("Kosten:");  // GeräteKosten
        tft->println(costC);    // -> Varriable costs[ausgewahltesGerat]
        tft->setCursor(0, 140);
        tft->println("Halte deine Karte vor das");
        tft->println("Terminal um das Geraet");
        tft->println("freizuschalten.");
    }
    /*
    tft->print("Einweisung: ");
    tft->println(einweisung);
    tft->print("Sicherheitsbelehrung: ");
    tft->println(sicherheitsbelehrung);
    */
    // Wenn in benutzung von wem und seit wann
    // Wenn nicht, dann "Halte deine Karte vor das Terminal um das Gerät zu aktiviren"
    // Zurück displayStatus = 1; ausgewahltesGerat = -1;
    if (is_touched) {
        displayStatus = 1;
        is_touched = false;
    }
}

void showOK(int i) {
    // Clear draw bereich
    if (lastDisplayStatus != displayStatus) {
        const char *nameC = docc["maschines"][i]["name"];
        char imgC[25] = "/";
        strcat(imgC, docc["maschines"][i]["img"]);
        const char *costC = docc["maschines"][i]["cost"];
        lastDisplayStatus = displayStatus;
        int xText = 110;
        tft->fillRect(0, 25, 319, 239, ST77XX_BLACK);
        TJpgDec.drawFsJpg(0, 30, imgC, LittleFS);  // Bild in groß imgNamesBig[ausgewahltesGerat]
        tft->setCursor(xText, 30);
        tft->setTextSize(3);
        tft->setTextColor(ST77XX_WHITE);
        tft->println(nameC);  // Schreibe namen names[ausgewahltesGerat]
        tft->setTextSize(2);
        tft->setCursor(xText, tft->getCursorY());
        tft->print("Kosten:");  // GeräteKosten
        tft->println(costC);    // -> Varriable costs[ausgewahltesGerat]
        tft->setCursor(0, 140);
        tft->setTextSize(4);
        tft->setTextColor(ST77XX_BLACK, ST77XX_GREEN);
        tft->print(" Freigegeben ");  // TODO: Testen ob es passt
    }
    if (is_touched) {
        displayStatus = 1;
        is_touched = false;
    }
}

void dimmDisplay() {
    if (is_touched) {
        if (millis() - timestampLastChange >= DIMM_INTERVAL) {  // TODO: Funktioniert noch nicht, touch geht durch
            is_touched = false;
            debounceTouch = millis();
        }
        timestampLastChange = millis();
    }
    if (lastDisplayStatus != displayStatus) {
        timestampLastChange = millis();
    }
    if (millis() - timestampLastChange >= DIMM_INTERVAL) {
        analogWrite(LED_PIN, LED_PWM_LOW);
    } else {
        analogWrite(LED_PIN, LED_PWM_HIGH);
    }
}

void handleTouchInput() {
    if (is_touched) {
        is_touched = false;
        if (y > 30) {
            displayStatus = 3;
            if (x < 100) {
                if (y < 130) {
                    ausgewahltesGerat = 0;
                } else {
                    ausgewahltesGerat = 1;
                }
            } else if (x < 200) {
                if (y < 130) {
                    ausgewahltesGerat = 2;
                } else {
                    ausgewahltesGerat = 3;
                }
            } else {
                if (y < 130) {
                    ausgewahltesGerat = 4;
                } else {
                    ausgewahltesGerat = 5;
                }
            }
        }
    }
}

uint16_t convertColorStringToUint16(const char* colorString) {
  // Check if the string starts with '#'
  if (colorString[0] == '#') {
    // Convert the substring after '#' to an integer value
    uint32_t colorValue = strtoul(&colorString[1], NULL, 16);
    
    // Extract the individual color components (R, G, B)
    uint8_t red = (colorValue >> 16) & 0xFF;
    uint8_t green = (colorValue >> 8) & 0xFF;
    uint8_t blue = colorValue & 0xFF;
    
    // Combine the color components into a 16-bit RGB565 value
    uint16_t rgb565 = ((red & 0xF8) << 8) | ((green & 0xFC) << 3) | (blue >> 3);
    
    return rgb565;
  }
  
  return 0; // Return 0 if the string is not in the expected format
}


void showMenu() {
    tft->fillRect(0, 25, 319, 239, ST77XX_WHITE);
    JsonArray array = docc["maschines"].as<JsonArray>();
    int countter = 0;
    int xKords[] = {0, 0, 100, 100, 200, 200};
    int yKords[] = {30, 120, 30, 120, 30, 120};
    for (JsonVariant v : array) {
        char imgC[25] = "/";
        strcat(imgC, v["img"]);
        if (imgC[0] == '#') {
            tft->drawRect(xKords[countter], yKords[countter], 100, 100, convertColorStringToUint16(imgC));
        } else {
            TJpgDec.drawFsJpg(xKords[countter], yKords[countter], imgC, LittleFS);
        }
        int16_t x1, y1;
        uint16_t w, h;
        // if text is to long, reduce text size
        if (v["name"].as<String>().length() > 10) {
            tft->setTextSize(1);
        } else {
            tft->setTextSize(2);
        }
        tft->setCursor(xKords[countter], yKords[countter]);
        tft->setTextColor(ST77XX_WHITE, ST77XX_BLACK);
        tft->println(v["name"].as<String>());
        tft->setTextSize(1);
        if (docc["maschines"][countter]["activestart"] != 0) {
            tft->setTextColor(ST77XX_BLACK, ST77XX_GREEN);
            tft->setCursor(xKords[countter], yKords[countter] + 40);
            tft->print(" Freigegeben ");
            //unsigned long tm = v["activestart"].as<unsigned long>();
            //tft->print((millis() - tm)/1000/60);
            //tft->print(" Minuten");
        } else {
            tft->setTextColor(ST77XX_BLACK, ST77XX_RED);
            tft->setCursor(xKords[countter], yKords[countter] + 50);
            tft->println("Nicht Freigegeben");
        }
        countter++;
    }
}

void handleDisplayMenue() {
    dimmDisplay();
    if (displayStatus == 1) {
        ausgewahltesGerat = -1;
        bool skipDraw = lastDisplayStatus == displayStatus;
        handleTouchInput();
        if (!skipDraw) {
            lastDisplayStatus = displayStatus;
            showMenu();
        }
    }
    if (displayStatus == 2) {
        showCardInfo();
    }
    if (displayStatus == 3) {
        showUnit(ausgewahltesGerat);
    }
    if (displayStatus == 4) {
        showOK(ausgewahltesGerat);
    }
}