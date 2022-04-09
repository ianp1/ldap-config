#include <Arduino.h>
#include <ESP8266WiFi.h>
#include <ESP8266HTTPClient.h>
#include <WiFiClientSecureBearSSL.h>
#include <time.h>
#include "FastLED.h"
#include <MFRC522.h>
#include <SPI.h>
#include <ArduinoJson.h>
#include <MQTT.h>

#define NUM_LEDS 4
#define FASTLED_ESP8266_RAW_PIN_ORDER
#define LED_PIN 15

const String WIFI_SSID = "fablab";
const String WIFI_PASSWORD = "fablabfdm";

bool startup = true;

BearSSL::WiFiClientSecure wifiClient;
/*

*/
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

static const String API_AUTH = "?author_bot=terminal&author_password=LwRa2RPYY";
static const String API_BACKEND = "https://einweisungen.fablab-luebeck.de/api/v1.0/index.php/Einweisung/";

#define MFRC522_SS_PIN 2
#define MFRC522_RST_PIN 20

MFRC522 mfrc522(MFRC522_SS_PIN, MFRC522_RST_PIN);

CRGB leds[NUM_LEDS];

long blinkWifiConnectingTimer = 0;
long blinkRetrieveErrorTimer = 0;
long cardStateTimer = 0;

int einweisung = 0;
int sicherheitsbelehrung = 0;
bool cardStateVisible = false;

String lastCardRead = "";
long lastCardReadTimestamp = 0;

#define COLOR_EINWEISUNG CRGB::White
#define COLOR_COUNTDOWN CRGB::Orange
#define COLOR_SICHERHEIT CRGB::Blue

const char MQTT_HOST[] = "mqtt.local";
const int MQTT_PORT = 1883;
const char MQTT_USER[] = "ELab_Tisch_1";
const char MQTT_PASSWORD[] = "qQZNXOPQ";

MQTTClient mqttClient;

void blinkWifiConnecting() {
  if (blinkWifiConnectingTimer == 0 || millis() - blinkWifiConnectingTimer > 10000) {
    blinkWifiConnectingTimer = millis();
  }

  long timerStatus = (millis() - blinkWifiConnectingTimer) / 500;
  if (timerStatus % 2 == 0) {
    fill_solid(leds, NUM_LEDS, CRGB::Black);
    leds[0] = CRGB::Yellow;
    leds[3] = CRGB::Yellow;
  } else {
    fill_solid(leds, NUM_LEDS, CRGB::Black);
    leds[1] = CRGB::Yellow;
    leds[2] = CRGB::Yellow;
  }
  FastLED.show();

}

void blinkRetrieveError() {
  long startTime = millis();
  while (millis() - startTime < 3000) {
    yield();
    if (blinkRetrieveErrorTimer == 0 || millis() - blinkRetrieveErrorTimer > 10000) {
      blinkRetrieveErrorTimer = millis();
    }

    long timerStatus = (millis() - blinkWifiConnectingTimer) / 500;
    if (timerStatus % 2 == 0) {
      fill_solid(leds, NUM_LEDS, CRGB::Red);
    } else {
      fill_solid(leds, NUM_LEDS, CRGB::Black);
    }
    FastLED.show();
  }
}

void showCardState() {
  if (cardStateVisible) {
    if (einweisung < 0 || sicherheitsbelehrung < 0) {
      if (einweisung < 0) {
        leds[0] = COLOR_EINWEISUNG;
      } else {
        leds[0] = COLOR_SICHERHEIT;
      }
      for (int i = 1; i < NUM_LEDS; i++) {
        leds[i] = CRGB::Red;
      }
    } else if (einweisung < 3 || sicherheitsbelehrung < 3) {
      int remain = 0;
      if (einweisung < 3) {
        leds[0] = COLOR_EINWEISUNG;
        remain = einweisung;
      } else {
        leds[0] = COLOR_SICHERHEIT;
        remain = sicherheitsbelehrung;
      }
      for (int i = 1; i < remain + 1; i++) {
        leds[1 + i] = COLOR_COUNTDOWN;
      }
    } else {
      fill_solid(leds, NUM_LEDS, CRGB::Green);
    }
    FastLED.show();
  }
}
/**
 * Sets ntp up, needed for ssl verification
 */
time_t setClock() {
  configTime(3 * 3600, 0, "pool.ntp.org", "time.nist.gov");

  Serial.println("Waiting for NTP time sync: ");
  time_t now = time(nullptr);
  while (now < 8 * 3600 * 2) {
    blinkWifiConnecting();
    delay(100);
    now = time(nullptr);
  }
  struct tm timeinfo;
  gmtime_r(&now, &timeinfo);
  Serial.print("Current time: ");
  Serial.print(asctime(&timeinfo));
  return now;
}

void mqttConnect() {
  Serial.println("connecting to mqtt server");
  while (!mqttClient.connect(MQTT_HOST, MQTT_USER, MQTT_PASSWORD)) {
    Serial.println(mqttClient.lastError());
    delay(100);
    char messageBuffer[100];
    Serial.println(wifiClient.getLastSSLError(messageBuffer, 100));
    Serial.println(messageBuffer);
    blinkWifiConnecting();
  }
  Serial.println("connected");
  //subscribe here to topics
}

void setup() {
  Serial.begin(115200);
  delay(2000);
  
  FastLED.addLeds<WS2812B, LED_PIN, GRB>(leds, NUM_LEDS);

  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  WiFi.setSleepMode(WIFI_NONE_SLEEP);

  //add tls cacert for backend
  //wifiClient.setInsecure();
  wifiClient.allowSelfSignedCerts();
  wifiClient.setTrustAnchors(&x509);
  delay(1000);
  setClock();

  //Init rfid reader
  SPI.begin();
  mfrc522.PCD_Init();

  //Init mqtt connection
  mqttClient.begin(MQTT_HOST, MQTT_PORT, wifiClient);
  mqttConnect();
}

void checkCard(String content) {
  fill_solid(leds, NUM_LEDS, CRGB::Yellow);
  FastLED.show();
  HTTPClient httpClient;
  httpClient.begin(wifiClient, API_BACKEND+content+"/geraetname=EEcke,ou=einweisung,dc=ldap-provider,dc=fablab-luebeck"+API_AUTH);
  int respCode = httpClient.GET();

  //Catch Server errors and internal errors
  if (respCode >= 400 || respCode <= 0) {
    if (respCode >= 400) {
      Serial.println("Server error: "+respCode);
    } else {
      Serial.println("Error code is: "+respCode);
      Serial.println("Error message: "+httpClient.errorToString(respCode));
    }
    blinkRetrieveError();
  //Successfull request
  } else {
    String result = httpClient.getString();
    Serial.print("result: ");
    Serial.println(result);

    if (result[0] != '{') {
      cardStateVisible = true;
      einweisung = -1;
      sicherheitsbelehrung = 1;

      return;
    }
    const int capacity = JSON_OBJECT_SIZE(2) + 64;
    DynamicJsonDocument doc(capacity);

    DeserializationError err = deserializeJson(doc, result);
    if (err) {
      Serial.print("JSON-Serialization failed with code ");
      Serial.println(err.c_str());
      Serial.print("Http response was");
      Serial.println(result);
      blinkRetrieveError();
    } else {
      cardStateVisible = true;
      Serial.println(doc["einweisung"].as<String>());
      Serial.println(doc["sicherheitsbelehrung"].as<String>());

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
        mqttConnect();
        mqttClient.publish("machines/ELab_Tisch_1", "valid_card");
      }
    }
  }
  httpClient.end();


}

void loop() {
  while (WiFi.status() != WL_CONNECTED) {
    startup = true;
    delay(100);
    Serial.println("connecting");
    blinkWifiConnecting();
  }
  if (!mqttClient.connected())
  {
      mqttConnect();
  }
  else
  {
    mqttClient.loop();
  }


  fill_solid(leds, NUM_LEDS, CRGB::Black);
  leds[0] = CRGB::Green;

  if (lastCardRead != "" && millis() - lastCardReadTimestamp > 4000) {
    Serial.println("reset lastCardRead");
    cardStateVisible = false;
    lastCardRead = "";
    lastCardReadTimestamp = 0;
    mqttConnect();
    mqttClient.publish("machines/ELab_Tisch_1", "card_removed");
  }
  showCardState();

  FastLED.show();

  if (startup) {
    Serial.print("Connected, IP address: ");
    Serial.println(WiFi.localIP());
    startup = false;
  } else {
    
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
      Serial.println("Last card read: " + lastCardRead);
      if (lastCardRead != content) {
        lastCardRead = content;
        checkCard(content);
      }
      lastCardReadTimestamp = millis();
    }
    
    
  
  }

  // put your main code here, to run repeatedly:
}