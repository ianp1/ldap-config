

#include <ESP8266WiFi.h>
#include "Adafruit_MQTT_Client.h"
#include <Arduino.h>
#include <ArduinoOTA.h>

#define PM_PIN                    5
#define RELAY_PIN                 15

#define MQTT_SERVER               "192.168.8.202"
#define MQTT_SERVERPORT           1883
#define CERT_FINGERPRINT          "A5 F1 26 A6 2E 21 18 EF B7 E8 4B 31 DE DD CE D2 EA 90 C8 4A"

#define WLAN_SSID                 "fablab"
#define WLAN_PW                   "fablabfdm"


WiFiClientSecure client;
// Setup the MQTT client class by passing in the WiFi client and MQTT server and login details.
Adafruit_MQTT_Client *mqtt;

Adafruit_MQTT_Subscribe *OnOffSwitch;

String GERAET;
String PASSWORD;
String readTopic;
String writeTopic;
String hostname;

bool POWER_MANAGEMENT = false;

void setup() {
  Serial.begin(115200);
  delay(2000);
  SPIFFS.begin();
  pinMode(RELAY_PIN, OUTPUT);
  
  if (SPIFFS.exists("/device.txt")) {
    File file = SPIFFS.open("/device.txt", "r");
    GERAET = file.readString();
    GERAET.trim();
    Serial.print("Read Device Name: ");
    Serial.println(GERAET);
    file.close();
  }

  if (SPIFFS.exists("/password.txt")) {
    File file = SPIFFS.open("/password.txt", "r");
    PASSWORD = file.readString();
    PASSWORD.trim();
    Serial.print("Read Password: ");
    Serial.println(PASSWORD);
    file.close();
  }  

  if (SPIFFS.exists("/pm.txt")) {
    File file = SPIFFS.open("/pm.txt", "r");
    String content = file.readString();
    content.trim();
    POWER_MANAGEMENT = content == "1";
    Serial.print("Power Management: ");
    Serial.println(POWER_MANAGEMENT ? "enabled" : "disabled");

    pinMode(PM_PIN, INPUT);
  }
  readTopic = "machines/"+GERAET;
  writeTopic = "machines/"+GERAET+"/current";
  hostname = "shelly"+GERAET;

  Serial.println("finished reading: ");
  Serial.println(GERAET);
  Serial.println(PASSWORD);

  digitalWrite(RELAY_PIN, LOW);

  Serial.print("Connecting to ");
  Serial.println(WLAN_SSID);

  WiFi.hostname(hostname);
  WiFi.begin(WLAN_SSID, WLAN_PW);

  delay(5000);

  Serial.println("WiFi connected");
  Serial.println("IP address: "); 
  Serial.println(WiFi.localIP());

  mqtt = new Adafruit_MQTT_Client(&client, MQTT_SERVER, MQTT_SERVERPORT, GERAET.c_str(), PASSWORD.c_str());

  OnOffSwitch = new Adafruit_MQTT_Subscribe(mqtt, readTopic.c_str());

  client.setFingerprint(CERT_FINGERPRINT);
  mqtt->subscribe(OnOffSwitch);

  ArduinoOTA.setPasswordHash("0bee89b07a248e27c83fc3d5951213c1");

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


/**
 * Source: https://github.com/flespi-software/ESP8266_mqtts/blob/master/sensor_to_flespi_mqtts/adafruit_mqtts.h
 */
void MQTT_connect() {

  // Stop if already connected.
  if (mqtt->connected())
    return;

  Serial.print("Connecting to MQTT... ");

  uint8_t retries = 3;
  int8_t status = mqtt -> connect();
  while (status != 0) { // connect will return 0 for connected
    Serial.print("Status: ");
    Serial.println(status);
    Serial.println(mqtt->connectErrorString(status));
    Serial.println("Retrying MQTT connection in 5 seconds...");
    mqtt->disconnect();
    delay(5000);  // wait 5 seconds
    retries--;
    if (retries == 0) {
      Serial.println("dying");
      while (1); // basically die and wait for WDT to reset me
    }
    status = mqtt -> connect();
  }

  Serial.println("MQTT Connected!");
}


void loop() {
  while (WiFi.status() != WL_CONNECTED) {
    Serial.println("connecting...");
    delay(500);
  }
  ArduinoOTA.handle();

  MQTT_connect();

  Adafruit_MQTT_Subscribe *subscription;
  Serial.println("start waiting");
  while ((subscription = mqtt->readSubscription(1000))) {
    Serial.println("subscription received");
    if (subscription == OnOffSwitch) {
      Serial.print(F("Got: "));
      Serial.println((char *)(*OnOffSwitch).lastread);
      if (((char*)(*OnOffSwitch).lastread)[0] == '1') {
        digitalWrite(RELAY_PIN, HIGH);
        Serial.println("AN");
      } else {
        digitalWrite(RELAY_PIN, LOW);
        Serial.println("AUS");
      }
    }
  }
  if (POWER_MANAGEMENT) {
    unsigned long ampVal = pulseIn(PM_PIN, LOW);
    Serial.print("ampVal: ");
    Serial.println(ampVal);
    char ampValStr[30];
    ultoa(ampVal, ampValStr, 10);
    mqtt->publish(writeTopic.c_str(), ampValStr);
  }


  // put your main code here, to run repeatedly:
}