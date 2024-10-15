#ifndef MEINE_DEF_H
#define MEINE_DEF_H
#include <ArduinoJson.h>
#include <HTTPClient.h>
#include <TimeLib.h>
#include <WiFi.h>
#include <WiFiClientSecure.h>
extern int lastDisplayStatus;
extern int ausgewahltesGerat;
extern int displayStatus;
extern String terminalName;
extern void bitteWarten();
extern long timestampLastChange;

class Machine {
   public:
    // counter machineCount und max machines
    static const int maxMachines = 50;
    static int machineCount;
    static Machine machines[maxMachines];
    static const int maxWhitelistSize = 8;
    static int whitelistCount;
    static String whitelist[maxWhitelistSize];
    static unsigned long safetyInstructionDate;
    String name;
    String deviceId;
    String img;
    String cost;
    String description;
    String deviceType;
    bool isActive;
    bool isMentor;
    // DateTime equivalent in Arduino is usually handled with `unsigned long` or `time_t`
    unsigned long einweisung;
    String error;
    int number;

    // Standardkonstruktor
    Machine()
        : name(""), img(""), cost(""), deviceId(""), description(""), isMentor(false), isActive(false), einweisung(0), deviceType(""), error(""), number(0) {}

    // Konstruktor mit Parametern
    Machine(String name, String img, String cost, String deviceId, String description, bool isMentor, bool isActive, unsigned long einweisung, String deviceType, int number)
        : name(name), img(img), cost(cost), deviceId(deviceId), description(description), isMentor(isMentor), isActive(isActive), einweisung(einweisung), deviceType(deviceType), number(number) {}

    static Machine* getMachines() {
        return machines;
    }

    static String getFilenameFromURL(String url) {
        int lastIndex = url.lastIndexOf('/');
        String s = url.substring(lastIndex + 1);
        s.toLowerCase();
        return "/" + s;
    }

    static bool imageExist(String url) {
        String filename = getFilenameFromURL(url);
        if (fileExists(filename)) {
            Serial.println("File already exists.");
            return true;  // oder return false, je nachdem was erwartet wird
        }
        return false;
    }

    static bool fileExists(String filename) {
        Serial.println(filename);
        return LittleFS.exists(filename);
    }

    static bool downloadAndSaveImage(String url) {
        String filename = getFilenameFromURL(url);
        if (imageExist(url)) {
            return true;
        }
        HTTPClient http;
        http.begin(url);
        int httpCode = http.GET();

        if (httpCode == HTTP_CODE_OK) {
            File file = LittleFS.open(filename, "w");
            if (!file) {
                Serial.println("Failed to open file for writing");
                return false;
            }

            WiFiClient* stream = http.getStreamPtr();
            uint8_t buffer[1024] = {0};
            int bytesRead;
            while ((bytesRead = stream->read(buffer, sizeof(buffer))) > 0) {
                file.write(buffer, bytesRead);
            }

            file.close();
            http.end();
            Serial.println("File downloaded and saved successfully.");
            return true;
        } else {
            Serial.printf("HTTP GET failed, error: %s\n", http.errorToString(httpCode).c_str());
            http.end();
            return false;
        }
    }

    static String UploadImage(String url) {
        HTTPClient http;
        http.begin("https://imageresizer.com/api/tasks/import/url");
        http.addHeader("Content-Type", "application/json");

        String body = "{\"url\":\"" + url + "\"}";
        int httpResponseCode = http.POST(body);

        if (httpResponseCode > 0) {
            String response = http.getString();
            Serial.println(response);
            DynamicJsonDocument doc(1024);
            deserializeJson(doc, response);
            String id = doc["id"];
            http.end();
            Serial.println(id);
            return id;
        } else {
            http.end();
            return "Error";
        }
    }

    static String startJob(String imgID, String width, String height) {
        HTTPClient http;
        http.begin("https://imageresizer.com/api/jobs");
        http.addHeader("Content-Type", "application/json");

        String body = "{\"tag\":\"resize-editor-conversion\",\"tasks\":{\"resize\":{\"dimensions\":{\"width\":" + width + ",\"height\":" + height + "},\"operation\":\"convert\",\"input\":\"" + imgID + "\",\"input_format\":\"jpg\",\"output_format\":\"jpg\",\"resize_as\":\"dimensions\",\"options\":{\"image_rotate\":0,\"image_vertical_flip\":false,\"image_horizontal_flip\":false,\"background_color\":\"#000000\",\"fill_background\":false,\"auto-orient\":true,\"strip\":true,\"image_custom_width\":" + width +",\"image_custom_height\":" + height + ",\"jpeg_compress_image_quality\":95}},\"exportTask\":{\"operation\":\"export/url\",\"input\":\"resize\"}}}";
        int httpResponseCode = http.POST(body);

        if (httpResponseCode > 0) {
            String response = http.getString();
            Serial.println(response);
            DynamicJsonDocument doc(1024);
            deserializeJson(doc, response);
            String jobId = doc["id"];
            Serial.println(jobId);
            http.end();
            return jobId;
        } else {
            http.end();
            return "Error";
        }
    }

    static String getUpdate(String id) {
        HTTPClient http;
        http.begin("https://imageresizer.com/api/jobs/" + id);
        int httpResponseCode = http.GET();

        if (httpResponseCode > 0) {
            String response = http.getString();
            Serial.println(response);
            DynamicJsonDocument doc(1024);
            deserializeJson(doc, response);
            JsonArray tasks = doc["tasks"];
            for (JsonObject task : tasks) {
                const char* name = task["name"];
                const char* status = task["status"];

                if (strcmp(name, "exportTask") == 0 && strcmp(status, "completed") == 0) {
                    const char* url = task["result"]["url"];
                    return String(url);
                }
            }
            return "";
            http.end();
            return response;  // Return the JSON response directly
        } else {
            http.end();
            return "Error";
        }
    }

    static String formatDate(time_t timestamp) {
        char buf[11];  // Speicher für das Datum im Format DD.MM.YYYY plus Null-Terminator
        tmElements_t tm;

        breakTime(timestamp, tm);  // Konvertiere den Unix-Zeitstempel in eine Zeitstruktur

        snprintf(buf, sizeof(buf), "%02d.%02d.%04d", tm.Day, tm.Month, tmYearToCalendar(tm.Year));
        return String(buf);
    }

    static unsigned long parseDate(const String& dateString) {
        Serial.println("Date: " + dateString);

        if (dateString.length() != 15) {
            Serial.println("Invalid date format: " + dateString);
            return 0;
        }

        tm elements = {};

        elements.tm_year = dateString.substring(0, 4).toInt() - 1900;
        elements.tm_mon = dateString.substring(4, 6).toInt() - 1;
        elements.tm_mday = dateString.substring(6, 8).toInt();
        elements.tm_hour = dateString.substring(8, 10).toInt();
        elements.tm_min = dateString.substring(10, 12).toInt();
        elements.tm_sec = dateString.substring(12, 14).toInt();

        // Debug-Ausgaben
        Serial.print("Year: ");
        Serial.println(elements.tm_year + 1900);
        Serial.print("Month: ");
        Serial.println(elements.tm_mon + 1);
        Serial.print("Day: ");
        Serial.println(elements.tm_mday);
        Serial.print("Hour: ");
        Serial.println(elements.tm_hour);
        Serial.print("Minute: ");
        Serial.println(elements.tm_min);
        Serial.print("Second: ");
        Serial.println(elements.tm_sec);

        time_t time = mktime(&elements);

        if (time == -1) {
            Serial.println("Invalid date conversion");
            return 0;
        }
        Serial.print("Fertig: ");
        Serial.println((unsigned long)time);
        return ((unsigned long)time) + 0;
    }

    static void parseJSON(String json, String rfid) {
        JsonDocument doc;  // Adjust the size based on the complexity of your JSON

        deserializeJson(doc, json);
        // print doc
        // serializeJsonPretty(doc, Serial);
        Serial.println(doc["safetyInstructionDate"] | "");
        safetyInstructionDate = parseDate(doc["safetyInstructionDate"] | "");

        JsonArray devices = doc["devices"];

        machineCount = 0;  // Reset the count each time you parse
        for (JsonObject device : devices) {
            if (machineCount >= maxMachines) {
                Serial.println("Maximum machine count reached, skipping additional devices");
                break;
            }

            String name = device["displayName"] | "No Name";
            bool isInWhitelist = false;
            for (int j = 0; j < whitelistCount; j++) {
                if (whitelist[j] == name) {
                    isInWhitelist = true;
                    break;  // Beendet die innere Schleife, wenn der Name gefunden wurde
                }
            }
            if (!isInWhitelist) {
                continue;
            }
            Serial.println(name);
            String img = device["imageUrl"] | "";
            Serial.println(img);
            String cost = device["cost"] | "";
            String deviceId = device["deviceId"] | "";
            String description = device["description"] | "";
            String deviceType = device["deviceType"] | "";
            bool isMentor = device["mentor"] | false;
            bool isActive = (device["status"] | "unknown") != "unknown";

            // Parse trainingDate
            Serial.println(isActive);
            unsigned long einweisung = parseDate(device["trainingDate"] | "");

            // Create a new Machine object and add it to the array
            machines[machineCount++] = Machine(name, img, cost, deviceId, description, isMentor, isActive, einweisung, deviceType, machineCount);
            Serial.println(name + " erfolgreich hinzugefügt");
        }
        if (whitelistCount == 1 && machineCount == 1) {
            machines->requestActivateMachine(rfid);
        }

        // UBaseType_t stackHighWaterMark = uxTaskGetStackHighWaterMark(NULL);
        // Serial.print("Stack High Water Mark: ");
        // Serial.println(stackHighWaterMark);
        // parseDate(doc["safetyInstructionDate"] | "");
        // stackHighWaterMark = uxTaskGetStackHighWaterMark(NULL);
        // Serial.print("Stack High Water Mark: ");
        // Serial.println(stackHighWaterMark);
        // Serial.println(parseDate(doc["safetyInstructionDate"] | ""));
        // safetyInstructionDate = parseDate(doc["safetyInstructionDate"] | "");
        // Serial.println("Deine Sicherheitsbelehrung ist noch gültig bis: " + safetyInstructionDate);
        // sicherheitsbelehrung = safetyInstructionDate
    }

    static void loadMachines(String rfid) {
        bitteWarten();
        WiFiClientSecure client;
        client.setInsecure();  // Use this only if you don't have the certificate

        HTTPClient https;

        String url = "https://einweisungen.fablab-luebeck.de/api/v1.0/index.php/MakercardApp/Devices/" + terminalName + "/" + rfid;
        https.begin(client, url);
        https.setTimeout(10000);
        int httpCode = https.GET();

        if (httpCode > 0) {
            String payload = https.getString();
            Serial.println(payload);
            // Parse the payload as JSON and process it
            /*payload =
                "{"
                "    \"devices\": ["
                "        {"
                "            \"displayName\": \"0.4mm Edelstahldüse\","
                "            \"deviceType\": \"Prusa i3 MK3\","
                "            \"status\": \"mqttManaged\","
                "            \"cost\": \"5.5\","
                "            \"imageUrl\": \"https://www.fablab-luebeck.de/user/pages/lasercutter/_lasercutter/lasercutter.jpg\","
                "            \"deviceId\": \"cn=0.4mm Edelstahldüse,cn=PrusaMK3,ou=einweisung,dc=ldap-provider,dc=fablab-luebeck\","
                "            \"mentor\": true,"
                "            \"trainingDate\": \"20230928000000Z\""
                "        },"
                "       {"
                "            \"displayName\": \"Namexy2\","
                "            \"deviceType\": \"Prusa i3 MK3\","
                "            \"status\": \"mqttManaged\","
                "            \"cost\": \"1.1\","
                "            \"imageUrl\": \"https://www.fablab-luebeck.de/user/pages/lasercutter/_lasercutter/lasercutter.jpg\","
                "            \"deviceId\": \"cn=0.4mm Edelstahldüse,cn=PrusaMK3,ou=einweisung,dc=ldap-provider,dc=fablab-luebeck\","
                "            \"mentor\": true,"
                "            \"trainingDate\": \"20230928000000Z\""
                "        },"
                "       {"
                "            \"displayName\": \"Namexy3\","
                "            \"deviceType\": \"Prusa i3 MK3\","
                "            \"status\": \"mqttManaged\","
                "            \"cost\": \"2.1\","
                "            \"imageUrl\": \"https://www.fablab-luebeck.de/user/pages/lasercutter/_lasercutter/lasercutter.jpg\","
                "            \"deviceId\": \"cn=0.4mm Edelstahldüse,cn=PrusaMK3,ou=einweisung,dc=ldap-provider,dc=fablab-luebeck\","
                "            \"mentor\": true,"
                "            \"trainingDate\": \"20230928000000Z\""
                "        },"
                "       {"
                "            \"displayName\": \"Namexy4\","
                "            \"deviceType\": \"Prusa i3 MK3\","
                "            \"status\": \"mqttManaged\","
                "            \"cost\": \"3.1\","
                "            \"imageUrl\": \"https://www.fablab-luebeck.de/user/pages/lasercutter/_lasercutter/lasercutter.jpg\","
                "            \"deviceId\": \"cn=0.4mm Edelstahldüse,cn=PrusaMK3,ou=einweisung,dc=ldap-provider,dc=fablab-luebeck\","
                "            \"mentor\": true,"
                "            \"trainingDate\": \"20230928000000Z\""
                "        },"
                "       {"
                "            \"displayName\": \"Namexy5\","
                "            \"deviceType\": \"Prusa i3 MK3\","
                "            \"status\": \"mqttManaged\","
                "            \"cost\": \"4.1\","
                "            \"imageUrl\": \"https://www.fablab-luebeck.de/user/pages/lasercutter/_lasercutter/lasercutter.jpg\","
                "            \"deviceId\": \"cn=0.4mm Edelstahldüse,cn=PrusaMK3,ou=einweisung,dc=ldap-provider,dc=fablab-luebeck\","
                "            \"mentor\": true,"
                "            \"trainingDate\": \"20230928000000Z\""
                "        }"
                "    ],"
                "    \"safetyInstructionDate\": \"20231201000000Z\""
                "}";*/

            parseJSON(payload, rfid);
            lastDisplayStatus = -1;
        } else {
            Serial.print("Error on HTTPS request: ");
            Serial.println(https.errorToString(httpCode).c_str());
            displayStatus = 5;
        }

        https.end();
        timestampLastChange = millis();
    }

    void requestActivateMachine(const String& rfid) {
        bitteWarten();
        Serial.println("Gerät freischalten");
        WiFiClientSecure client;
        client.setInsecure();  // Use this only if you don't have the certificate

        HTTPClient https;
        String url = "https://einweisungen.fablab-luebeck.de/api/v1.0/index.php/MakercardApp/Devices/" + deviceId + "/activate/" + terminalName + "/" + rfid;
        Serial.println(url);

        https.begin(client, url);
        https.setTimeout(10000);
        int httpCode = https.POST("");

        if (httpCode > 0) {
            String response = https.getString();
            Serial.print("HTTP Code: ");
            Serial.println(httpCode);
            Serial.print("Response: ");
            Serial.println(response);

            if (httpCode == 200 && response.indexOf("<!DOCTYPE html>") == -1) {
                isActive = true;
                displayStatus = 4;
                ausgewahltesGerat = number;
            } else {
                if (response.indexOf("<!DOCTYPE html>") != -1) {
                    error = "Du befindest dich im falschem Netzwerk. Bitte verbinde dich mit dem FabLab-WLAN.";
                } else {
                    error = response;
                }
                isActive = false;
                Serial.println("Anfrage fehlgeschlagen mit Status " + String(httpCode));
                Serial.println(response);
                displayStatus = 5;
            }
        } else {
            Serial.println("Error on HTTPS request: " + httpCode);
            // Serial.println("Error on HTTPS request: " + https.errorToString(httpCode).c_str());
            isActive = false;
            displayStatus = 5;
        }
        Serial.println(https.errorToString(httpCode).c_str());
        https.end();
        Serial.println("Gerät freischalten Fertig");
        lastDisplayStatus - 1;
        timestampLastChange = millis();
    }
};

int Machine::machineCount = 0;
Machine Machine::machines[Machine::maxMachines];
unsigned long Machine::safetyInstructionDate = 0;
String Machine::whitelist[maxWhitelistSize];
int Machine::whitelistCount = 0;

#endif  // MEINE_DEF_H