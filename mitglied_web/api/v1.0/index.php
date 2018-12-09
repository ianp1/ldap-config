<?php
	require '../vendor/autoload.php';
	require 'cors.php';

	use \Psr\Http\Message\ServerRequestInterface as Request;
	use \Psr\Http\Message\ResponseInterface as Response;

	$app = new \Slim\App;

	$app -> add(function($request, $response, $next) {
		if ($request -> getMethod() == "OPTIONS") {
			$response = $next($request, $response);
			return $response;
		}


		$ldaphost = "192.168.3.4";
		$ldapport = 389;
		$ldap_base_dn =  "dc=ldap-provider,dc=fablab-luebeck";

		$ldapconn = ldap_connect($ldaphost, $ldapport);
		if (!$ldapconn) {
			$response -> getBody() -> write("LDAP-Server Verbindung nicht möglich<br>");
			$response -> getBody() -> write(ldap_error($ldapconn));
			return $response -> withStatus(500);
		}

		$request = $request -> withAttribute("ldapconn", $ldapconn);
		$request = $request -> withAttribute("ldap_base_dn", $ldap_base_dn);

		return $response -> withStatus(500);

		ldap_set_option($ldapconn,LDAP_OPT_PROTOCOL_VERSION,3);
		ldap_start_tls($ldapconn);

		//Login if possible
		if ($request -> getMethod() === "GET") {
			$params = $request -> getQueryParams();
		} else if ($request -> getMethod() === "POST") {
			$params = $request -> getParsedBody();
		}

		$AuthorUser = $params["author_user"];
		$AuthorBot = $params["author_bot"];
		$AuthorPassword = $params["author_password"];

		if (isset($AuthorUser, $AuthorPassword)) {
			$user = "uid=".$AuthorUser.",ou=user,".$ldap_base_dn;
		} else if (isset($AuthorBot, $AuthorPassword)) {
			$user = "cn=".$params['author_bot'].",ou=bot,".$ldap_base_dn;
		}

		if (!ldap_bind($ldapconn, $user, $AuthorPassword)) {
			return $response -> withStatus(401);
		}

		$response = $next($request, $response);

		ldap_close($ldapconn);

		return $response;
	});

	/**
	* $RequestRfid : RFID-Token das verknüpft werden soll
	* $RequestUser : DN des zu verknüpfenden Benutzers
	* author_user : UID des anfragenden Nutzers
	* author_password : Passwort des anfragenden Nutzers
	*
	* Verknüpft ein RFID-Token mit einem Nutzern
	* Löscht alte Verknüpfungen
	*/
	$app -> post('/RFID/{RequestRfid}/{RequestUser}', function(Request $request, Response $response, array $args) {
		$RequestRfid = $args['RequestRfid'];
		$RequestUser = $args['RequestUser'];

		$ldapconn = $request -> getAttribute('ldapconn');
		$ldap_base_dn = $request -> getAttribute('ldap_base_dn');

		$dn = "ou=user,".$ldap_base_dn;
		$filter = "(&(objectClass=fablabPerson)(rfid=$RequestRfid))";

		//Alte Verknüpfungen löschen
		$user = ldap_search($ldapconn, $dn, $filter, array("dn", "rfid"));
		$userResult = ldap_get_entries($ldapconn, $user);

		for ($i = 0; $i < $userResult["count"]; $i ++) {
			ldap_mod_replace($ldapconn, $userResult[$i]["dn"], array("rfid"=>array()));
		}

		//Neue Verknüpfung anlegen
		$user = ldap_read($ldapconn, $RequestUser, "(objectClass=fablabPerson)", array("rfid"));
		$userResult = ldap_get_entries($ldapconn, $user);

		return $response -> withJson(ldap_mod_replace($ldapconn, $userResult[0]["dn"], array("rfid"=>$RequestRfid)), 201);
	});

	$app -> get('/RFID/{RequestRfid}', function(Request $request, Response $response, array $args) {
		$RequestRfid = $args['RequestRfid'];

		$ldapconn = $request -> getAttribute('ldapconn');
		$ldap_base_dn = $request -> getAttribute('ldap_base_dn');

		$dn = "ou=user,".$ldap_base_dn;
		$filter = "(&(objectClass=fablabPerson)(rfid=$RequestRfid))";
		$user = ldap_search($ldapconn, $dn, $filter, array("dn","cn","sn","geburtstag","uid"));
		$userResult = ldap_get_entries($ldapconn, $user);

		if ($userResult["count"] === 0) {
			return $response -> withStatus(404);
		}

		$ar = array();
		for ($i = 0; $i < $userResult["count"]; $i ++) {
			array_push($ar, array(
				"dn" => $userResult[$i]["dn"],
				"cn" => $userResult[$i]["cn"][0],
				"sn" => $userResult[$i]["sn"][0],
				"geburtstag" => $userResult[$i]["geburtstag"][0],
				"uid" => $userResult[$i]["uid"][0]
			));
		}

		return $response -> withJson($ar, 201);
	});

	/**
	* $RequestUser : DN oder uid des zu prüfenden Benutzers
	* author_user : UID des anfragenden Nutzers
	* author_password : Passwort des anfragenden Nutzers
	*
	* Gibt alle Einweisungen des Nutzers zurück
	*/
	$app -> get('/Einweisung/{RequestUser}', function(Request $request, Response $response, array $args) {
		$RequestUser = $args['RequestUser'];

		$ldapconn = $request -> getAttribute('ldapconn');
		$ldap_base_dn = $request -> getAttribute('ldap_base_dn');

		if (strpos($RequestUser, $ldap_base_dn) === false) {
			$RequestUser = "uid=".$RequestUser.",ou=user,".$ldap_base_dn;
		}

		$dn = "ou=einweisung,".$ldap_base_dn;
		$searchTerm = "(&(objectClass=einweisung)(eingewiesener=$RequestUser))";

		$einweisungen = ldap_search($ldapconn, $dn, $searchTerm, array("einweisungsdatum"));
		$einweisungenResult = ldap_get_entries($ldapconn, $einweisungen);
		$ar = array();
		for ($i = 0; $i < $einweisungenResult["count"]; $i++) {
			$parent = "";
			$split = ldap_explode_dn($einweisungenResult[$i]["dn"], 0);
			for ($j = 1; $j < $split["count"]; $j++) {
				if ($j != 1) {
					$parent = $parent.",";
				}
				$parent = $parent.$split[$j];
			}

			$geraet = ldap_get_entries($ldapconn, ldap_read($ldapconn, $parent, "(objectClass=geraet)", array("geraetname","cn")));

			array_push($ar, array(
				"datum"=>$einweisungenResult[$i]["einweisungsdatum"][0],
				"geraet"=>array(
					"geraetname"=>$geraet[0]["geraetname"][0],
					"cn"=>$geraet[0]["cn"][0]
				)
			));
		}

		return $response -> withJson($ar, 201);
	});

	/**
	* $RequestToken : RFID-Token des Abgefragten Nutzers
	* $RequestMachine : DN der Angefragten Maschine
	* author_user : UID des anfragenden Nutzers
	* author_password : Passwort des anfragenden Nutzers
	*
	* Prüft ob Einweisung in Gerät für Nutzer vorhanden ist
	*/
	$app -> get('/Einweisung/{RequestToken}/{RequestMachine}', function (Request $request, Response $response, array $args) {
		$RequestToken = $args['RequestToken'];
		$RequestMachine = $args['RequestMachine'];

		$ldapconn = $request -> getAttribute('ldapconn');
		$ldap_base_dn = $request -> getAttribute('ldap_base_dn');

		$dn = "ou=user,".$ldap_base_dn;
		$userterm = "(&(objectClass=fablabPerson)(rfid=$RequestToken))";

		$RequestUserErg = ldap_search($ldapconn, $dn, $userterm, array("dn"));
		$RequestUserResults = ldap_get_entries($ldapconn, $RequestUserErg);

		if ($RequestUserResults["count"] === 1) {
			$RequestUser = $RequestUserResults[0]["dn"];

			$einweisungdn = $RequestMachine;
			$einweisungterm = "(&(objectClass=einweisung)(eingewiesener=$RequestUser))";

			$einweisungErg = ldap_search($ldapconn, $einweisungdn, $einweisungterm, array("dn"));
			$einweisungResult = ldap_get_entries($ldapconn, $einweisungErg);

			if ($einweisungResult['count'] === 1) {
				$response -> getBody() -> write("true\n");
				return $response -> withStatus(201);
			}
		}

		$response -> getBody() -> write("false\n");
		return $response -> withStatus(201);
	});


	$app -> post('/Sicherheitsbelehrung/{RequestUser}/{RequestDate}', function (Request $request, Response $response, array $args) {
		$RequestUser = $args['RequestUser'];
		$RequestDate = $args['RequestDate'];

		$ldapconn = $request -> getAttribute("ldapconn");
		$ldap_base_dn = $request -> getAttribute("ldap_base_dn");
		$entry["sicherheitsbelehrung"] = $RequestDate;
		return $response -> withJson(ldap_mod_replace($ldapconn, $RequestUser, $entry), 201);
	});

	/**
	* $RequestUser : DN des zu ändernden Nutzers
	* $RequestMachine : DN der eingewiesenen Maschine
	* $RequestDate : Datum der Einweisung in LDAP-Format
	* author_user : UID des anfragenden Nutzers
	* author_password : Passwort des anfragenden Nutzers
	*
	* Legt eine Einweisung am gegebenen Datum für den zu ändernden Nutzer an
	* Prüft ob bereits eine Einweisung vorhanden ist und updated diese ggf.
	*/
	$app -> post('/Einweisung/{RequestUser}/{RequestMachine}/{RequestDate}', function (Request $request, Response $response, array $args) {
		$RequestUser = $args['RequestUser'];
		$RequestMachine = $args['RequestMachine'];
		$RequestDate = $args['RequestDate'];

		$ldapconn = $request -> getAttribute('ldapconn');
		$ldap_base_dn = $request -> getAttribute('ldap_base_dn');

		//TODO: Sanitycheck inputs!
		$existDN = $RequestMachine;
		$existFilter = "(&(objectClass=einweisung)(eingewiesener=$RequestUser))";
		$einweisungErg = ldap_search($ldapconn, $existDN, $existFilter, array("dn", "einweisungsdatum"));
		$einweisungResult = ldap_get_entries($ldapconn, $einweisungErg);

		$debug = var_export($einweisungResult, true);

		if ($einweisungResult['count'] > 1) {
			return $result -> withJson("Einweisungen inkonsistent. Bitte einem Administrator melden", 500);
		} else if ($einweisungResult['count'] === 1) {
			$currentDate = $einweisungResult[0]["einweisungsdatum"][0];
			$DN = $einweisungResult[0]["dn"];

			if (compareLDAPDates($RequestDate, $currentDate)) {
				//Aktuell ist neuer,
				//Nichts tun
				return $response -> withJson("not updating", 201);
			} else {
				$entry = array();
				$entry["einweisungsdatum"]=$RequestDate;
				return $response -> withJson(ldap_mod_replace($ldapconn, $DN, $entry));
			}
		} else {
			$entry = array();
			$entry["objectClass"] = "einweisung";
			$entry["eingewiesener"] = $RequestUser;
			$entry["einweisungsdatum"] = $RequestDate;
			$entry["distinctname"] = uniqid("e_");

			return $response -> withJson(ldap_add($ldapconn, "distinctname=".$entry['distinctname'].",".$RequestMachine, $entry), 201);

		}
	});

	$app -> post('/User/{Vorname}/{Nachname}/{Geburtstag}/{Sicherheitsbelehrung}', function(Request $request, Response $response, array $args) {
		$RequestVorname = $args['Vorname'];
		$RequestNachname = $args['Nachname'];
		$RequestGeburtstag = $args['Geburtstag'];
		$RequestSicherheitsbelehrung = $args['Sicherheitsbelehrung'];
		//$RequestGeburtstag = "19950111183220.733Z";

		$ldapconn = $request -> getAttribute('ldapconn');
		$ldap_base_dn = $request -> getAttribute('ldap_base_dn');

		//TODO: Sanitycheck inputs!

		$entry = array();
		$entry["objectClass"][0] = "inetOrgPerson";
		$entry["objectClass"][1] = "fablabPerson";
		$entry["uid"] = $RequestVorname.$RequestNachname;
		$entry["cn"] = $RequestVorname;
		$entry["sn"] = $RequestNachname;
		$entry["geburtstag"] = $RequestGeburtstag;
		$entry["sicherheitsbelehrung"] = $RequestSicherheitsbelehrung;

		$dn = "uid=".$entry["uid"].",ou=user,dc=ldap-provider,dc=fablab-luebeck";
		$test = ldap_read($ldapconn, $dn, "(objectClass=*)");
		$i = 0;

		while ($test) {
			$i++;
			$dn = "uid=".$entry["uid"].$i.",ou=user,dc=ldap-provider,dc=fablab-luebeck";
			$test = ldap_read($ldapconn, $dn, "(objectClass=*)");
		}
		if ($i != 0) {
			$entry["uid"] = $entry["uid"].$i;
		}

		if (ldap_add($ldapconn, $dn, $entry)) {
			return $response -> withJson($dn, 201);
		} else {
			$response -> getBody() -> write(ldap_error($ldapconn));
			ldap_get_option($ldapconn, LDAP_OPT_DIAGNOSTIC_MESSAGE, $err);
			$response -> getBody() -> write("ldap_get_option: ".$err);
			return $response;
			return $response -> withJson("false", 201);
		}
	});

	/**
	* $search_term : Name der gesucht wird
	* author_user : UID des anfragenden Benutzers
	* author_password : Passwort des anfragenden Benutzers
	*
	* Sucht nach Nutzern die zum Suchterm passen
	*/
	$app -> get('/User/{SearchTerm}', function (Request $request, Response $response, array $args) {
		$st = $args['SearchTerm'];

		$ldapconn = $request -> getAttribute("ldapconn");
		$ldap_base_dn = $request -> getAttribute("ldap_base_dn");

		$dn = "ou=user,".$ldap_base_dn;
		$term = "(&(objectClass=inetOrgPerson)(|(cn=*$st*)(sn=*$st*)(uid=*$st*)))";

		$erg = ldap_search($ldapconn, $dn, $term, array("cn", "sn", "uid", "dn"));
		$results = ldap_get_entries($ldapconn, $erg);
		$ar = array();
		for ($i = 0; $i < $results['count']; $i++) {
			array_push($ar, array(
				"vorname"=>$results[$i]["cn"][0],
				"nachname"=>$results[$i]["sn"][0],
				"uid"=>$results[$i]["uid"][0],
				"dn"=>$results[$i]["dn"]
			));
		}
		return $response -> withJson($ar, 201);
	});

	/**
	* $vorname : Vorname des gesuchten Benutzers
	* $nachname : Nachname des gesuchten Benutzers
	* $geburtsdatum : Geburtstag des gesuchten Benutzers
	* author_user : UID des anfragenden Benutzers
	* author_password : Passwort des anfragenden Benutzers
	*
	* Sucht Nutzer mit gegebenen Daten
	*/
	$app -> get('/User/{vorname}/{nachname}/{geburtsdatum}', function(Request $request, Response $response, array $args) {
		$vorname = $args['vorname'];
		$nachname = $args['nachname'];
		$geburtsdatum = $args['geburtsdatum'];

		$searchTerm = "(&(objectClass=inetOrgPerson)(cn=$vorname)(sn=$nachname)(geburtstag=$geburtsdatum))";

		$ldapconn = $request -> getAttribute("ldapconn");
		$ldap_base_dn = $request -> getAttribute("ldap_base_dn");

		$dn = "ou=user,".$ldap_base_dn;

		$erg = ldap_search($ldapconn, $dn, $searchTerm, array("cn", "sn", "uid", "dn"));
		$results = ldap_get_entries($ldapconn, $erg);
		$ar = array();
		for ($i = 0; $i < $results['count']; $i++) {
			array_push($ar, array(
				"vorname"=>$results[$i]["cn"][0],
				"nachname"=>$results[$i]["sn"][0],
				"uid"=>$results[$i]["uid"][0],
				"dn"=>$results[$i]["dn"]
			));
		}

		return $response -> withJson($ar, 201);
	});

	/**
	* Gibt alle vorhandenen Geräte des Fablab zurück
	*/
	$app -> get('/Maschinen', function(Request $request, Response $response, array $args) {
		$ldap_base_dn = $request -> getAttribute("ldap_base_dn");
		$ldapconn = $request -> getAttribute("ldapconn");

		$dn = "ou=einweisung,".$ldap_base_dn;
		$filter = "(objectClass=geraet)";

		$sr = ldap_search($ldapconn, $dn, $filter, array("geraetname", "dn"));

		$result = ldap_get_entries($ldapconn, $sr);
		$ar = array();

		for ($i = 0; $i < $result['count']; $i++) {
			array_push($ar, array("name"=>$result[$i]["geraetname"][0], "dn"=>$result[$i]["dn"]));
		}

		return $response -> withJson($ar, 201);
	});

	/**
	* author_user : UID des anfragenden Benutzers
	* author_password : Passwort des anfragenden Benutzers
	*
	* Überprüft Zugangsdaten
	*/
	$app -> get('/Authentifizierung', function(Request $request, Response $response, array $args) {
		$ldapconn = $request -> getAttribute("ldapconn");
		$ldap_base_dn = $request -> getAttribute("ldap_base_dn");

			return $response -> withJson(true, 201);
	});

	$app -> run();

	/**
	*	Compares LDAP-Dates, does NOT care for times
	*/
	function compareLDAPDates($date1, $date2) {
		for ($i = 0; $i < 8; $i++) {
			if (intval($date1[$i]) < intval($date2[$i])) {
				return true;
			}
		}

		return false;
	}
?>
