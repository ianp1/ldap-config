<?php

    require '../vendor/autoload.php';
    include_once("auth.php");


	use \PhpMqtt\Client\MqttClient;
	use \PhpMqtt\Client\ConnectionSettings;

    use OpenSwoole\Websocket\{
        Server,
        Frame
    };
    use OpenSwoole\Constant;
    use OpenSwoole\Table;

    $server = new Server("0.0.0.0", 9501, Server::SIMPLE_MODE, Constant::SOCK_TCP);
    $fds = new Table(1024);
    $fds->column('fd', Table::TYPE_INT, 4);
    $fds->column('name', Table::TYPE_STRING, 16);
    $fds->create();

    $loopStart = 0;

    $connectionSettings = (new ConnectionSettings)
        -> setUsername($APP_MQTT_USERNAME)
        -> setPassword($APP_MQTT_PASSWORD)
        -> setKeepaliveInterval(60)
        -> setUseTls(true);

    $mqtt = new MqttClient(
        "mqtt.fablab-luebeck.de", 
        1883, 
        "mitglied_web_app_websocket",
        MqttClient::MQTT_3_1_1
    );



    $ldaphost = "ldap-provider.fablab-luebeck.de";
    $ldapport = 389;
    $ldap_base_dn =  "dc=ldap-provider,dc=fablab-luebeck";
    //ldap_set_option(NULL, LDAP_OPT_DEBUG_LEVEL, 7);
    $ldapconn = ldap_connect($ldaphost, $ldapport);

    ldap_set_option($ldapconn,LDAP_OPT_PROTOCOL_VERSION,3);
    ldap_start_tls($ldapconn);

    $ldapbind = ldap_bind($ldapconn, $APP_LDAP_USERNAME, $APP_LDAP_PASSWORD);
		
    $topics = array();

    $server->on("Start", function (Server $server) use ($mqtt, $connectionSettings) {
        echo "Swoole WebSocket Server is started at " . $server->host . ":" . $server->port . "\n";
        $loopStart = microtime(true);

        $mqtt -> connect($connectionSettings);
        setupMqttSubscriptions();
    });

    $server->on('Open', function (Server $server, Swoole\Http\Request $request) use ($fds, $mqtt, &$topics) {
        $fd = $request->fd;
        $clientName = sprintf("Client-%'.06d\n", $request->fd);

        setupMqttSubscriptions();
        $server -> after(500, function () use ($server, $fd, $clientName, $mqtt, &$topics) {
            foreach ($topics as $topic) {
                $mqtt -> publish ($topic["command"], 'status_update');
            }
        });

        $fds->set($request->fd, [
            'fd' => $fd,
            'name' => sprintf($clientName)
        ]);
    });

    $server->on('Close', function (Server $server, int $fd) use ($fds) {
        $fds->del($fd);
        echo "Connection close: {$fd}, total connections: " . $fds->count() . "\n";
    });

    $server->on('Disconnect', function (Server $server, int $fd) use ($fds) {
        $fds->del($fd);
        echo "Disconnect: {$fd}, total connections: " . $fds->count() . "\n";
    });

    $server->on('Message', function (Server $server, Frame $frame) use ($fds, &$topics, $mqtt) {
        echo "received message from {$frame->fd}: {$frame->data}\n";
        try {
            $message = json_decode($frame->data, true);
            
            if (isset($message["deviceId"]) && isset($topics[$message["deviceId"]])) {
                $topics[$message["deviceId"]]["lastUpdate"] = 0;
                $mqtt -> publish ($topics[$message["deviceId"]]["command"], "status_update");
            }
        } catch (Exception $e) {
            echo "Error: {$e->getMessage()}\n";
        }
    });

    $server->tick(200, function () use ($server, $mqtt, $loopStart) {
        $mqtt -> loopOnce($loopStart, false);
    });


    $server->start();

    


    function setupMqttSubscriptions() {
        global $server, $fds, $mqtt, $topics, $ldapconn, $ldap_base_dn;
        foreach ($topics as $topic) {
            $mqtt -> unsubscribe($topic["status"]);
        }

        $topics = array();
        $geraetInstanzSearch = ldap_search(
            $ldapconn, 
            "ou=einweisung,".$ldap_base_dn, 
            "(objectClass=geraetInstanz)", 
            array("dn", "mqttChannel"));

        $geraetInstanzResult = ldap_get_entries($ldapconn, $geraetInstanzSearch);

        foreach ($geraetInstanzResult as $geraetInstanz) {
            if (isset($geraetInstanz["mqttchannel"])) {
                //{"status": "machines/v2/Standbohrmaschine/status/input:0","statusName":"state","enable": "machines/v2/Standbohrmaschine/rpc","switchId":0,"command":"machines/v2/Standbohrmaschine/command"}
                $mqttChannels = json_decode($geraetInstanz["mqttchannel"][0], true);

                $topics[$geraetInstanz["dn"]] = $mqttChannels;
                $topics[$geraetInstanz["dn"]]["lastUpdate"] = 0;

                echo "subscribing to {$mqttChannels["status"]}\n";
                $mqtt -> subscribe($mqttChannels["status"], function (string $topic, string $message) use (&$topics, $server, $fds, $geraetInstanz, $mqttChannels) {
                    if ($topics[$geraetInstanz["dn"]]["lastUpdate"] > time() - 5) {
                        return;
                    }


                    $statusMessage = json_decode($message, true);
                    $statusName = "output";
                    if (isset($mqttChannels["statusName"])) {
                        $statusName = $mqttChannels["statusName"];
                    }

                    $topics[$geraetInstanz["dn"]]["lastUpdate"] = time();

                    $updateMessage = array(
                        "deviceId" => $geraetInstanz["dn"],
                        "status" => 'online',
                        "enabled" => $statusMessage[$statusName],
                    );
            
                    foreach ($fds as $key => $value) {
                        $server->push($key,  json_encode($updateMessage));
                    }
                });
            }
        }

    }

        

?>