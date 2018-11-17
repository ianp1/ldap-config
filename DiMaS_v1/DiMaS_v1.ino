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

#define NUM_LEDS  10
#define DATA_PIN  8

#define RST_PIN 20 // RST-PIN for RC522 - RFID - SPI - Module GPIO15 
#define SS_PIN  2  // SDA-PIN for RC522 - RFID - SPI - Module GPIO2
MFRC522 mfrc522(SS_PIN, RST_PIN);   // Create MFRC522 instance

//#define BlueLed 15
//#define GreenLed 0
//#define RedLed 3

CRGB leds[NUM_LEDS];

const char* GERAET = "geraetname=Lasercutter,ou=maschine,dc=ldap-provider,dc=fablab-luebeck";

int time_buffer = 1000; // amount of time in miliseconds that the relay will remain open

const char* ssid = "fablab";
const char* password = "fablabfdm";

const char* host = "192.168.2.201";
const int httpsPort = 446;

// Use web browser to view and copy
// SHA1 fingerprint of the certificate
const char* fingerprint = "83 FE 78 E2 42 46 E2 DF 91 0D 84 50 D9 3D 63 BB 8D FB 92 3F";

byte state = 0;

//TIMING////////////////////////////////////////////////////////////////////////////////////
long previousMillisBlink = 0,
     blinkInterval = 500;

//LED////////////////////////////
bool light = false;
int counter = 0;

void setup() {
  // sanity check delay - allows reprogramming if accidently blowing power w/leds
  delay(2000);
  FastLED.addLeds<WS2812B, DATA_PIN, GRB>(leds, NUM_LEDS);
  
  SPI.begin();           // Init SPI bus
  mfrc522.PCD_Init();    // Init MFRC522
  
  Serial.begin(115200);
  Serial.println();
  Serial.print("connecting to ");
  Serial.println(ssid);
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("");
  Serial.println("WiFi connected");
  Serial.println("IP address: ");
  Serial.println(WiFi.localIP());
}

void reject() {
  Serial.println("not authorized");
  state = 1;
}

void authorize() {
  Serial.println("authorized"); 
  state = 2;
}

// Helper routine to dump a byte array as hex values to Serial
void dump_byte_array(byte *buffer, byte bufferSize) {
  for (byte i = 0; i < bufferSize; i++) {
    Serial.print(buffer[i] < 0x10 ? " 0" : " ");
    Serial.print(buffer[i], HEX);
  }
}

bool ServerRequest(String rfid){
  WiFiClientSecure client;
  
  String url = "/api/v1.0/index.php/Einweisung/"+rfid+"/"+GERAET+"?author_user=IanPoesse&author_password=abc";
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
      String line = client.readStringUntil('\n');
      Serial.println(line);
      
      if(line=="true"){
        Serial.println("hier1");
        client.stop();
        Serial.println("hier2");
        return true;
      } else if (line == "false") {
        client.stop();
        return false;
      }
    }
  }

  client.stop();
  
  return false;
}

void loop() {
  if(state == 1){
    LEDFalse();
  }
  if(state == 2){
    LEDTrue();
  }
  FastLED.show();
  
  if ( ! mfrc522.PICC_IsNewCardPresent()) {   
    delay(50);
    return;
  }
  // Select one of the cards
  if ( ! mfrc522.PICC_ReadCardSerial()) {   
    delay(50);
    return;
  }
  String content= "";
  for (byte i = 0; i < mfrc522.uid.size; i++) 
  {
    if (i != 0) {
     content.concat(String(mfrc522.uid.uidByte[i] < 0x10 ? "_0" : "_"));
    }
     content.concat(String(mfrc522.uid.uidByte[i], HEX));
  }
  content.toUpperCase();

  if (content != "") {
    Serial.println("Card read:" + content);
    if (ServerRequest(content)) {
      authorize();
    } else {
      reject();
    }
  }
  delay(10);

}

void LEDFalse(){
  unsigned long currentMillis = millis();
  if(currentMillis - previousMillisBlink > blinkInterval) {
    previousMillisBlink = currentMillis;
    if(light == false){
      counter++;
      fill_solid(leds,NUM_LEDS,CRGB::Black);
      //Serial.println("PUFF!");
    }
    else if(light == true){
      fill_solid(leds,NUM_LEDS,CRGB::Red);      //Serial.println("PENG!");
    }
    light = !light;
    if(counter > 3){
      fill_solid(leds,NUM_LEDS,CRGB::Black);
      counter = 0;
      state = 0;
    }
  }
}

void LEDTrue(){
  unsigned long currentMillis = millis();
  if(currentMillis - previousMillisBlink > blinkInterval) {
    previousMillisBlink = currentMillis;
    if(light == false){
      counter++;
      fill_solid(leds,NUM_LEDS,CRGB::Black);
      //Serial.println("PUFF!");
    }
    else if(light == true){
      fill_solid(leds,NUM_LEDS,CRGB::Green);      //Serial.println("PENG!");
    }
    light = !light;
    if(counter > 3){
      fill_solid(leds,NUM_LEDS,CRGB::Black);
      counter = 0;
      state = 0;
    }
  }
}
