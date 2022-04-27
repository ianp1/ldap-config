const mqtt = require('mqtt');
const axios = require('axios').default;
const auth = require('./auth.js');

const mqttOptions = {
    host: "mqtt.fablab-luebeck.de",
    port: 1883,
    protocol: "tls",
    clientId: auth.clientId,
    protocolId: "MQTT",
    protocolVersion: 4,
    username: auth.username,
    password: auth.password
};
const client = mqtt.connect(mqttOptions);

client.on('connect', function() {
    console.log("connected");
    //TODO: Remove
    client.subscribe('machines/ELab_Tisch_1/card');
    client.publish('machines/ELab_Tisch_1', 'hi');
});

client.on('message', function(topic, message) {
    
    console.log("received message ", message.toString(), " on topic ", topic);

    try {
        let details = JSON.parse(message);
        let machine = "geraetname="+details.machine+",ou=einweisung,dc=ldap-provider,dc=fablab-luebeck";
        let sourceMac = details.terminalMac;
        let rfid = details.rfid;
        
        axios.get('https://einweisungen.fablab-luebeck.de/api/v1.0/Einweisung/'+rfid+'/'+machine+'?author_bot=terminal&author_password=LwRa2RPYY')
        .then(response => {
            console.log("response is: ", response.data);

            //TODO: Parse values
            let einweisung = response.data.einweisung;
            let sicherheitsbelehrung = response.data.sicherheitsbelehrung;
            let aktiviert = response.data.aktiviert;
            let payload = {
                terminalMac: sourceMac,
                einweisung: einweisung,
                aktiviert: aktiviert,
                sicherheitsbelehrung: sicherheitsbelehrung
            };
            let newTopic = topic.split("/");
            newTopic = newTopic[0] + "/" + newTopic[1];
            client.publish(newTopic, JSON.stringify(payload));
            client.publish(newTopic+"/active", "1");
        }).catch(error => {
            client.publish(topic, JSON.stringify({
                terminalMac: sourceMac,
                einweisung: false,
                sicherheitsbelehrung: false
            }))
            console.log("error requesting data: ", error);
        });
    } catch(e) {
        //console.log(e);
    }
});

client.on('error', function(err) {
    console.log("Error: ", err);
});