#include <MQTT.h>

const char MQTT_HOST[] = "mqtt.fablab-luebeck.de";
const int MQTT_PORT = 1883;
String mqttUser = "invalid";
String mqttPassword;
String geraet = "invalid";
String mqttChannel = "invalid";
String mqttChannelCard = "";
MQTTClient mqttClient = MQTTClient(512);
//message liste for all messages
String sendMessage[3];
String sendChannel[3];


void mqttConnect();

void messageReceived(String &topic, String &payload) {
  Serial.println("incoming: " + topic + " - " + payload);
  const int capacity = 512;
  DynamicJsonDocument doc(capacity);
  DeserializationError err = deserializeJson(doc, payload);
  if (err) {
    doc.clear();
    Serial.print("JSON-Serialization failed with code ");
    Serial.println(err.c_str());
    Serial.print("Http response was");
    Serial.println(payload);
    Serial.println("Free Heap: " + String(ESP.getFreeHeap()));
    return;
  }
  Serial.println(doc.as<String>());
  if (doc.as<String>() == "false") {
    Serial.println("mqtt returned false, einweisung und sicherheitsbelehrung not set");
    einweisung = -1;
    sicherheitsbelehrung = -1;
    cardSendTimestamp = 0;
    displayStatus = 2;
  } else {
    // TODO: Challel aus config lesen und dann machen
    //Wenn topic cntains switch
    //Received message: machines/v2/Heldenhelfer/status/switch:0 - {"id":0, "source":"MQTT", "output":true, "apower":0.0, "voltage":236.7, "current":0.000, "pf":0.00, "aenergy":{"total":4433.905,"by_minute":[0.000,0.000,0.000],"minute_ts":1685278817},"temperature":{"tC":31.1, "tF":87.9}}
    // if topic contains /status/switch und output:false, dann setze docc["maschines"][ausgewahltesGerat]["activestart"] = millis(); auf 0
    if (topic.indexOf("/status/switch") > 0) {
      if (doc["output"].is<bool>()) {
        int switchnumber = topic.substring(topic.indexOf(":") + 1).toInt();
        Serial.println("switchnumber");
        Serial.println(switchnumber);
        Serial.println(doc["output"].as<bool>());
        Serial.println(docc["maschines"][switchnumber]["activestart"].as<long>());
        int indexNumber = 0;
        Serial.println(topic.substring(0, topic.indexOf("/status/switch")));
        for (int i = 0; i < docc["maschines"].size(); i++) {
          if (docc["maschines"][i]["mqttID"].as<int>() == switchnumber && docc["maschines"][i]["mqttChannel"] == topic.substring(0, topic.indexOf("/status/switch"))) {
            indexNumber = i;
            break;
          }
        }
        Serial.println(indexNumber);
        if (doc["output"] == false) {//lastDisplayStatus = 0;
          if (docc ["maschines"][indexNumber]["activestart"] != 0) {
            docc["maschines"][indexNumber]["activestart"] = 0;
            lastDisplayStatus = 0; // Update display
          }
        }else if (doc["output"] == true && docc["maschines"][indexNumber]["activestart"] == 0) {
          docc["maschines"][indexNumber]["activestart"] = millis();
          lastDisplayStatus = 0; // Update display
        }
      }
      doc.clear();
      return;
    }
    Serial.println(doc["einweisung"].as<String>());
    Serial.println(doc["sicherheitsbelehrung"].as<String>());
    if (doc["terminalMac"].is<String>() && doc["terminalMac"] == WiFi.macAddress()) {
      cardSendTimestamp = 0;
      if (doc["einweisung"].is<bool>() && doc["sicherheitsbelehrung"].is<bool>()) {
        Serial.println("Einweisung und Sicherheitsbelehrung abgelaufen");
        einweisung = -1;
        sicherheitsbelehrung = -1;
        displayStatus = 2;
      } else if (doc["einweisung"].is<bool>()) {
        Serial.println("Einweisung nicht vorhanden");
        einweisung = -1;
        sicherheitsbelehrung = 1;
        displayStatus = 2;
      } else if (doc["sicherheitsbelehrung"].is<bool>()) {
        Serial.println("Sicherheitsbelehrung nicht vorhanden");
        sicherheitsbelehrung = -1;
        einweisung = 1;
        displayStatus = 2;
      } else {
        einweisung = doc["einweisung"];
        sicherheitsbelehrung = doc["sicherheitsbelehrung"];
        //int len = strlen("{\"id\":\"123\", \"src\":\"user_1\", \"method\":\"Switch.Set\", \"params\":{\"id\":0,\"on\":true}}") + 1;
        Serial.println(String(docc["maschines"][ausgewahltesGerat]["mqttChannelShelly"].as<String>()));
        Serial.println("{\"id\":\"123\", \"src\":\"user_1\", \"method\":\"Switch.Set\", \"params\":{\"id\":" + docc["maschines"][ausgewahltesGerat]["mqttID"].as<String>() + ",\"on\":true}}");
        int cntr = 0;
        for (int n = 0; n < 3; n++) {
          if (sendMessage[n] == "") {
            cntr = n;
            break;
          }
        }
        sendMessage[cntr] = "{\"id\":\"123\", \"src\":\"user_1\", \"method\":\"Switch.Set\", \"params\":{\"id\":" + docc["maschines"][ausgewahltesGerat]["mqttID"].as<String>() + ",\"on\":true}}";
        sendChannel[cntr] = String(docc["maschines"][ausgewahltesGerat]["mqttChannelShelly"].as<String>());
        //mqttClient.publish(String(docc["maschines"][ausgewahltesGerat]["mqttChannelShelly"].as<String>()), "{\"id\":\"123\", \"src\":\"user_1\", \"method\":\"Switch.Set\", \"params\":{\"id\":" + docc["maschines"][ausgewahltesGerat]["mqttID"].as<String>() + ",\"on\":true}}", len, true);// TODO: Rcihtig
        docc["maschines"][ausgewahltesGerat]["activestart"] = millis();
        displayStatus = 2;
        Serial.print("Verbleibend: ");
        Serial.print(einweisung);
        Serial.print(" ");
        Serial.println(sicherheitsbelehrung);
        displayStatus = 4;
      }
      if (ausgewahltesGerat == -1) {
        displayStatus = 2;
      }
    }
  }
  doc.clear();
}

void mqttConnect() {
  Serial.println("connecting to mqtt server");
  Serial.print(WiFi.macAddress().c_str());
  Serial.print(mqttUser);
  //Serial.println(mqttPassword);
  int abortCounter = 0;
  while (!mqttClient.connect(WiFi.macAddress().c_str(), mqttUser.c_str(), mqttPassword.c_str())) {
    
    if (!(WiFi.status() != WL_CONNECTED)) {
      Serial.println("wifi not connected"); 
      Serial.println(WiFi.status());
    }
    Serial.println(mqttClient.lastError());
    delay(100);
    //char messageBuffer[100];
    Serial.println("WifiError:");
    //Serial.println(mqttClient.getLastSSLError(messageBuffer, 100));
    //Serial.println(messageBuffer);
    if (abortCounter >= 150){// nach 15 Sekunden
      bootLogTFT("MQTT-Server braucht zu lange");
      sleep(5000);
      ESP.restart();
    }
  }
  Serial.println(mqttClient.lastError());
  Serial.print("connected: ");
  Serial.println(mqttClient.connected());
  JsonArray array = docc["maschines"].as<JsonArray>();
  for(JsonVariant v : array) {
      bool substatus = mqttClient.subscribe(v["mqttChannel"].as<String>());
      Serial.print("listening on mqtt channel: ");
      Serial.println(v["mqttChannel"].as<String>());
      Serial.print("Erfolg: ");
      Serial.println(substatus);
      String channel = v["mqttChannel"].as<String>() + "/status/switch:" + v["mqttID"].as<String>();
      Serial.println(channel);
      substatus = mqttClient.subscribe(channel);
      Serial.print("Erfolg: ");
      Serial.println(substatus);
  }
  mqttClient.onMessage(messageReceived);
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
  for (int t = 0; t < 3; t++) {
    if (sendMessage[t] != "") {
      Serial.println("sende - also wirklich jetzt");
      Serial.println(sendMessage[t]);
      Serial.println(sendChannel[t]);
      Serial.println(sendMessage[t].length());
      if (mqttClient.publish(sendChannel[t], sendMessage[t])) {
        Serial.println("Erfolg");
      }else{
        Serial.println("Error:");
        Serial.println(mqttClient.lastError());
        Serial.println(mqttClient.returnCode());
      }
      sendMessage[t] = "";
    }
  }
  mqttClient.loop();
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
