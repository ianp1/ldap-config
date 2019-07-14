/*
 *  HTTP over TLS (HTTPS) example sketch
 *
 *  This example demonstrates how to use
 *  WiFiClientSecure class to access HTTPS API.
 *  We fetch and display the status of
 *  esp8266/Arduino project continuous integration
 *  build.
 *
 *  Created by Ivan Grokhotkov, 2015.
 *  This example is in public domain.
 */
#include <ArduinoJson.h>
#include <SPI.h>
#include <ESP8266WiFi.h>
#include <WiFiClientSecure.h>
#include <MFRC522.h>
#include <Wire.h>
#include <FastLED.h>
#include <fastled_config.h>
#include <fastled_delay.h>
#include <pixeltypes.h> 
#include <power_mgt.h>
#define FASTLED_ESP8266_RAW_PIN_ORDER

#define NUM_LEDS  4
#define DATA_PIN  8

#define RST_PIN 20 // RST-PIN for RC522 - RFID - SPI - Module GPIO15 
#define SS_PIN  2  // SDA-PIN for RC522 - RFID - SPI - Module GPIO2

#define COLOR_SICHERHEIT CRGB::Blue
#define COLOR_EINWEISUNG CRGB::White
#define COLOR_COUNTDOWN CRGB::Orange

#define BRIGHTNESS_VALID 100
#define BRIGHTNESS_INVALID 255

MFRC522 mfrc522(SS_PIN, RST_PIN);   // Create MFRC522 instance

CRGB leds[NUM_LEDS];

const char* GERAET = "geraetname=Drehbank,ou=einweisung,dc=ldap-provider,dc=fablab-luebeck";

const char* ssid = "fablab";
const char* password = "fablabfdm";

const char* host = "192.168.2.201";
const int httpsPort = 443;

// Use web browser to view and copy
// SHA1 fingerprint of the certificate
const char* fingerprint = "52:07:0F:7E:47:06:E2:2C:19:44:B3:84:0F:4F:5D:52:A8:4D:71:86";

byte state = 0;

// Timing
long lastCardReadTime = 0;
String lastCardRead = "";
const long cardReadTimeout = 2000;

bool LEDWifiShine = true;

//ReadValues
int einweisung = 0;
int sicherheitsbelehrung = 0;



void setup() {
  // sanity check delay - allows reprogramming if accidently blowing power w/leds
  delay(2000);
  FastLED.addLeds<WS2812B, DATA_PIN, GRB>(leds, NUM_LEDS);
  
  SPI.begin();           // Init SPI bus
  mfrc522.PCD_Init();    // Init MFRC522
  
  Serial.begin(115200);
  WiFi.begin(ssid, password);
}

void reject() {
  state = 1;
}

void authorize() {
  state = 2;
}

void clearState() {
  state = 0;
}

bool ServerRequest(String rfid){
  WiFiClientSecure client;
  
  String url = "/api/v1.0/index.php/Einweisung/"+rfid+"/"+GERAET+"?author_bot=terminal&author_password=LwRa2RPYY";
  Serial.print("requesting URL: ");
  Serial.println(url);
  Serial.println(host);
  if (!client.connect(host, httpsPort)) {
    Serial.println("connection failed");
    return false;
  }
  
  if (client.verify(fingerprint, host)) {
    Serial.println("certificate matches");
  } else {
    Serial.println("certificate doesn't match");
  }
  client.print(String("GET ") + url + " HTTP/1.1\r\n" +
               "Host: " + host + "\r\n" +
               "User-Agent: ESP8266\r\n" +
               "Connection: close\r\n\r\n");

  Serial.println("request sent");
  while (client.connected()) {
    if (client.available()) {
      String answer = client.readStringUntil('\n');
      if (answer[0] == '{') {
        const int capacity = JSON_OBJECT_SIZE(2) + 64;
        DynamicJsonDocument doc(capacity);
  
        DeserializationError err = deserializeJson(doc, answer);
  
        if (err) {
          Serial.print("JSON-Serialization failed with code ");
          Serial.println(err.c_str());
          Serial.print("Http response was");
          Serial.println(answer);
        } else {
          Serial.println(doc["einweisung"].as<String>());
          Serial.println(doc["sicherheitsbelehrung"].as<String>());
          if (doc["einweisung"].is<bool>()) {
            Serial.println("Einweisung nicht vorhanden");
            return false;
          } else if (doc["sicherheitsbelehrung"].is<bool>()) {
            Serial.println("Sicherheitsbelehrung nicht vorhanden");
            return false;
          } else {
            einweisung = doc["einweisung"];
            sicherheitsbelehrung = doc["sicherheitsbelehrung"];
            
            Serial.print("Verbleibend: ");
            Serial.print(einweisung);
            Serial.print(" ");
            Serial.println(sicherheitsbelehrung);

            return true;
          }
        }
      }
    }
  }

  client.stop();
  
  return false;
}

void loop() {
  while (WiFi.status() != WL_CONNECTED) {
    LEDWifi();
    FastLED.show();
    delay(500);
  }
  
  if (state == 0) {
    LEDOff();
  }
  
  if(state == 1){
    LEDFalse();
  }
  
  if(state == 2){
    LEDTrue();
  }
  FastLED.show();

  if ( mfrc522.PICC_IsNewCardPresent() && mfrc522.PICC_ReadCardSerial()) {  
    String content= "";
    for (byte i = 0; i < mfrc522.uid.size; i++) 
    {
      if (i != 0) {
       content.concat(String(mfrc522.uid.uidByte[i] < 0x10 ? "_0" : "_"));
      }
      content.concat(String(mfrc522.uid.uidByte[i], HEX));
    }
    content.toUpperCase();
    Serial.println("Card read:" + content);
  
    if (content != "") {
      if (lastCardRead != "" && content == lastCardRead) {
        Serial.println("refreshing state");
        lastCardReadTime = millis();
      } else {
        Serial.println("sending new request");
        lastCardRead = content;
        lastCardReadTime = millis();
        if (ServerRequest(content)) {
          authorize();
        } else {
          reject();
        }
      }
    }
  }

  if (millis() - lastCardReadTime > cardReadTimeout) {
    Serial.println("clearing state");
    clearState();
    lastCardRead = "";
    lastCardReadTime = 0;
  }
  delay(10); 
  
}

void LEDWifi() {
  fill_solid(leds, NUM_LEDS, CRGB::Black);
  if (LEDWifiShine) {
    leds[1] = CRGB::Yellow;
    leds[2] = CRGB::Yellow;
  } else {
    leds[0] = CRGB::Yellow;
    leds[3] = CRGB::Yellow;
  }
  
  LEDWifiShine = !LEDWifiShine;
}

void LEDOff() {
  FastLED.setBrightness(BRIGHTNESS_VALID);
  fill_solid(leds, NUM_LEDS, CRGB::Black);
  leds[0] = CRGB::Green;
}

void LEDFalse() {
  FastLED.setBrightness(BRIGHTNESS_INVALID);
  fill_solid(leds, NUM_LEDS, CRGB::Red);
}

void LEDTrue() {
  FastLED.setBrightness(BRIGHTNESS_VALID);
  fill_solid(leds, NUM_LEDS, CRGB::Black);
  int countdown = 0;
  if (einweisung > 3 && sicherheitsbelehrung > 3) {
    fill_solid(leds, NUM_LEDS, CRGB::Green);  
  } else if (einweisung <= 3) {
    leds[0] = COLOR_EINWEISUNG;
    countdown = einweisung;
  } else {
    leds[0] = COLOR_SICHERHEIT;
    countdown = sicherheitsbelehrung;
  }
  if (countdown != 0) {
    for (int i = 0; i < countdown; i++) {
      leds[NUM_LEDS - i - 1] = COLOR_COUNTDOWN;
    }
  }
}
