#include <ArduinoJson.h>
#include <MQTT.h>

const char MQTT_HOST[] = "mqtt.fablab-luebeck.de";
const int MQTT_PORT = 1883;
String mqttUser = "invalid";
String mqttPassword;
String geraet = "invalid";
String mqttChannel = "invalid";
String mqttChannelCard = "";
MQTTClient mqttClient;


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
    cardSendTimestamp = 0;
  } else {
    Serial.println(doc["einweisung"].as<String>());
    Serial.println(doc["sicherheitsbelehrung"].as<String>());
    if (doc["terminalMac"].is<String>() && doc["terminalMac"] == WiFi.macAddress()) {
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
      if (ausgewahltesGerat == -1) {
        displayStatus = 2;
      }
    }
  }
}

void mqttConnect() {
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
}

void initMQTT() {
  mqttClient.begin(MQTT_HOST, MQTT_PORT, wifiClient);
  mqttConnect();
}

bool isMQTTConnected() {
  return mqttClient.connected();
}

void checkMQTT() {
  if (!mqttClient.connected()){
    if (mqttDisconnectedTimestamp == 0) {
      mqttDisconnectedTimestamp = millis();
      Serial.println("set mqttDisconnectedTimestamp");
    }
    mqttConnect();
    //startup = true;
  }else{
    mqttDisconnectedTimestamp = 0;
    mqttClient.loop();
  }
}
