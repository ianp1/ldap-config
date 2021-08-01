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

#include <ArduinoOTA.h>
#include <FS.h>   // Include the SPIFFS library

#define FASTLED_ESP8266_RAW_PIN_ORDER

#define NUM_LEDS  4
#define DATA_PIN  8

#define RST_PIN 20 // RST-PIN for RC522 - RFID - SPI - Module GPIO15 
#define SS_PIN  2  // SDA-PIN for RC522 - RFID - SPI - Module GPIO2

#define COLOR_MISSING CRGB::Orange
#define COLOR_ERROR CRGB::Red
#define COLOR_COUNTDOWN CRGB::Orange
#define COLOR_RFID CRGB::Blue

#define BRIGHTNESS_VALID 100
#define BRIGHTNESS_INVALID 255

MFRC522 mfrc522(SS_PIN, RST_PIN);   // Create MFRC522 instance

CRGB leds[NUM_LEDS];

String GERAET = "invalid";

const char* ssid = "fablab";
const char* password = "fablabfdm";

const char* host = "192.168.8.211";
const int httpsPort = 443;

// Use web browser to view and copy
// SHA1 fingerprint of the certificate
const char* fingerprint = "52:07:0F:7E:47:06:E2:2C:19:44:B3:84:0F:4F:5D:52:A8:4D:71:86";

byte state = 0;
bool startup = true;

// Timing
long lastCardReadTime = 0;
String lastCardRead = "";
const long cardReadTimeout = 2000;

bool LEDWifiShine = true;

//ReadValues
int serverError = 0;
int rfidError = 0;
int missingData = 0;

bool led_false_state = true;
long led_false_time = 0;



void setup() {
  Serial.begin(115200);
  // sanity check delay - allows reprogramming if accidently blowing power w/leds
  delay(2000);
  FastLED.addLeds<WS2812B, DATA_PIN, GRB>(leds, NUM_LEDS);
  
  SPI.begin();           // Init SPI bus
  mfrc522.PCD_Init();    // Init MFRC522
  
  WiFi.mode(WIFI_STA);
  WiFi.begin(ssid, password);

  SPIFFS.begin();
  if (SPIFFS.exists("/device.txt")) {
    File file = SPIFFS.open("/device.txt", "r");
    GERAET = file.readString();
    GERAET.trim();
    Serial.print("Read Device Name: ");
    Serial.println(GERAET);
    file.close();
  } else {
    Serial.println("no device name found!");
  }

  ArduinoOTA.setPasswordHash("280def0401a4cfad3c06f5b280dacf7d");

  ArduinoOTA.onStart([]() {
    String type;
    if (ArduinoOTA.getCommand() == U_FLASH) {
      type = "sketch";
    } else { // U_SPIFFS
      type = "filesystem";
    }

    // NOTE: if updating SPIFFS this would be the place to unmount SPIFFS using SPIFFS.end()
    Serial.println("Start updating " + type);
  });
  ArduinoOTA.onEnd([]() {
    Serial.println("\nEnd");
  });
  ArduinoOTA.onProgress([](unsigned int progress, unsigned int total) {
    Serial.printf("Progress: %u%%\r", (progress / (total / 100)));
  });
  ArduinoOTA.onError([](ota_error_t error) {
    Serial.printf("Error[%u]: ", error);
    if (error == OTA_AUTH_ERROR) {
      Serial.println("Auth Failed");
    } else if (error == OTA_BEGIN_ERROR) {
      Serial.println("Begin Failed");
    } else if (error == OTA_CONNECT_ERROR) {
      Serial.println("Connect Failed");
    } else if (error == OTA_RECEIVE_ERROR) {
      Serial.println("Receive Failed");
    } else if (error == OTA_END_ERROR) {
      Serial.println("End Failed");
    }
  });
  ArduinoOTA.begin();
}

void reject() {
  state = 1;
  led_false_state = true;
  led_false_time = millis();
}

void authorize() {
  state = 2;
}

void clearState() {
  state = 0;
}

bool ServerRequest(String rfid){
  
  leds[0] = CRGB::Yellow; 
  FastLED.show(); 
  WiFiClientSecure client;
  client.setInsecure();
  String url = "/api/v1.0/index.php/Kontaktverfolgung/"+rfid+"?author_bot=kontaktverfolgung&author_password=e9kKtmku4BIWdyaX81qw";
  Serial.print("requesting URL: ");
  Serial.println(url);
  Serial.println(host);
  if (!client.connect(host, httpsPort)) {
    Serial.println("connection failed");
    return false;
  }
  Serial.println("connected");
  
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
      Serial.println(answer);

      if (answer.startsWith("HTTP/1.")) {
        Serial.print("----> response code: ");
        Serial.println(answer.substring(9,12));
        int rescode = answer.substring(9,12).toInt();

        if (rescode == 200) {
          Serial.println("accept");
          missingData = 4;
          serverError = 4;
          rfidError = 4;
          return true;
        } else if (rescode == 400) {
          Serial.println("missing info");

          missingData = -1;
        } else if (rescode == 404) {
          rfidError = -1;
        } else {
          Serial.println("server error");

          serverError = -1;
        }

        return false;
      }
      
      if (answer[0] == '{') {
        /*
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
          Serial.println(doc["missingData"].as<String>());
          if (doc["einweisung"].is<bool>()) {
            Serial.println("Einweisung nicht vorhanden");
            einweisung = -1;
            missingData = 1;
            return false;
          } else if (doc["missingData"].is<bool>()) {
            Serial.println("Sicherheitsbelehrung nicht vorhanden");
            missingData = -1;
            einweisung = 1;
            return false;
          } else {
            einweisung = doc["einweisung"];
            missingData = doc["sicherheitsbelehrung"];
            
            Serial.print("Verbleibend: ");
            Serial.print(einweisung);
            Serial.print(" ");
            Serial.println(sicherheitsbelehrung);

            return true;
          }
        }
        */
      } else {
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
    startup = true;
  }
  if (startup) {
    startup = false;
    Serial.print("Connected, IP address: ");
    Serial.println(WiFi.localIP());
  }
  ArduinoOTA.handle();
  
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
  if (led_false_state) { 
    if (missingData < 0) {
      fill_solid(leds, NUM_LEDS, COLOR_MISSING);
    }
    if (serverError < 0) {
      fill_solid(leds, NUM_LEDS, COLOR_ERROR);
    }
    if (rfidError < 0) {
      fill_solid(leds, NUM_LEDS, COLOR_RFID);
    }
  } else {
    fill_solid(leds, NUM_LEDS, CRGB::Black);
  }
  
  if (millis() - led_false_time > 1000) {
    led_false_state = !led_false_state;
    led_false_time = millis();
  }
  

}

void LEDTrue() {
  FastLED.setBrightness(BRIGHTNESS_VALID);
  fill_solid(leds, NUM_LEDS, CRGB::Black);
  int countdown = 0;
  if (serverError > 3 && missingData > 3) {
    fill_solid(leds, NUM_LEDS, CRGB::Green);  
  }
  if (countdown != 0) {
    for (int i = 0; i < countdown; i++) {
      leds[NUM_LEDS - i - 1] = COLOR_COUNTDOWN;
    }
  }
}
