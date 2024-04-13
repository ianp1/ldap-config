#include <JPEGDecoder.h>  // JPEGDecoder-Bibliothek für das Dekodieren des JPEG
#include <SPI.h>
#include <TFT_eSPI.h>

extern int checkWifi();

TFT_eSPI tft = TFT_eSPI();
bool tft_output(int16_t x, int16_t y, uint16_t w, uint16_t h, uint16_t *bitmap) {
    if (y >= tft.height()) return 0;
    tft.pushImage(x, y, w, h, bitmap);
    return 1;
}

uint16_t x = 0, y = 0;  // To store the touch coordinates
bool pressed = false;
int displayStatus = 0;
int lastDisplayStatus = -1;
long timestampLastChange = 0;
/* 0-> Status Log
 * 1-> Start Bildschirm
 * 2-> CardInfo
 * 3-> Gerät Info
 * 4-> Error
 */

// Funktionen
void initTFT() {
    // Initialise the TFT
    tft.begin();
    tft.setRotation(3);
    tft.setSwapBytes(true);
    tft.invertDisplay(false);
    tft.setTextFont(1);
    tft.setTextColor(0xFFFF, 0x0000);
    tft.fillScreen(TFT_BLACK);
    tft.fillScreen(TFT_BLACK);
    tft.setCursor(0, 0);
    tft.setTextColor(TFT_WHITE);
}

// Funktion zum Anzeigen eines JPEG-Bildes von einer URL
void displayJPEGFromURL(String url) {
    // TODO Prüfen ob Bild schon im Speicher ist, wenn nicht, dann runterladen, wenn doch, dann rendern
    HTTPClient http;
    http.begin(url);  // Beginne die HTTP-Anfrage

    int httpCode = http.GET();  // Starte die GET-Anfrage

    // Prüfe den HTTP-Statuscode
    if (httpCode == HTTP_CODE_OK) {
        // Hole den Stream
        WiFiClient *stream = http.getStreamPtr();
        // TODO Render Image
        // https://github.com/Bodmer/TFT_eSPI/blob/master/examples/Generic/ESP32_SDcard_jpeg/ESP32_SDcard_jpeg.ino
    } else {
        Serial.println("Bild konnte nicht geladen werden. HTTP-Anfrage fehlgeschlagen.");
    }

    http.end();  // Beende die HTTP-Sitzung
}

void bootLogTFT(String s) {
    Serial.println(s);
    tft.println(s);
}

// TODO: Name und alle Einweisungen des Terminals
void showCardInfo() {
    if (lastDisplayStatus != displayStatus) {
        lastDisplayStatus = displayStatus;
        tft.fillRect(0, 18, 319, 239, TFT_BLACK);
        tft.setCursor(0, 39);
        tft.setTextFont(4);
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
        if (Machine::safetyInstructionDate == 0) {
            tft.setTextColor(TFT_RED);
        } else {
            tft.setTextColor(TFT_GREEN);
        }
        tft.println(Machine::safetyInstructionDate);
    }
    if (pressed) {
        displayStatus = 1;
        pressed = false;
    }
}

void handleTouh() {
    // debounce
    if (millis() - timestampLastChange >= 200) {
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
}

void displayStatusBar() {
    // Fill Top
    uint16_t color = TFT_WHITE;
    tft.fillRect(0, 0, 319, 18, color);
    // Draw Name
    tft.setCursor(3, 1);
    color = TFT_BLACK;
    tft.setTextFont(2);
    tft.setTextColor(color);
    tft.print(terminalName);
    // Draw MQTT
    /*tft.setCursor(145, 3);
    if (true) {
        color = TFT_GREEN;
    } else {
        color = TFT_RED;
    }
    tft.setTextColor(color);
    tft.print("MQTT");*/

    // Draw Time
    color = TFT_BLACK;
    time_t now = time(nullptr);
    struct tm timeinfo;
    gmtime_r(&now, &timeinfo);
    tft.setCursor(190, 1);
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
    tft.setCursor(255, 1);
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
        // const char *nameC = docc["maschines"][i]["name"];
        // char imgC[25] = "/";
        // strcat(imgC, docc["maschines"][i]["img"]);
        // const char *costC = docc["maschines"][i]["cost"];
        lastDisplayStatus = displayStatus;
        int xText = 0;
        tft.fillRect(0, 18, 320, 230, TFT_BLACK);
        // TJpgDec.drawFsJpg(0, 30, imgC, LittleFS);  // Bild in groß imgNamesBig[ausgewahltesGerat]
        tft.setCursor(xText, 27);
        tft.setTextFont(4);
        tft.setTextColor(TFT_WHITE);
        tft.println(Machine::machines[i].name);  // Schreibe namen names[ausgewahltesGerat]
        tft.setTextFont(4);
        tft.setCursor(xText, tft.getCursorY());
        tft.print("Kosten:");                    // GeräteKosten
        tft.println(Machine::machines[i].cost);  // -> Varriable costs[ausgewahltesGerat]
        tft.print("Einweisung am:");
        if (einweisung == -1) {
            tft.setTextColor(TFT_RED);
        } else {
            tft.setTextColor(TFT_GREEN);
        }
        tft.println(Machine::formatDate(Machine::machines[i].safetyInstructionDate));
        tft.setTextColor(TFT_WHITE);
        tft.print("Sicherheitsbl:");
        if (Machine::safetyInstructionDate == 0) {
            tft.setTextColor(TFT_RED);
        } else {
            tft.setTextColor(TFT_GREEN);
        }
        tft.println(Machine::formatDate(Machine::safetyInstructionDate));
        // tft.setCursor(0, 150);
        tft.setTextColor(TFT_WHITE);
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

void bitteWarten() {
    tft.setTextFont(4);  // 6
    tft.fillScreen(TFT_SILVER);
    tft.setCursor(0, 80);
    tft.setTextColor(TFT_WHITE, TFT_SILVER);
    tft.println(" Bitte Warten");
    displayStatusBar();
}

void showError() {
    tft.setTextFont(4);  // 6;
    tft.fillScreen(TFT_SILVER);
    tft.setCursor(0, 80);
    tft.setTextColor(TFT_WHITE, TFT_SILVER);
    tft.println(" Fehler ");
    displayStatusBar();
    delay(5000);
}

void showOK(int i) {
    // Clear draw bereich
    if (lastDisplayStatus != displayStatus) {
        // const char *nameC = docc["maschines"][i]["name"];
        // char imgC[25] = "/";
        // strcat(imgC, docc["maschines"][i]["img"]);
        // const char *costC = docc["maschines"][i]["cost"];
        lastDisplayStatus = displayStatus;
        int xText = 110;
        tft.fillRect(0, 18, 319, 239, TFT_BLACK);
        // TJpgDec.drawFsJpg(0, 30, imgC, LittleFS);  // Bild in groß imgNamesBig[ausgewahltesGerat]
        tft.setCursor(xText, 30);
        tft.setTextFont(4);
        tft.setTextColor(TFT_WHITE);
        tft.println(Machine::machines[i].name);  // Schreibe namen names[ausgewahltesGerat]
        tft.setTextFont(2);
        tft.setCursor(xText, tft.getCursorY());
        tft.print("Kosten:");                    // GeräteKosten
        tft.println(Machine::machines[i].cost);  // -> Varriable costs[ausgewahltesGerat]
        tft.setCursor(0, 140);
        tft.setTextFont(4);  // 6;
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
        if (millis() - timestampLastChange >= 10000) {  // TODO: Funktioniert noch nicht, touch geht durch
            pressed = false;
        }
        timestampLastChange = millis();
    }
    if (lastDisplayStatus != displayStatus) {
        timestampLastChange = millis();
    }
    if (millis() - timestampLastChange >= 10000) {
        analogWrite(TFT_BL, 100);
    } else {
        analogWrite(TFT_BL, 240);
    }
}

void handleTouchInput() {
    // Unten Recgts: 21, 231
    // Oben Links (319, 30)
    if (pressed && Machine::machineCount > 0) {
        pressed = false;
        if (y < 222) {
            displayStatus = 3;
            if (y < 22) {
                ausgewahltesGerat = 4;
            } else if(y < 72) {
                ausgewahltesGerat = 3;
            } else if (y < 122) {
                ausgewahltesGerat = 2;
            } else if (y < 172) {
                ausgewahltesGerat = 1;
            } else {
                ausgewahltesGerat = 0;
            }
        }
    } else {
        ausgewahltesGerat = -1;
        displayStatus = 1;
    }
}

void showMenu() {
    tft.fillRect(0, 18, 319, 239, TFT_WHITE);
    int countter = 0;
    int xKords[] = {0, 0, 0, 0, 0, 0};
    int yKords[] = {18, 18 + 50, 18 + 100, 18 + 150, 18 + 200, 218};
    if (Machine::machineCount > 2) {
    } else if (Machine::machineCount == 2) {
    } else if (Machine::machineCount == 1) {
    } else if (Machine::machineCount == 0 && lastCardRead == "") {
        tft.setTextFont(4);  // 6;
        tft.fillScreen(TFT_SILVER);
        tft.setCursor(0, 80);
        tft.setTextColor(TFT_WHITE, TFT_SILVER);
        tft.println(" Bitte Karte scannen");
        displayStatusBar();
        return;
    } else {
        tft.setTextFont(4);  // 6;
        tft.fillScreen(TFT_SILVER);
        tft.setCursor(0, 60);
        tft.setTextColor(TFT_WHITE, TFT_SILVER);
        tft.println("Keine Gerate");
        displayStatusBar();
        return;
    }
    uint16_t colors[] = {TFT_RED, TFT_ORANGE, TFT_YELLOW, TFT_GREEN, TFT_BLUE, TFT_PURPLE};
    for (int i = 0; i < Machine::machineCount; i++) {
        // char imgC[25] = "/";
        // strcat(imgC, v["img"]);
        // TJpgDec.drawFsJpg(xKords[countter], yKords[countter], imgC, LittleFS);
        tft.setTextFont(4);
        tft.fillRect(xKords[countter], yKords[countter], 320, 48, colors[i]);
        tft.setCursor(xKords[countter], yKords[countter]);
        tft.setTextColor(TFT_WHITE, colors[i]);
        // Maximal 17 Zeichen
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
    if (displayStatus == 5) {
        showError();
        displayStatus = 1;
    }
}