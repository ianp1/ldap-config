//New Terminal, by Marco with TFT
#include <Arduino.h>
#define CONFIG_LITTLEFS_SPIFFS_COMPAT 1
int ausgewahltesGerat = -1;// Index der Config geräte
int einweisung = 0;// Wie lnge eine Einweisung noch vorhanden ist
int sicherheitsbelehrung = 0;// Wie lange eine Sicherheitsbelehrung noch vorhanden ist
long cardSendTimestamp = 0;//Wann die MQTT nachricht der Karte gesendet wurde
long lastStatusUpdate = 0;
String lastCardRead = "";// ID der letzten Karte
long lastCardReadTimestamp = 0;// Wann das letzte mal eine Karte gelesen wurde
long mqttDisconnectedTimestamp = 0;// Wann der MQTT teil die verbindung verloren hat
// Filesystem
#include "FS.h"
#include <LittleFS.h>
//TFT
#include "display.h"
// WLAN/OTA/time
#include "wlan.h"
// MQTT
#include "mqttteil.h"
// Cardreader
#include "nfc.h"
// Funktionen

//TODO: ersetzen durch frische Config
void initFilsystem() {
  //Load file system information
  if (!LittleFS.begin(true)) {
    bootLogTFT("An error has occured while initializing littlefs");
  }

  File file = LittleFS.open("/device.txt", "r");
  if (!file) {
    bootLogTFT("Failed to open file device.txt");
    geraet = "Drucker";
  }
  geraet = "";
  char c;
  while (file.available()) {
    c = file.read();
    geraet += c;
  }

    mqttChannel = "";
  file = LittleFS.open("/mqttchannel.txt", "r");
  while (file.available()) {
    c = file.read();
    mqttChannel += c;
  }
  mqttChannelCard = mqttChannel + "/card";

  mqttUser = "";
  file = LittleFS.open("/mqttuser.txt", "r");
  while (file.available()) {
    c = file.read();
    mqttUser += c;
  }
  mqttPassword = "";
  file = LittleFS.open("/mqttpw.txt", "r");
  while (file.available()) {
    c = file.read();
    mqttPassword += c;
  }
  bootLogTFT("finished reading filesystem information");
  bootLogTFT(geraet);
  bootLogTFT(mqttChannel);
  bootLogTFT(mqttUser);
  bootLogTFT(mqttPassword);
}

//TODO: implementieren, auch serverseitig
void getConfig() {
  //Download new Config as JSON

  // Save images to filesystem
  /*
  for (int c = 0; c<jsonlänge;c++) {
    if (!LittleFS.exists(jsonImages[c])) {
      File f = LittleFS.open("/" + jsonImages[c], "w");
      if (f){
        http.begin(wifiClient, jsonImagesURL[c]);
        
      }
    }
  }*/
}

void setup() {
  //Init Serial
  Serial.begin(115200);
  Serial.println("ESP32 Startet");
  // Init display + Touch
  initTFT();
  bootLogTFT("Display Initialisiert");
  // init filesystem
  initFilsystem();
  bootLogTFT("Filsystem Initialisiert");
  // init wlan
  initWlan();
  // Init OTA
  initOTA();
  //set Time
  initTime();
  // Download Config
  //getConfig();
  //    JSON Alle angeschlossenen Geräte
  // connect to mqtt
  //initMQTT();
  // Start Touch
  initTouch();
  handleTouh();
  // init cardreader
  initCard();
  // init Images
  TJpgDec.setCallback(onDecode);
  displayStatus = 1;// Menue
}

//TODO: Config Geräte namen mit auswahl an ausgewahltesGerat
//TODO: Wenn status der Maschine angeschaltet, dann ausschalten -> Eventuell erst abfrage einbauen
void checkCard(String content) {
  mqttClient.publish(mqttChannelCard, ("{\"terminalMac\": \""+WiFi.macAddress()+"\",\"machine\": \""+geraet+"\",\"rfid\": \""+content+"\"}").c_str());
  cardSendTimestamp = millis();
}

void loop() {
  //Chck Wlan connection and reconnect
  checkWifi();
  //MQTT Get Device state and Update time and User
  //checkMQTT();
  //Touch on Device, switch to Image and Menue(Frischalten/Freigeben, Sperren, Kosten Info, Zurück)-> bestätigung durch Karte
  handleTouh();
  //Check card -> New Card -> Display Name Einweisungen kompatible und Sicherheitsbelehrung.(zurück Button)
  boolean isCard =  readTag();
  if (lastCardReadTimestamp + 10000 < millis() && !isCard) {//Keine Karte seit 10 Sekunden
    // Karte weg
    if (displayStatus == 2) {
      displayStatus = 1;
    }
  }
  handleDisplayMenue();
  ArduinoOTA.handle();
  //Display signal strenth, MQTT Status, Zeit, Name
  if (millis() > lastStatusUpdate + 1000) {
    displayStatusBar();
    lastStatusUpdate = millis();
  }
}
