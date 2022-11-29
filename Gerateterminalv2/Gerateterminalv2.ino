//New Terminal, by Marco with TFT
#define MQTT


#include <Arduino.h>
//TFT
#include "SPI.h"
#include "Adafruit_GFX.h"
#include "Adafruit_ILI9341.h"
#define TFT_DC 21
#define TFT_CS 22
#define TFT_RESET 17// Optional -1 to disable
//VSPI ->MOSI 23, MISO 19, CLK 18 ändern in initTFT()
//HSPI ->MOSI 13, MISO 12, CLK 14
SPIClass * vspi = NULL;
Adafruit_ILI9341 * tft = NULL;

// Filesystem
#include "FS.h"
#include <LittleFS.h>
// NFC
// WLAN
#include <WiFi.h>
bool wifiSt = false;
const char* WIFI_SSID = "fablab";
const char* WIFI_PASSWORD = "fablabfdm";
static const char ca_cert[] PROGMEM = R"EOF(
-----BEGIN CERTIFICATE-----
MIIDtTCCAp2gAwIBAgIUXYSEGQA3MzJbuD2XICi4FeRZTKUwDQYJKoZIhvcNAQEN
BQAwajEXMBUGA1UEAwwOQW4gTVFUVCBicm9rZXIxFjAUBgNVBAoMDU93blRyYWNr
cy5vcmcxFDASBgNVBAsMC2dlbmVyYXRlLUNBMSEwHwYJKoZIhvcNAQkBFhJub2Jv
ZHlAZXhhbXBsZS5uZXQwHhcNMjIwNDA5MTQ0OTExWhcNMzIwNDA2MTQ0OTExWjBq
MRcwFQYDVQQDDA5BbiBNUVRUIGJyb2tlcjEWMBQGA1UECgwNT3duVHJhY2tzLm9y
ZzEUMBIGA1UECwwLZ2VuZXJhdGUtQ0ExITAfBgkqhkiG9w0BCQEWEm5vYm9keUBl
eGFtcGxlLm5ldDCCASIwDQYJKoZIhvcNAQEBBQADggEPADCCAQoCggEBAK/sbOQV
ZTJdvkY1C9t0UTbokVSjfG6U6vBdKXsO7Jd84i8JpzZucWVGzYHvbo30M0btCVKe
GBKLXlpmfqNtk9OfGBjSjfFD3x6NyFtJQa+h3FO0x8EfWZcY7GTaGsQ4ijWabHOl
jQIvmVPvq4kj+qkCxG2YGVVZudrpRPNM1sAqZAmGNbAVb3ZZe2IRkbx+pAZeGazz
wikhm4yV/x7fRX8RBdJ4R7S7bPRx9SbSWwvB0FIvSKxCr5uyutImo2jlSK3R2rJO
xw1qpeWEqFcb/z/n2c02nHnnWVhS/yuWKNOBKFTwRhpqCXwyQDku1/2sfKnpuW3F
TKXFC+0oWeqQOm0CAwEAAaNTMFEwHQYDVR0OBBYEFAexRe3JvTuxTFdH/rpprCbS
nPPPMB8GA1UdIwQYMBaAFAexRe3JvTuxTFdH/rpprCbSnPPPMA8GA1UdEwEB/wQF
MAMBAf8wDQYJKoZIhvcNAQENBQADggEBAHzZZG2aB9yk/1LPngKVx/Zs2RKAzDpc
MVYfPncV/qTFeyhmvluVy1cSgKF8m+rcGgM/pDUaXWVPq9xA9/p7VAuBK1dS9No9
RI1SG79xNDRLFTNzM9yDt+Bl76rx42zhF2p9x7+gm/BuVDs1k8Vzyg1LCzYa1LTR
Ix8GzWaq8xQLDMDhU3JRKMNRnIxv5XpPYRm4Vg0WettpiqRkdw5KmDlGbizKKx06
ntriVZtEL44iJpf96PsSkueWP3x3ycyvs2a6LLa4TiSALGsy/HZUrfMiaxS/ZaeO
lva9u9UhMQaIuMEG/E2ONEQuFb1TkhxvdhwzWhuOq/qA/e7HZeB+FUw=
-----END CERTIFICATE-----
-----BEGIN CERTIFICATE-----
MIIFazCCA1OgAwIBAgIRAIIQz7DSQONZRGPgu2OCiwAwDQYJKoZIhvcNAQELBQAw
TzELMAkGA1UEBhMCVVMxKTAnBgNVBAoTIEludGVybmV0IFNlY3VyaXR5IFJlc2Vh
cmNoIEdyb3VwMRUwEwYDVQQDEwxJU1JHIFJvb3QgWDEwHhcNMTUwNjA0MTEwNDM4
WhcNMzUwNjA0MTEwNDM4WjBPMQswCQYDVQQGEwJVUzEpMCcGA1UEChMgSW50ZXJu
ZXQgU2VjdXJpdHkgUmVzZWFyY2ggR3JvdXAxFTATBgNVBAMTDElTUkcgUm9vdCBY
MTCCAiIwDQYJKoZIhvcNAQEBBQADggIPADCCAgoCggIBAK3oJHP0FDfzm54rVygc
h77ct984kIxuPOZXoHj3dcKi/vVqbvYATyjb3miGbESTtrFj/RQSa78f0uoxmyF+
0TM8ukj13Xnfs7j/EvEhmkvBioZxaUpmZmyPfjxwv60pIgbz5MDmgK7iS4+3mX6U
A5/TR5d8mUgjU+g4rk8Kb4Mu0UlXjIB0ttov0DiNewNwIRt18jA8+o+u3dpjq+sW
T8KOEUt+zwvo/7V3LvSye0rgTBIlDHCNAymg4VMk7BPZ7hm/ELNKjD+Jo2FR3qyH
B5T0Y3HsLuJvW5iB4YlcNHlsdu87kGJ55tukmi8mxdAQ4Q7e2RCOFvu396j3x+UC
B5iPNgiV5+I3lg02dZ77DnKxHZu8A/lJBdiB3QW0KtZB6awBdpUKD9jf1b0SHzUv
KBds0pjBqAlkd25HN7rOrFleaJ1/ctaJxQZBKT5ZPt0m9STJEadao0xAH0ahmbWn
OlFuhjuefXKnEgV4We0+UXgVCwOPjdAvBbI+e0ocS3MFEvzG6uBQE3xDk3SzynTn
jh8BCNAw1FtxNrQHusEwMFxIt4I7mKZ9YIqioymCzLq9gwQbooMDQaHWBfEbwrbw
qHyGO0aoSCqI3Haadr8faqU9GY/rOPNk3sgrDQoo//fb4hVC1CLQJ13hef4Y53CI
rU7m2Ys6xt0nUW7/vGT1M0NPAgMBAAGjQjBAMA4GA1UdDwEB/wQEAwIBBjAPBgNV
HRMBAf8EBTADAQH/MB0GA1UdDgQWBBR5tFnme7bl5AFzgAiIyBpY9umbbjANBgkq
hkiG9w0BAQsFAAOCAgEAVR9YqbyyqFDQDLHYGmkgJykIrGF1XIpu+ILlaS/V9lZL
ubhzEFnTIZd+50xx+7LSYK05qAvqFyFWhfFQDlnrzuBZ6brJFe+GnY+EgPbk6ZGQ
3BebYhtF8GaV0nxvwuo77x/Py9auJ/GpsMiu/X1+mvoiBOv/2X/qkSsisRcOj/KK
NFtY2PwByVS5uCbMiogziUwthDyC3+6WVwW6LLv3xLfHTjuCvjHIInNzktHCgKQ5
ORAzI4JMPJ+GslWYHb4phowim57iaztXOoJwTdwJx4nLCgdNbOhdjsnvzqvHu7Ur
TkXWStAmzOVyyghqpZXjFaH3pO3JLF+l+/+sKAIuvtd7u+Nxe5AW0wdeRlN8NwdC
jNPElpzVmbUq4JUagEiuTDkHzsxHpFKVK7q4+63SM1N95R1NbdWhscdCb+ZAJzVc
oyi3B43njTOQ5yOf+1CceWxG1bQVs5ZufpsMljq4Ui0/1lvh+wjChP4kqKOJ2qxq
4RgqsahDYVvTH9w7jXbyLeiNdd8XM2w9U/t7y0Ff/9yi0GE44Za4rF2LN9d11TPA
mRGunUHBcnWEvgJBQl9nJEiU0Zsnvgc/ubhPgXRR4Xq37Z0j4r7g1SgEEzwxA57d
emyPxgcYxn/eR44/KJ4EBs+lVDR3veyJm+kXQ99b21/+jh5Xos1AnX5iItreGCc=
-----END CERTIFICATE-----
)EOF";

static const String API_AUTH = "?author_bot=terminal&author_password=LwRa2RPYY";
static const String API_LDAP_SUFFIX = ",ou=einweisung,dc=ldap-provider,dc=fablab-luebeck";
static const String API_BACKEND = "https://einweisungen.fablab-luebeck.de/api/v1.0/index.php/Einweisung/";
//OTA
#include <ESPmDNS.h>
#include <WiFiUdp.h>
#include <ArduinoOTA.h>
// Time
#include <time.h>
// MQTT
#include <WiFiClientSecure.h>
#ifdef MQTT
#include <ArduinoJson.h>
#include <MQTT.h>
#endif
WiFiClientSecure wifiClient;
const char MQTT_HOST[] = "mqtt.fablab-luebeck.de";
const int MQTT_PORT = 1883;
String mqttUser = "invalid";
String mqttPassword;
String geraet = "invalid";
String mqttChannel = "invalid";
String mqttChannelCard = "";
long blinkWifiConnectingTimer = 0;
long blinkRetrieveErrorTimer = 0;
long cardStateTimer = 0;

int einweisung = 0;
int sicherheitsbelehrung = 0;
bool cardStateVisible = false;

long cardSendTimestamp = 0;
String lastCardRead = "";
long lastCardReadTimestamp = 0;
#ifdef MQTT
MQTTClient mqttClient;
#endif
// Cardreader
#include <Wire.h>
#include <Adafruit_PN532.h>
#define PN532_SS 25
Adafruit_PN532 nfc(PN532_SS);
// Touch
#include "Adafruit_STMPE610.h"
#define STMPE_CS 16
uint16_t x, y;
uint8_t z;
bool is_touched = false;
Adafruit_STMPE610 touch = Adafruit_STMPE610(STMPE_CS);
// Funktionen
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

void initFilsystem() {
  //Load file system information
  if (!LittleFS.begin()) {
    bootLogTFT("An error has occured while initializing littlefs");
  }

  File file = LittleFS.open("/device.txt", "r");
  if (!file) {
    bootLogTFT("Failed to open file device.txt");
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

void initWlan() {
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  //WiFi.setSleep(false);
  bootLogTFT("Verbinde WLAN");
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("");
  bootLogTFT("WiFi connected");
  bootLogTFT(String(WiFi.localIP()));
  wifiClient.setCACert(ca_cert);
}

void initOTA() {
  ArduinoOTA.setPassword("11Ie8alLvfe50It");
  ArduinoOTA
    .onStart([]() {
      String type;
      if (ArduinoOTA.getCommand() == U_FLASH)
        type = "sketch";
      else // U_SPIFFS
        type = "filesystem";
      // NOTE: if updating SPIFFS this would be the place to unmount SPIFFS using SPIFFS.end()
      tft->fillScreen(ILI9341_BLACK);
      tft->setCursor(0, 0);
      tft->setTextColor(ILI9341_WHITE);
      bootLogTFT("Start updating " + type);
    })
    .onEnd([]() {
      bootLogTFT("\nEnd");
    })
    .onProgress([](unsigned int progress, unsigned int total) {
      bootLogTFT("Progress: " + String(progress / (total / 100)));
    })
    .onError([](ota_error_t error) {
      Serial.printf("Error[%u]: ", error);
      if (error == OTA_AUTH_ERROR) bootLogTFT("Auth Failed");
      else if (error == OTA_BEGIN_ERROR) bootLogTFT("Begin Failed");
      else if (error == OTA_CONNECT_ERROR) bootLogTFT("Connect Failed");
      else if (error == OTA_RECEIVE_ERROR) bootLogTFT("Receive Failed");
      else if (error == OTA_END_ERROR) bootLogTFT("End Failed");
    });
  ArduinoOTA.begin();
}

/**
 * Sets ntp up, needed for ssl verification
 */
time_t initTime() {
  configTime(3 * 3600, 0, "pool.ntp.org", "time.nist.gov");

  bootLogTFT("Waiting for NTP time sync: ");
  int cT = 0;
  time_t now = time(nullptr);
  while (now < 8 * 3600 * 2) {
    delay(100);
    now = time(nullptr);
    cT++;
    if (cT%10 == 0) {
      bootLogTFT("Sync in Progress");
    }
  }
  struct tm timeinfo;
  gmtime_r(&now, &timeinfo);
  bootLogTFT("Current time: " + String(asctime(&timeinfo)));
  return now;
}

void mqttConnect();

void messageReceived(String &topic, String &payload) {
  Serial.println("incoming: " + topic + " - " + payload);

  const int capacity = JSON_OBJECT_SIZE(5) + 64;
  DynamicJsonDocument doc(capacity);
  DeserializationError err = deserializeJson(doc, payload);
  if (err) {
    Serial.print("JSON-Serialization failed with code ");
    Serial.println(err.c_str());
    Serial.print("Http response was");
    Serial.println(payload);
  }

  Serial.println(doc.as<String>());
  if (doc.as<String>() == "false") {
    Serial.println("mqtt returned false, einweisung und sicherheitsbelehrung not set");
    einweisung = -1;
    sicherheitsbelehrung = -1;
    cardStateVisible = true;
    cardSendTimestamp = 0;
  } else {
    Serial.println(doc["einweisung"].as<String>());
    Serial.println(doc["sicherheitsbelehrung"].as<String>());
    if (doc["terminalMac"].is<String>() && doc["terminalMac"] == WiFi.macAddress()) {
      cardStateVisible = true;
      cardSendTimestamp = 0;
      if (doc["einweisung"].is<bool>()) {
        Serial.println("Einweisung nicht vorhanden");
        einweisung = -1;
        sicherheitsbelehrung = 1;
      } else if (doc["sicherheitsbelehrung"].is<bool>()) {
        Serial.println("Sicherheitsbelehrung nicht vorhanden");
        sicherheitsbelehrung = -1;
        einweisung = 1;
      } else {
        einweisung = doc["einweisung"];
        sicherheitsbelehrung = doc["sicherheitsbelehrung"];
        
        Serial.print("Verbleibend: ");
        Serial.print(einweisung);
        Serial.print(" ");
        Serial.println(sicherheitsbelehrung);
      }
    }
  }
}

void mqttConnect() {
  #ifdef MQTT
  Serial.println("connecting to mqtt server");


  while (!mqttClient.connect(WiFi.macAddress().c_str(), mqttUser.c_str(), mqttPassword.c_str())) {
    
    if (!(WiFi.status() != WL_CONNECTED)) {
      Serial.println("wifi not connected"); 
    }
    Serial.println(mqttClient.lastError());
    delay(100);
    char messageBuffer[100];
    Serial.println("WifiError:");
    //Serial.println(wifiClient.getLastSSLError(messageBuffer, 100));
    //Serial.println(messageBuffer);
  }
  Serial.println(mqttClient.lastError());
  Serial.println("connected");
  mqttClient.subscribe(mqttChannel);
  mqttClient.onMessage(messageReceived);

  Serial.print("listening on mqtt channel ");
  Serial.println(mqttChannel);
  //subscribe here to topics
  #endif
}

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

void initMQTT() {
  #ifdef MQTT
  mqttClient.begin(MQTT_HOST, MQTT_PORT, wifiClient);
  mqttConnect();
  #endif
}

void initTouch() {
  if (! touch.begin()) {
    bootLogTFT("STMPE not found!");
    while(1);
  }
}

void setup() {
  //Init Serial
  Serial.begin(115200);
  Serial.println("ESP32 Startet");
  // Init display + Touch
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
  //    JSON Alle angeschlossenen Geräte
  // connect to mqtt
  initMQTT();
  // init cardreader
  initCard();
  // Start Touch
  initTouch();
  // Show Start Screen
}

//Loop Funktionen
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
    
    if (uidLength == 4)
    {
      // We probably have a Mifare Classic card ... 
      Serial.println("Seems to be a Mifare Classic card (4 byte UID)");
    }
    if (uidLength == 7)
    {
      // We probably have a Mifare Ultralight card ...
      Serial.println("Seems to be a Mifare Ultralight tag (7 byte UID)");
    }
  }
  return varRet;
}

void showCardInfo(){
  tft->fillScreen(ILI9341_BLACK);
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
  if (mqttClient.connected()) {
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
  int srenth = 0;
  if (wifiSt) {
    srenth = WiFi.RSSI();
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

void checkWifi() {
  if (WiFi.status() != WL_CONNECTED) {
    wifiSt = false;
  }else {
    wifiSt = true;
  }
}

void loop() {
  checkWifi();
  //Chck Wlan connection and reconnect
  //MQTT Get Device state and Update time and User
  //Check card -> New Card -> Display Name Einweisungen kompatible und Sicherheitsbelehrung.(10 Sekunden und zurück Button)
  //Touch on Device, switch to Image and Menue(Frischalten/Freigeben, Sperren, Kosten Info, Zurück)-> bestätigung durch Karte
  //Display signal strenth, MQTT Status, Zeit, Name
  
  handleTouh();
  if (readTag()) {
    showCardInfo();
  }
  ArduinoOTA.handle();
  displayStatusBar();
}
