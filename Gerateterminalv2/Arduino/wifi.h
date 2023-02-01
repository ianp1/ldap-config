#include <WiFi.h>
extern void bootLogTFT(String s);
const char* WIFI_SSID = "Seewald";
const char* WIFI_PASSWORD = "nicoleundgina";
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

long wifiDisconnectedTimestamp = 0;
#include <WiFiClientSecure.h>
WiFiClientSecure wifiClient;
//OTA
#include <ESPmDNS.h>
#include <WiFiUdp.h>
#include <ArduinoOTA.h>
// Time
#include <time.h>

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
      tft->fillScreen(ST77XX_BLACK);
      tft->setCursor(0, 0);
      tft->setTextColor(ST77XX_WHITE);
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

int checkWifi() {
  if (WiFi.status() != WL_CONNECTED) {
    if (wifiDisconnectedTimestamp == 0) {
      wifiDisconnectedTimestamp = millis();
    }
    //startup = true;//TODO: Eventuell hilfreich
    return 0;
  }else {
    wifiDisconnectedTimestamp = 0;
    return WiFi.RSSI();
  }
}
