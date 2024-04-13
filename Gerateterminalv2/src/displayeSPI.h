#include <SPI.h>
#include <TFT_eSPI.h>
#include <JPEGDecoder.h>       // JPEGDecoder-Bibliothek für das Dekodieren des JPEG


extern int checkWifi();

TFT_eSPI tft = TFT_eSPI();
bool tft_output(int16_t x, int16_t y, uint16_t w, uint16_t h, uint16_t *bitmap) {
    if (y >= tft.height()) return 0;
    tft.pushImage(x, y, w, h, bitmap);
    return 1;
}

uint16_t x = 0, y = 0; // To store the touch coordinates
bool pressed = false;
int displayStatus = 0;
int lastDisplayStatus = -1;
long timestampLastChange = 0;
/* 0-> Status Log
 * 1-> Start Bildschirm
 * 2-> CardInfo
 * 3-> Gerät Info
 */

// Funktionen
void initTFT() {
    // Initialise the TFT
    tft.begin();
    tft.setTextColor(0xFFFF, 0x0000);
    tft.fillScreen(TFT_BLACK);
    tft.setSwapBytes(true);
    
    tft.invertDisplay(false);
    tft.setRotation(1);
    tft.fillScreen(TFT_BLACK);
    tft.setCursor(0, 0);
    tft.setTextColor(TFT_WHITE);
}

// Funktion zum Anzeigen eines JPEG-Bildes von einer URL
void displayJPEGFromURL(String url) {
    // TODO Prüfen ob Bild schon im Speicher ist, wenn nicht, dann runterladen, wenn doch, dann rendern
  HTTPClient http;
  http.begin(url); // Beginne die HTTP-Anfrage

  int httpCode = http.GET(); // Starte die GET-Anfrage

  // Prüfe den HTTP-Statuscode
  if (httpCode == HTTP_CODE_OK) {
    // Hole den Stream
    WiFiClient *stream = http.getStreamPtr();
    // TODO Render Image
    //https://github.com/Bodmer/TFT_eSPI/blob/master/examples/Generic/ESP32_SDcard_jpeg/ESP32_SDcard_jpeg.ino
  } else {
    Serial.println("Bild konnte nicht geladen werden. HTTP-Anfrage fehlgeschlagen.");
  }

  http.end(); // Beende die HTTP-Sitzung
}

void bootLogTFT(String s) {
    Serial.println(s);
    tft.println(s);
}

// TODO: Name und alle Einweisungen des Terminals
void showCardInfo() {
    if (lastDisplayStatus != displayStatus) {
        lastDisplayStatus = displayStatus;
        tft.fillRect(0, 25, 319, 239, TFT_BLACK);
        tft.setCursor(0, 46);
        tft.setTextSize(3);
        tft.setTextColor(TFT_WHITE);
        tft.print("Einweisung: ");
        if (einweisung == -1) {
            tft.setTextColor(TFT_RED);
        } else {
            tft.setTextColor(TFT_GREEN);
        }
        tft.println(einweisung);
        tft.setTextColor(TFT_WHITE);
        tft.print("Sicherheitsbelehrung: ");
        if (sicherheitsbelehrung == -1) {
            tft.setTextColor(TFT_RED);
        } else {
            tft.setTextColor(TFT_GREEN);
        }
        tft.println(sicherheitsbelehrung);
    }
    if (pressed) {
        displayStatus = 1;
        pressed = false;
    }
}

void handleTouh() {

  // Pressed will be set true is there is a valid touch on the screen
  pressed = tft.getTouch(&x, &y);
    if (pressed) {
        Serial.print("->(");
        Serial.print(x);
        Serial.print(", ");
        Serial.print(y);
        Serial.println(")");
        timestampLastChange = millis();
    }
}

void displayStatusBar() {
    // Fill Top
    uint16_t color = TFT_WHITE;
    tft.fillRect(0, 0, 319, 25, color);
    // Draw Name
    tft.setCursor(3, 3);
    color = TFT_BLACK;
    tft.setTextSize(2);
    tft.setTextColor(color);
    tft.print("Hallo");
    // Draw MQTT
    tft.setCursor(145, 3);
    if (true) {
        color = TFT_GREEN;
    } else {
        color = TFT_RED;
    }
    tft.setTextColor(color);
    tft.print("MQTT");

    // Draw Time
    color = TFT_BLACK;
    time_t now = time(nullptr);
    struct tm timeinfo;
    gmtime_r(&now, &timeinfo);
    tft.setCursor(195, 3);
    tft.setTextColor(color);
    tft.print(timeinfo.tm_hour);
    tft.print(":");
    if (timeinfo.tm_min < 10) {
        tft.print(0);
    }
    tft.print(timeinfo.tm_min);
    // Draw Wifi
    int srenth = checkWifi();
    if (srenth) {
        if (srenth > -60) {
            color = TFT_GREEN;
        } else {
            color = TFT_YELLOW;
        }
    } else {
        color = TFT_RED;
    }
    tft.setCursor(260, 3);
    tft.setTextColor(color);
    tft.print(srenth);
    tft.print("db");
    /*
    int ofsetX = 306;
    int ofsetY = 0;
    tft.drawLine(ofsetX + 0,ofsetY + 7,ofsetX + 4,ofsetY + 3, color);
    tft.drawLine(ofsetX + 4,ofsetY + 3,ofsetX + 7,ofsetY + 3, color);
    tft.drawLine(ofsetX + 7,ofsetY + 3,ofsetX + 11,ofsetY + 7, color);

    tft.drawLine(ofsetX + 2,ofsetY + 8,ofsetX + 4,ofsetY + 6, color);
    tft.drawLine(ofsetX + 4,ofsetY + 6,ofsetX + 7,ofsetY + 6, color);
    tft.drawLine(ofsetX + 7,ofsetY + 6,ofsetX + 9,ofsetY + 8, color);

    tft.drawRect(ofsetX + 5,ofsetY + 9,2,2, color);*/
}

void showUnit(int i) {
    // Clear draw bereich
    if (ausgewahltesGerat == -1) {
        showCardInfo();
    } else if (lastDisplayStatus != displayStatus) {
        const char *nameC = docc["maschines"][i]["name"];
        char imgC[25] = "/";
        strcat(imgC, docc["maschines"][i]["img"]);
        const char *costC = docc["maschines"][i]["cost"];
        lastDisplayStatus = displayStatus;
        int xText = 110;
        tft.fillRect(0, 25, 319, 239, TFT_BLACK);
        //TJpgDec.drawFsJpg(0, 30, imgC, LittleFS);  // Bild in groß imgNamesBig[ausgewahltesGerat]
        tft.setCursor(xText, 30);
        tft.setTextSize(3);
        tft.setTextColor(TFT_WHITE);
        tft.println(nameC);  // Schreibe namen names[ausgewahltesGerat]
        tft.setTextSize(2);
        tft.setCursor(xText, tft.getCursorY());
        tft.print("Kosten:");  // GeräteKosten
        tft.println(costC);    // -> Varriable costs[ausgewahltesGerat]
        tft.setCursor(0, 140);
        tft.println("Halte deine Karte vor das");
        tft.println("Terminal um das Geraet");
        tft.println("freizuschalten.");
    }
    /*
    tft.print("Einweisung: ");
    tft.println(einweisung);
    tft.print("Sicherheitsbelehrung: ");
    tft.println(sicherheitsbelehrung);
    */
    // Wenn in benutzung von wem und seit wann
    // Wenn nicht, dann "Halte deine Karte vor das Terminal um das Gerät zu aktiviren"
    // Zurück displayStatus = 1; ausgewahltesGerat = -1;
    if (pressed) {
        displayStatus = 1;
        pressed = false;
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
        tft.fillRect(0, 25, 319, 239, TFT_BLACK);
        //TJpgDec.drawFsJpg(0, 30, imgC, LittleFS);  // Bild in groß imgNamesBig[ausgewahltesGerat]
        tft.setCursor(xText, 30);
        tft.setTextSize(3);
        tft.setTextColor(TFT_WHITE);
        tft.println(nameC);  // Schreibe namen names[ausgewahltesGerat]
        tft.setTextSize(2);
        tft.setCursor(xText, tft.getCursorY());
        tft.print("Kosten:");  // GeräteKosten
        tft.println(costC);    // -> Varriable costs[ausgewahltesGerat]
        tft.setCursor(0, 140);
        tft.setTextSize(4);
        tft.setTextColor(TFT_BLACK, TFT_GREEN);
        tft.print(" Freigegeben ");  // TODO: Testen ob es passt
    }
    if (pressed) {
        displayStatus = 1;
        pressed = false;
    }
}

void dimmDisplay() {
    if (pressed) {
        if (millis() - timestampLastChange >= 50000) {  // TODO: Funktioniert noch nicht, touch geht durch
            pressed = false;
        }
        timestampLastChange = millis();
    }
    if (lastDisplayStatus != displayStatus) {
        timestampLastChange = millis();
    }
    if (millis() - timestampLastChange >= 50000) {
        analogWrite(TFT_BL, 240);
    } else {
        analogWrite(TFT_BL, 200);
    }
}

void handleTouchInput() {
    if (pressed) {
        pressed = false;
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

void showMenu() {
    tft.fillRect(0, 25, 319, 239, TFT_WHITE);
     int countter = 0;
    int xKords[] = {0, 0, 100, 100, 200, 200};
    int yKords[] = {30, 130, 30, 130, 30, 130};
    if (Machine::machineCount>2) {
    } else if (Machine::machineCount == 2) {
    } else if (Machine::machineCount == 1) {
    } else {
        tft.setTextSize(5);
        tft.setCursor(0, 60);
        tft.setTextColor(TFT_WHITE, TFT_BLACK);
        tft.println("Leider hast du Keine Einweisungen für dieses Terminal");
        return;
    }

    for (int i; i< Machine::machineCount;i++) {
        //char imgC[25] = "/";
        //strcat(imgC, v["img"]);
        //TJpgDec.drawFsJpg(xKords[countter], yKords[countter], imgC, LittleFS);
        tft.setTextSize(1);
        tft.setCursor(xKords[countter], yKords[countter]);
        tft.setTextColor(TFT_WHITE, TFT_BLACK);
        tft.println(Machine::getMachines()[i].name);
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