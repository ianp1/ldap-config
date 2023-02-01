//New Terminal, by Marco with TFT
#include <Arduino.h>
#include <ArduinoJson.h>
#define CONFIG_LITTLEFS_SPIFFS_COMPAT 1
int ausgewahltesGerat = -1;// Index der Config geräte
int einweisung = 0;// Wie lnge eine Einweisung noch vorhanden ist
int sicherheitsbelehrung = 0;// Wie lange eine Sicherheitsbelehrung noch vorhanden ist
long cardSendTimestamp = 0;//Wann die MQTT nachricht der Karte gesendet wurde
long lastStatusUpdate = 0;
String lastCardRead = "";// ID der letzten Karte
long lastCardReadTimestamp = 0;// Wann das letzte mal eine Karte gelesen wurde
long mqttDisconnectedTimestamp = 0;// Wann der MQTT teil die verbindung verloren hat
DynamicJsonDocument docc(1024);
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
  DeserializationError error = deserializeJson(docc, file);
  if (error) {
    Serial.print(F("deserializeJson() failed: "));
    Serial.println(error.f_str());
    return;
  }
  // Varriablen in Json lassen?
  geraet = docc["name"].as<String>();
  mqttChannel = docc["mqtt"]["mqttChannel"].as<String>();
  mqttChannelCard = mqttChannel + "/card";
  mqttUser = docc["mqtt"]["mqttUser"].as<String>();
  mqttPassword = docc["mqtt"]["mqttPassword"].as<String>();
  file.close();
  bootLogTFT("finished reading filesystem information");
  bootLogTFT(geraet);
  bootLogTFT(mqttChannel);
  bootLogTFT(mqttUser);
  bootLogTFT(mqttPassword);
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
  //    JSON Alle angeschlossenen Geräte
  // connect to mqtt
  initMQTT();
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
  String payload = "{\"terminalMac\": \"" + WiFi.macAddress() + "\",\"machine\": \"" + docc["maschines"][ausgewahltesGerat]["einweisungsname"].as<String>() + "\",\"rfid\": \"" + content + "\"}";
  String topic = String(docc["maschines"][ausgewahltesGerat]["mqttChannel"].as<String>() + "/card");
  Serial.print("Veröffentliche Nachricht: ");
  Serial.println(payload);
  Serial.print("auf Thema: ");
  Serial.println(topic);
  bool success = mqttClient.publish(topic, payload.c_str());
  if (success) {
    cardSendTimestamp = millis();
  } else {
    // Fehlerbehandlung, z.B. Anzeige einer Fehlermeldung auf dem Display oder Protokollierung des Fehlers
    Serial.println("Fehler beim Veröffentlichen der MQTT-Nachricht: " + payload);
  }
}

void loop() {
  //Chck Wlan connection and reconnect
  checkWifi();
  //MQTT Get Device state and Update time and User
  checkMQTT();
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
