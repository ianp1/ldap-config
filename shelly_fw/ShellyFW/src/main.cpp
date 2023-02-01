

#include <ESP8266WiFi.h>
#include <ESP8266HTTPClient.h>
#include <WiFiClientSecureBearSSL.h>
#include "Adafruit_MQTT_Client.h"
#include <Arduino.h>
#include <ArduinoOTA.h>
#include <time.h>
#include <MQTT.h>
#include <ESPAsyncTCP.h>
#include <ESPAsyncWebServer.h>
#include <AsyncElegantOTA.h>

#define PM_PIN                    5
#define RELAY_PIN                 4

#define CERT_FINGERPRINT          "A5 F1 26 A6 2E 21 18 EF B7 E8 4B 31 DE DD CE D2 EA 90 C8 4A"

#define WIFI_SSID                 "fablab"
#define WIFI_PASSWORD               "fablabfdm"

AsyncWebServer server(80);

BearSSL::WiFiClientSecure wifiClient;
// Setup the MQTT client class by passing in the WiFi client and MQTT server and login details.

String GERAET;
String PASSWORD;
String hostname;


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
BearSSL::X509List x509(ca_cert);

const char MQTT_HOST[] = "mqtt.fablab-luebeck.de";
const int MQTT_PORT = 1883;

String mqttChannel = "invalid";
String mqttChannelCard = "invalid";

MQTTClient mqttClient;

time_t setClock() {
  configTime(3 * 3600, 0, "pool.ntp.org", "time.nist.gov");

  Serial.println("Waiting for NTP time sync: ");
  time_t now = time(nullptr);
  while (now < 8 * 3600 * 2) {
    delay(100);
    now = time(nullptr);
  }
  struct tm timeinfo;
  gmtime_r(&now, &timeinfo);
  Serial.print("Current time: ");
  Serial.print(asctime(&timeinfo));
  return now;
}

void messageReceived(String &topic, String &payload) {
  Serial.println("received mqtt message: ");
  Serial.println(topic+"->"+payload);
  if (payload == "1") {
    digitalWrite(RELAY_PIN, HIGH);
  } else if (payload == "0") {
    digitalWrite(RELAY_PIN, LOW);
  } else if (payload == "card_removed") {
    digitalWrite(RELAY_PIN, LOW);
  }
}

void mqttConnect() {
  Serial.println("connecting to mqtt server");

  while (!mqttClient.connect(WiFi.macAddress().c_str(), GERAET.c_str(), PASSWORD.c_str())) {
    Serial.println(mqttClient.lastError());
    delay(100);
    char messageBuffer[100];
    Serial.println(wifiClient.getLastSSLError(messageBuffer, 100));
    Serial.println(messageBuffer);
  }
  Serial.println(mqttClient.lastError());
  Serial.println("connected");
  Serial.println("subscribed: ");
  Serial.println(mqttChannel);
  Serial.println("and");
  Serial.println(mqttChannelCard);
  mqttClient.subscribe(mqttChannel);
  mqttClient.subscribe(mqttChannelCard);
  mqttClient.onMessage(messageReceived);
  //subscribe here to topics
}


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
  hostname = "shelly"+GERAET;

  //setup ota update
  server.on("/", HTTP_GET, [](AsyncWebServerRequest *request) {
    request->send(200, "text/plain", "Hi! I am ESP32.");
  });
  AsyncElegantOTA.begin(&server, "otaUpdate", "11Ie8alLvfe50It");    // Start ElegantOTA
  server.begin();

  Serial.println("finished reading: ");
  Serial.println(GERAET);
  Serial.println(PASSWORD);
  mqttChannel = "machines/"+GERAET+"/active";
  mqttChannelCard="machines/"+GERAET+"/card";
  Serial.println("mqtt channel: "+mqttChannel);

  digitalWrite(RELAY_PIN, LOW);

  Serial.print("Connecting to ");
  Serial.println(WIFI_SSID);

  WiFi.hostname(hostname);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  wifiClient.allowSelfSignedCerts();
  wifiClient.setTrustAnchors(&x509);
  delay(1000);
  setClock();

  delay(5000);

  Serial.println("WiFi connected");
  Serial.println("IP address: "); 
  Serial.println(WiFi.localIP());
  mqttClient.begin(MQTT_HOST, MQTT_PORT, wifiClient);

  mqttConnect();

}


void loop() {
  while (WiFi.status() != WL_CONNECTED) {
    Serial.println("connecting...");
    delay(500);
  }
  if (!mqttClient.connected())
  {
    mqttConnect();
  }
  else
  {
    mqttClient.loop();
    delay(10);
  }

  if (POWER_MANAGEMENT) {
    unsigned long ampVal = pulseIn(PM_PIN, LOW);
    Serial.print("ampVal: ");
    Serial.println(ampVal);
    char ampValStr[30];
    ultoa(ampVal, ampValStr, 10);
    //mqtt->publish(writeTopic.c_str(), ampValStr);
  }


  // put your main code here, to run repeatedly:
}