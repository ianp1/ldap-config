//New Terminal, by Marco with TFT
#include <Arduino.h>
#include <ArduinoJson.h>
#include <time.h>
#include <esp_sleep.h>
#include <makercardHTTP.h>
#define CONFIG_LITTLEFS_SPIFFS_COMPAT 1
int ausgewahltesGerat = -1;// Index der Config geräte
int einweisung = 0;// Wie lnge eine Einweisung noch vorhanden ist
int sicherheitsbelehrung = 0;// Wie lange eine Sicherheitsbelehrung noch vorhanden ist
long cardSendTimestamp = 0;//Wann die MQTT nachricht der Karte gesendet wurde
long lastStatusUpdate = 0;
String lastCardRead = "";// ID der letzten Karte
long lastCardReadTimestamp = 0;// Wann das letzte mal eine Karte gelesen wurde
long mqttDisconnectedTimestamp = 0;// Wann der MQTT teil die verbindung verloren hat
const int dailyRestartHour = 4;
const int restartDelayInMinutes = 10;
String terminalName = "Kein Name";
JsonDocument docc;
// Filesystem
#include "FS.h"
#include <LittleFS.h>
//TFT
#include "displayeSPI.h"
// WLAN/OTA/time
#include "wlan.h"
// Cardreader
#include "nfc.h"
// Funktionen

//TODO: ersetzen durch frische Config
void initFilsystem() {
  //Load file system information
  
  if (!LittleFS.begin(true)) {
    bootLogTFT("An error has occured while initializing littlefs");
    sleep(5000);
    ESP.restart();
  }
/*
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
  mqttChannelCard = mqttChannel + "/card
  ";

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
  bootLogTFT(mqttPassword);*/
}

//TODO: online Update erst ab Version 2 oder nie
void getConfig() {
  // Read the file
  File file = LittleFS.open("/config.json", "r");
  if (!file) {
    Serial.println("Failed to open config file");
    Machine::whitelist[0] = "0.4mm Edelstahldüse";
    Machine::whitelistCount = 1;
    return;
  }
DeserializationError error = deserializeJson(docc, file); // `file` ist schon geöffnet mit LittleFS.open("/config.json", "r");
  if (error) {
    bootLogTFT("deserializeJson() failed: ");
    bootLogTFT(error.f_str());
    delay(5000);
    ESP.restart();
  }

  JsonArray arr = docc["Whitelist"];
  Machine::whitelistCount = arr.size() < Machine::maxWhitelistSize ? arr.size() : Machine::maxWhitelistSize;
  for (int i = 0; i < Machine::whitelistCount; i++) {
    Machine::whitelist[i] = arr[i].as<String>();
  }
  terminalName = docc["GeräteTerminalName"].as<String>();
  // Beispiel, um die geladenen Werte zu überprüfen
  bootLogTFT("Geladene Whitelist:");
  for (int i = 0; i < Machine::whitelistCount; i++) {
    bootLogTFT(Machine::whitelist[i]);
  }
  //für alle maschienen setze activstatus auf 0
  //for (int i = 0; i < docc["maschines"].size(); i++) {
  //  docc["maschines"][i]["activestart"] = 0;
  //}
  //docc["maschines"][countter]["activestart"] != 0
  // Varriablen in Json lassen?
  //geraet = docc["name"].as<String>();
  //mqttChannel = docc["mqtt"]["mqttChannel"].as<String>();
  //mqttChannelCard = mqttChannel + "/card";
  //mqttUser = docc["mqtt"]["mqttUser"].as<String>();
  //mqttPassword = docc["mqtt"]["mqttPassword"].as<String>();

  file.close();
  bootLogTFT("finished reading filesystem information");
  //bootLogTFT(geraet);
  //bootLogTFT(mqttChannel);
  //bootLogTFT(mqttUser);
  //bootLogTFT(mqttPassword);
  //serializeJsonPretty(docc, Serial);
  //Download new Config as JSON
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
  // Download Config
  getConfig();
  bootLogTFT("Filsystem Initialisiert");
  // init wlan
  initWlan();
  // Init OTA
  initOTA();
  //set Time
  initTime();
  // Start Touch
  //initTouch();
  //handleTouh();
  // init cardreader
  initCard();
  // init Images
  //TJpgDec.setCallback(onDecode);
  displayStatus = 1;// Menue
}


void restartDailyAtFour() {
  time_t now = time(nullptr);
  struct tm timeinfo;
  localtime_r(&now, &timeinfo);
  // Restart at 4am
  if (timeinfo.tm_hour == dailyRestartHour && (now - timestampLastChange) >= (restartDelayInMinutes * 60)) {
    bootLogTFT("Restarting ESP32 at 4am...");
    esp_restart();
  }
}

void loop() {
  //Chck Wlan connection and reconnect
  checkWifi();
  //Touch on Device, switch to Image and Menue(Frischalten/Freigeben, Sperren, Kosten Info, Zurück)-> bestätigung durch Karte
  //handleTouh();
  //Check card -> New Card -> Display Name Einweisungen kompatible und Sicherheitsbelehrung.(zurück Button)
  boolean isCard =  readTag();
  if (lastCardReadTimestamp + 10000 < millis() && !isCard && lastCardRead != "") {//Keine Karte seit 10 Sekunden
    // Karte weg
    lastCardRead = "";
    //if (displayStatus == 2 || displayStatus == 4) {
      displayStatus = 1;
      lastDisplayStatus = -1;
      Machine::machineCount = 0;
    //}
  }
  handleDisplayMenue();
  ArduinoOTA.handle();
  //Display signal strenth, MQTT Status, Zeit, Name
  if (millis() > lastStatusUpdate + 1000) {
    displayStatusBar();
    lastStatusUpdate = millis();
  }
  restartDailyAtFour();
}
