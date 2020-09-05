## Über dieses Projekt
Dieses Repository enthält die verschiedenen Software-Komponenten die im FabLab Lübeck zur Verwaltung der Einweisungen und Mitgliedsdatensätze verwendet wird.
Zur Verwendung werden im Wesentlichen ein OpenLDAP-Server, ein Webserver und Geräteterminals (beschrieben in DiMaS) benötigt. 
Zur Authentifizierung dienen RFID-Karten.

Die Teilkomponenten werden hier kurz Beschrieben, genauere Beschreibungen in den Unterordnern

### DiMaS
Hier befindet sich ein ESP8266-Sketch zum Auslesen von RFID-Chips und zur Bestätigung von Einweisungen über eine REST-Schnittstelle. Außerdem liegen hier Skripte zum komfortablen Update von mehreren ESPs in einem Netzwerk

### einweisungImport
Dieser Ordner enhält ein Java-Programm zum Import von Excel-Daten in die LDAP-Datenbank. Es ist auf die alte Datenstruktur des FabLabs ausgelegt, kann aber leicht angepasst werden

### ansible_setup
Hier werden Ansible-Dokumente gesammelt, die der komfortablen Einrichtung von LDAP-Authentifizierung unter Linux-Geräten dienen

### mitglied_web
Eine Angular-Anwendung, die mithilfe eines PHP-Backends den OpenLDAP-Server anspricht um eine Benutzeroberfläche für die Mitglieder- und Einweisungsverwaltung bereitzustellen.

### masterterminal
Eine angepasste Version der Mitgliederverwaltung, die auf einem Raspberry pi genutzt werden kann um die Einweisungen eines Nutzers mit einer RFID-Karte aufzulisten

### structure
Enhält die Datenstruktur des OpenLDAP-Verzeichnisses. 

### rfid_reader 
Dieses Arduino Pro Mini-Programm dient der Tastatur-Eingabe von RFID-IDs. Das hiermit gebaute Terminal dient der Eingabe der IDs ins mitglied-web-Programm

