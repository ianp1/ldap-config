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

		ldap_set_option($ldapconn,LDAP_OPT_PROTOCOL_VERSION,3);
		ldap_start_tls($ldapconn);

		//Login if possible
		if ($request -> getMethod() === "GET"
									|| $request -> getMethod() === "DELETE") {
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

		$request = $request -> withAttribute("request_user", $user);

		if (!ldap_bind($ldapconn, $user, $AuthorPassword)) {
			return $response -> withStatus(401);
		}

		$response = $next($request, $response);

		ldap_close($ldapconn);
		return $response;
	});

	$app -> get('/Mitglied/{RequestUser}', function(Request $request, Response $response, array $args) {
		$userDn = $args['RequestUser'];
		$ldapconn = $request -> getAttribute('ldapconn');

		$vals = $request -> getParsedBody();

		$user = ldap_read($ldapconn, $userDn, "(|(objectClass=fablabPerson)(objectClass=fablabMitglied)(objectClass=mitgliedTeilhaber))");
		$userResult = ldap_get_entries($ldapconn, $user)[0];

		$result = array(
			"anrede" => $userResult["anrede"][0],
			"beitragsanpassung" => $userResult["beitragsanpassung"][0],
			"bic"=> $userResult["bic"][0],
			"email"=> $userResult['mail'][0],
			"beitragsanpassungBis"=>$userResult["beitragsanpassungbis"][0],
			"geburtsdatum"=>$userResult["geburtstag"][0],
			"iban"=>$userResult["iban"][0],
			"kontoinhaber"=>$userResult["kontoinhaber"][0],
			"mitgliedschaft"=>$userResult["mitgliedsart"][0],
			"nachname"=>$userResult["sn"][0],
			"notfallkontakt"=>$userResult["notfallkontakt"][0],
			"ort"=>$userResult["ort"][0],
			"plz"=>$userResult["plz"][0],
			"strasse"=>$userResult["strasse"][0],
			"telefon"=>$userResult["homephone"][0],
			"titel"=>$userResult["title"][0],
			"vorname"=>$userResult["cn"][0],
			"beginnMitgliedschaft"=>$userResult["beginn"][0],
			"kommentar"=>$userResult["description"][0]
		);



		return $response->withJson($result, 201);
	});

	$app -> post('/Mitglied/{RequestUser}', function (Request $request, Response $response, array $args) {
		$userDn = $args['RequestUser'];
		$ldapconn = $request -> getAttribute('ldapconn');

		$vals = $request -> getParsedBody();
		$valid = true;
		$pflichtfelder = array(
			"anrede",
			"bic",
			"email",
			"geburtsdatum",
			"iban",
			"kontoinhaber",
			"mitgliedschaft",
			"nachname",
			"ort",
			"plz",
			"strasse",
			"telefon",
			"vorname",
			"beginnMitgliedschaft",
		);
		if (!isset($vals)) {
			$valid = false;
		}
		foreach($pflichtfelder as $pflicht) {
			if (!isset($vals[$pflicht]) || $vals[$pflicht] == '') {
				$valid = false;
			}
		} 
		if (!$valid) {
			return $response -> withStatus(400);
		}

		$user = ldap_read($ldapconn, $userDn, "(objectClass=fablabPerson)");
		$userResult = ldap_get_entries($ldapconn, $user);

		$newClasses = array();
		foreach ($userResult[0]["objectclass"] as $key => $cl) {
			if ($key !== "count" && $cl != "fablabPerson") {
				array_push($newClasses, $cl);
			}
		}
		if (!in_array("fablabMitglied", $newClasses)) {
			array_push($newClasses, "fablabMitglied");
		}
		if (!in_array("inetOrgPerson", $newClasses)) {
			array_push($newClasses, "inetOrgPerson");
		}

		$newValues = array(
			"objectClass"=> $newClasses,
			"anrede"=> $vals["anrede"],
			"beitragsanpassung"=> $vals["beitragsanpassung"],
			"bic"=> $vals["bic"],
			"mail"=> $vals['email'],
			"beitragsanpassungBis"=>$vals["beitragsanpassungBis"],
			"geburtstag"=>$vals["geburtsdatum"],
			"iban"=>$vals["iban"],
			"kontoinhaber"=>$vals["kontoinhaber"],
			"mitgliedsart"=>$vals["mitgliedschaft"],
			"sn"=>$vals["nachname"],
			"notfallkontakt"=>$vals["notfallkontakt"],
			"ort"=>$vals["ort"],
			"plz"=>$vals["plz"],
			"strasse"=>$vals["strasse"],
			"homePhone"=>$vals["telefon"],
			"title"=>$vals["titel"],
			"cn"=>$vals["vorname"],
			"beginn"=>$vals["beginnMitgliedschaft"],
			"description"=>$vals["kommentar"]
		);

		foreach($newValues as $key=>$val) {
			if ($val === '') {
				$newValues[$key] = array();
			}
		}

		$ldapconn = $request -> getAttribute('ldapconn');

		if (ldap_mod_replace($ldapconn, $userDn, $newValues)) {
			return $response -> withJson(true, 201);
		} else {
			return $response -> withStatus(500);
		}

		return $response;
	});

	$app -> post('/Mitgliedteil/{MitgliedBesitzer}/{NeuMitglied}', function (Request $request, Response $response, array $args) {
		$mitgliedBesitzerDn = $args['MitgliedBesitzer'];
		$neuMitgliedDn = $args['NeuMitglied'];
		$ldapconn = $request -> getAttribute('ldapconn');

		$vals = $request -> getParsedBody();
		$valid = true;
		$pflichtfelder = array(
			"anrede",
			"email",
			"geburtsdatum",
			"nachname",
			"ort",
			"plz",
			"strasse",
			"telefon",
			"vorname",
			"beginnMitgliedschaft"
		);
		if (!isset($vals)) {
			$valid = false;
		}
		foreach($pflichtfelder as $pflicht) {
			if (!isset($vals[$pflicht]) || $vals[$pflicht] == '') {
				$valid = false;
			}
		} 
		if (!$valid) {
			return $response -> withStatus(400);
		}

		$user = ldap_read($ldapconn, $neuMitgliedDn, "(objectClass=fablabPerson)");
		$userResult = ldap_get_entries($ldapconn, $user);


		$newClasses = array();
		foreach ($userResult[0]["objectclass"] as $key => $cl) {
			if ($key !== "count" && $cl != "fablabPerson") {
				array_push($newClasses, $cl);
			}
		}
		if (!in_array("mitgliedTeilhaber", $newClasses)) {
			array_push($newClasses, "mitgliedTeilhaber");
		}
		if (!in_array("inetOrgPerson", $newClasses)) {
			array_push($newClasses, "inetOrgPerson");
		}

		$newValues = array(
			"objectClass"=> $newClasses,
			"anrede"=> $vals["anrede"],
			"mail"=> $vals['email'],
			"geburtstag"=>$vals["geburtsdatum"],
			"sn"=>$vals["nachname"],
			"notfallkontakt"=>$vals["notfallkontakt"],
			"ort"=>$vals["ort"],
			"plz"=>$vals["plz"],
			"strasse"=>$vals["strasse"],
			"homePhone"=>$vals["telefon"],
			"title"=>$vals["titel"],
			"cn"=>$vals["vorname"],
			"beginn"=>$vals["beginnMitgliedschaft"],
			"description"=>$vals["kommentar"],
			"geteiltMit"=>$mitgliedBesitzerDn,
		);

		foreach($newValues as $key=>$val) {
			if ($val === '') {
				$newValues[$key] = array();
			}
		}

		$ldapconn = $request -> getAttribute('ldapconn');

		if (ldap_mod_replace($ldapconn, $neuMitgliedDn, $newValues)) {
			return $response -> withJson(true, 201);
		} else {
			return $response -> withStatus(500);
		}

		return $response;
	});

	/**
	* Entfernt die gegebene Einweisung
	*/
	$app -> delete('/Einweisungen/{dn}', function(Request $request, Response $response, array $args) {
		$deleteDN = $args['dn'];
		$ldapconn = $request -> getAttribute('ldapconn');

		ldap_delete($ldapconn, $deleteDN);
	});

	/**
	* author_user : DN des anfragenden Nutzers
	* author_password : Passwort des anfragenden Nutzers
	*
	* Gibt die Einweisungen der letzten 24 Stunden des gegebenen Nutzers zurueck
	*/
	$app -> get('/Einweisungen/Recent', function(Request $request, Response $response, array $args) {
		$ldapconn = $request -> getAttribute('ldapconn');
		$ldap_base_dn = $request -> getAttribute('ldap_base_dn');
		$userDn = $request -> getAttribute("request_user");

		$date = date("YmdHis", time() - 60 * 60 * 24)."Z";
		$dn = "ou=einweisung,dc=ldap-provider,dc=fablab-luebeck";
		$timeFilter = "(|(modifyTimestamp>=$date)(createTimestamp>=$date))";
		$filter = "(&(objectClass=einweisung)$timeFilter(creatorsName=$userDn))";

		$einweisungen = ldap_search($ldapconn, $dn, $filter, array("einweisungsdatum", "dn", "eingewiesener"));
		$einweisungenResult = ldap_get_entries($ldapconn, $einweisungen);

		//return $response -> withJson($einweisungenResult, 201);

		$ar = array();
		for ($i = 0; $i < $einweisungenResult["count"]; $i ++) {
			$parent = "";
			$split = ldap_explode_dn($einweisungenResult[$i]["dn"], 0);
			for ($j = 1; $j < $split["count"]; $j++) {
				if ($j != 1) {
					$parent = $parent.",";
				}
				$parent = $parent.$split[$j];
			}

			$eingewiesener = ldap_get_entries($ldapconn, ldap_search($ldapconn,
							$einweisungenResult[$i]["eingewiesener"][0], "(objectClass=fablabPerson)",
							array("dn", "uid", "sn", "cn", "geburtstag")));
			$geraet = ldap_get_entries($ldapconn, ldap_search($ldapconn,
							$parent, "(objectClass=geraet)",
							array("geraetname", "cn")));

			//return $response -> withJson($eingewiesener, 201);
			unset($eingewiesener[0]["sn"]["count"]);
			unset($eingewiesener[0]["cn"]["count"]);
			array_push($ar, array(
				"datum" => $einweisungenResult[$i]["einweisungsdatum"][0],
				"dn" => $einweisungenResult[$i]["dn"],
				"geraet" => array(
					"geraetname"=>$geraet[0]["geraetname"][0],
					"cn"=>$geraet[0]["cn"][0]
				),
				"eingewiesener" => array(
					"dn"=>$eingewiesener[0]["dn"][0],
					"uid"=>$eingewiesener[0]["uid"][0],
					"sn"=>implode(" ", $eingewiesener[0]["sn"]),
					"cn"=>implode(" ", $eingewiesener[0]["cn"]),
					"geburtstag"=>$eingewiesener[0]["geburtstag"][0]
				)
			));
		}

		$belehrungen = array();
		$sicherheitsbelehrungen = ldap_get_entries($ldapconn, ldap_search($ldapconn,
						"ou=user,dc=ldap-provider,dc=fablab-luebeck", $timeFilter, array("cn", "sn",
								"geburtstag", "sicherheitsbelehrung")));

		for ($i = 0; $i < $sicherheitsbelehrungen["count"]; $i++) {
			unset($sicherheitsbelehrungen[$i]["cn"]["count"]);
			unset($sicherheitsbelehrungen[$i]["sn"]["count"]);
			array_push($belehrungen, array(
				"cn"=>implode(" ", $sicherheitsbelehrungen[$i]["cn"]),
				"sn"=>implode(" ", $sicherheitsbelehrungen[$i]["sn"]),
				"geburtstag"=>$sicherheitsbelehrungen[$i]["geburtstag"][0],
				"sicherheitsbelehrung"=>$sicherheitsbelehrungen[$i]["sicherheitsbelehrung"][0]
			));
		}

		return $response -> withJson(array("einweisungen"=>$ar, "sicherheitsbelehrung"=>$belehrungen), 201);
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
		$RequestRfid = cleanRFIDTag($args['RequestRfid']);
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
		$response -> getBody() -> write($userResult[0]["dn"].$RequestRfid);
		if (ldap_mod_replace($ldapconn, $userResult[0]["dn"], array("rfid"=>$RequestRfid))) {
			return $response -> withJson(true, 201);
		}
		return $response -> withStatus(500);
	});

	/**
	* Gibt Nutzerdaten des mit der RFID-Karte verknüpften Users zurück
	*/
	$app -> get('/RFID/{RequestRfid}', function(Request $request, Response $response, array $args) {
		$RequestRfid = cleanRFIDTag($args['RequestRfid']);

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
	* $RequestRfid : RFID des zu prüfenden Benutzers
	* author_bot : cn des anfragenden Bots
	* author_password : Passwort des anfragenden Bots
	*
	* Gibt alle Einweisungen des Nutzers zurück
	*/
	$app -> get('/Einweisung/RFID/{RequestRfid}', function(Request $request, Response $response, array $args) {
		$RequestRfid = strtoupper(preg_replace('/(?![0-9a-fA-F])./', "", $args['RequestRfid']));

		$ldapconn = $request -> getAttribute('ldapconn');
		$ldap_base_dn = $request -> getAttribute('ldap_base_dn');

		$ar = array();

		$Sicherheitsbelehrung = ldap_search($ldapconn, "ou=user,dc=ldap-provider,dc=fablab-luebeck",
					"(&(objectClass=fablabPerson)(rfid=$RequestRfid))", array("dn", "sicherheitsbelehrung"));
		$SicherheitsbelehrungResult = ldap_get_entries($ldapconn, $Sicherheitsbelehrung);
		if ($SicherheitsbelehrungResult["count"] === 0) {
			return $response -> withStatus(404);
		}
		array_push($ar, array(
			"sicherheitsbelehrung"=>true,
			"datum"=>$SicherheitsbelehrungResult[0]["sicherheitsbelehrung"][0]
		));
		$RequestUser = $SicherheitsbelehrungResult[0]["dn"];

		$dn = "ou=einweisung,".$ldap_base_dn;
		$searchTerm = "(&(objectClass=einweisung)(eingewiesener=$RequestUser))";

		$einweisungen = ldap_search($ldapconn, $dn, $searchTerm, array("einweisungsdatum", "aktiviert"));
		$einweisungenResult = ldap_get_entries($ldapconn, $einweisungen);

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
			$push = array(
				"datum"=>$einweisungenResult[$i]["einweisungsdatum"][0],
				"geraet"=>array(
					"geraetname"=>$geraet[0]["geraetname"][0],
					"cn"=>$geraet[0]["cn"][0]
				)
			);
			if (isset($einweisungenResult[$i]["aktiviert"])) {
				$push["aktiviert"] = ($einweisungenResult[$i]["aktiviert"][0]==="TRUE");
			}
			
			array_push($ar, $push);
		}

		$searchTerm = "(&(objectClass=geraet)(member=$RequestUser))";
		$mentorenschaft = ldap_search($ldapconn, $dn, $searchTerm, array("geraetname", "cn"));
		$mentorenschaftResult = ldap_get_entries($ldapconn, $mentorenschaft);

		$debug = "";
		for ($i = 0; $i < $mentorenschaftResult["count"]; $i++) {
			for ($j = 0; $j < sizeof($ar); $j++) {
				if ($ar[$j]["geraet"]["cn"] == $mentorenschaftResult[$i]["cn"][0]) {
					$delete = $j;
				}
			}

			if (isset($delete)) {
				unset($ar[$delete]);
				unset($delete);
				$ar = array_values($ar);
			}
			array_push($ar, array(
				"geraet"=>array(
					"geraetname"=>$mentorenschaftResult[$i]["geraetname"][0],
					"cn"=>$mentorenschaftResult[$i]["cn"][0]
				),
				"mentor"=>true
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

		$ar = array();

		$Sicherheitsbelehrung = ldap_search($ldapconn, $RequestUser, "(objectClass=fablabPerson)", array("sicherheitsbelehrung"));
		$SicherheitsbelehrungResult = ldap_get_entries($ldapconn, $Sicherheitsbelehrung);

		array_push($ar, array(
			"sicherheitsbelehrung"=>true,
			"datum"=>$SicherheitsbelehrungResult[0]["sicherheitsbelehrung"][0]
		));

		$dn = "ou=einweisung,".$ldap_base_dn;
		$searchTerm = "(&(objectClass=einweisung)(eingewiesener=$RequestUser))";

		$einweisungen = ldap_search($ldapconn, $dn, $searchTerm, array("einweisungsdatum"));
		$einweisungenResult = ldap_get_entries($ldapconn, $einweisungen);

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

		$searchTerm = "(&(objectClass=geraet)(member=$RequestUser))";
		$mentorenschaft = ldap_search($ldapconn, $dn, $searchTerm, array("geraetname", "cn"));
		$mentorenschaftResult = ldap_get_entries($ldapconn, $mentorenschaft);

		$debug = "";
		for ($i = 0; $i < $mentorenschaftResult["count"]; $i++) {
			for ($j = 0; $j < sizeof($ar); $j++) {
				if ($ar[$j]["geraet"]["cn"] == $mentorenschaftResult[$i]["cn"][0]) {
					$delete = $j;
				}
			}

			if (isset($delete)) {
				unset($ar[$delete]);
				unset($delete);
				$ar = array_values($ar);
			}
			array_push($ar, array(
				"geraet"=>array(
					"geraetname"=>$mentorenschaftResult[$i]["geraetname"][0],
					"cn"=>$mentorenschaftResult[$i]["cn"][0]
				),
				"mentor"=>true
			));
		}

		return $response -> withJson($ar, 201);
	});


	$app -> get('/Mitgliederverwaltung', function(Request $request, Response $response, array $args) {
		$ldapconn = $request -> getAttribute('ldapconn');
		$ldap_base_dn = $request -> getAttribute('ldap_base_dn');

		$usersearch = $request -> getAttribute("request_user");
		$group = "cn=mitgliedverwaltung,ou=group,dc=ldap-provider,dc=fablab-luebeck";

		$search = ldap_search($ldapconn, $group, "(&(objectClass=groupOfNames)(member=$usersearch))", array("dn"));
		if ($search) {
			$res = ldap_get_entries($ldapconn, $search);
			if ($res['count'] > 0) {
				return $response -> withStatus(201);
			}
		}
		return $response -> withStatus(401);
	});

	$app -> get('/StaffelEinweisung', function(Request $request, Response $response, array $args) {
		$ldapconn = $request -> getAttribute('ldapconn');
		$ldap_base_dn = $request -> getAttribute('ldap_base_dn');

		$usersearch = $request -> getAttribute("request_user");
		$machines = "ou=einweisung,dc=ldap-provider,dc=fablab-luebeck";

		$machineSearch = ldap_search($ldapconn, $machines, 
					"(&(objectClass=geraet)(member=$usersearch)(gestaffelteEinweisung=TRUE))", array("dn"));
		if ($machineSearch) {
			$machines = ldap_get_entries($ldapconn, $machineSearch);
			if ($machines['count'] > 0) {
				return $response -> withStatus(201);
			}
		}

		return $response -> withStatus(401);
	});

	/**
	* $RequestToken : RFID-Token des Abgefragten Nutzers
	* $RequestMachine : DN der Angefragten Maschine
	* author_user : UID des anfragenden Nutzers
	* author_password : Passwort des anfragenden Nutzers
	*
	* Prüft ob Einweisung in Gerät für Nutzer vorhanden ist.
	* Gibt die Anzahl der Monate zurück, in denen Einweisung und
	* Sicherheitsbelehrung noch aktuell sind
	*/
	$app -> get('/Einweisung/{RequestToken}/{RequestMachine}', function (Request $request, Response $response, array $args) {
		$RequestToken = cleanRFIDTag($args['RequestToken']);
		$RequestMachine = $args['RequestMachine'];

		$ldapconn = $request -> getAttribute('ldapconn');
		$ldap_base_dn = $request -> getAttribute('ldap_base_dn');

		$dn = "ou=user,".$ldap_base_dn;
		$userterm = "(&(objectClass=fablabPerson)(rfid=$RequestToken))";

		//check einweisung
		$RequestUserErg = ldap_search($ldapconn, $dn, $userterm, array("dn", "sicherheitsbelehrung"));
		$RequestUserResults = ldap_get_entries($ldapconn, $RequestUserErg);

		if ($RequestUserResults["count"] === 1) {
			$RequestUser = $RequestUserResults[0]["dn"];

			$einweisungdn = $RequestMachine;
			$einweisungterm = "(&(objectClass=einweisung)(eingewiesener=$RequestUser))";

			$einweisungErg = ldap_search($ldapconn, $einweisungdn, $einweisungterm,
										array("dn", "einweisungsdatum", "aktiviert"));
			$einweisungResult = ldap_get_entries($ldapconn, $einweisungErg);

			$duedate = time() - 60 * 60 * 24 * 365; // 1 Jahr Dauer

			if ($einweisungResult['count'] === 1) {
				$einweisungsdate = ldapToUnixTimestamp($einweisungResult[0]["einweisungsdatum"][0]);

				if ($einweisungsdate < time()) {
					$datediff = $einweisungsdate - $duedate;

					if ($datediff > 0) {
						$einweisungMonthsdiff = ceil($datediff / (60.0 * 60.0 * 24.0 * 30.0));
					}
				}
				$aktiviert = $einweisungResult[0]["aktiviert"][0];
			}

			$sicherheitsdate = ldapToUnixTimestamp($RequestUserResults[0]["sicherheitsbelehrung"][0]);

			if ($sicherheitsdate < time()) {
				$datediff = $sicherheitsdate - $duedate;

				if ($datediff > 0) {
					$sicherheitMonthsdiff = ceil($datediff / (60.0 * 60.0 * 24.0 * 30.0));
				}
			}
		}

		//check mentorships of the given user
		$mentorterm = "(&(objectClass=geraet)(member=$RequestUser))";

		$mentorErg = ldap_search($ldapconn, $einweisungdn, $mentorterm, array("dn"));
		$mentorResult = ldap_get_entries($ldapconn, $mentorErg);

		if ($mentorResult['count'] === 1) {
			$einweisungMonthsdiff = 12;
		}


		$result = array();
		if (isset($aktiviert)) {
			$result["aktiviert"] = ($aktiviert === 'TRUE');
		} else {
			$result["aktiviert"] = true;
		}
		if ($result["aktiviert"] && isset($einweisungMonthsdiff)) {
			$result["einweisung"] = $einweisungMonthsdiff;
		} else {
			$result["einweisung"] = false;
		}
		if ($result["aktiviert"] && isset($sicherheitMonthsdiff)) {
			$result["sicherheitsbelehrung"] = $sicherheitMonthsdiff;
		} else {
			$result["sicherheitsbelehrung"] = false;
		}

		if (isset($einweisungMonthsdiff) || isset($sicherheitMonthsdiff)) {
			$response = $response -> withJson($result, 201);
		} else {
			$response -> getBody() -> write("false\n");
			$response -> withStatus(201);
		}

		//needed for compatibility with esp wifi library
		$response -> getBody() -> write("\n");
		return $response;
	});


	$app -> post('/Sicherheitsbelehrung/{RequestUser}/{RequestDate}', function (Request $request, Response $response, array $args) {
		$RequestUser = $args['RequestUser'];
		$RequestDate = $args['RequestDate'];

		$ldapconn = $request -> getAttribute("ldapconn");
		$ldap_base_dn = $request -> getAttribute("ldap_base_dn");
		$entry["sicherheitsbelehrung"] = $RequestDate;
		$entry["belehrtVon"] = $request -> getAttribute("request_user");
		if (ldap_mod_replace($ldapconn, $RequestUser, $entry)) {
			return $response -> withJson(true, 201);
		}
		return $response -> withStatus(500);
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

		$existDN = $RequestMachine;
		$existFilter = "(&(objectClass=einweisung)(eingewiesener=$RequestUser))";
		$einweisungErg = ldap_search($ldapconn, $existDN, $existFilter, array("dn", "einweisungsdatum"));
		$einweisungResult = ldap_get_entries($ldapconn, $einweisungErg);

		$debug = var_export($einweisungResult, true);

		$force = false;
		if (isset($request -> getParsedBody()["force"])) {
			$force = $request -> getParsedBody()["force"];
		}

		if ($einweisungResult['count'] > 1) {
			return $result -> withJson("Einweisungen inkonsistent. Bitte einem Administrator melden", 500);
		} else if ($einweisungResult['count'] === 1) {
			if ($force) {
				$currentDate = $einweisungResult[0]["einweisungsdatum"][0];
				$DN = $einweisungResult[0]["dn"];
				$entry = array();
				$entry["einweisungsdatum"]=$RequestDate;
				$entry["geraetementor"]=$request -> getAttribute("request_user");
				if (ldap_mod_replace($ldapconn, $DN, $entry)) {
					return $response -> withJson(true, 200);
				} else {
					return $response -> withStatus(500);
				}
			}
			return $response -> withJson(array("status" => "not updating", "date" => $einweisungResult[0]["einweisungsdatum"][0]), 202);
		} else {
			$machineFilter = "(objectClass=geraet)";
			$machineSearch = ldap_search($ldapconn, $RequestMachine, $machineFilter, array("dn", "gestaffelteEinweisung"));
			$machineResult = ldap_get_entries($ldapconn, $machineSearch);

			$entry = array();
			if ($machineResult["count"] === 1 && isset($machineResult[0]["gestaffelteeinweisung"])) {
				if ($machineResult[0]["gestaffelteeinweisung"][0] === 'TRUE') {
					$entry["aktiviert"] = "FALSE";
				}
			}
			$entry["objectClass"] = "einweisung";
			$entry["eingewiesener"] = $RequestUser;
			$entry["einweisungsdatum"] = $RequestDate;
			$entry["geraetementor"] = $request -> getAttribute("request_user");
			$entry["distinctname"] = uniqid("e_");
			$test = var_export($entry, true);
			$response -> getBody() -> write($test);
			if (ldap_add($ldapconn, "distinctname=".$entry['distinctname'].",".$RequestMachine, $entry)) {
				return $response -> withJson(true, 201);
			} else {
				return $response -> withStatus(500);
			}
		}
	});

	$app -> post('/User/{Vorname}/{Nachname}/{Geburtstag}/{Sicherheitsbelehrung}', function(Request $request, Response $response, array $args) {
		$RequestVornamen = explode(" ", $args['Vorname']);
		$RequestNachnamen = explode(" ", $args['Nachname']);
		$RequestVorname = strtoupper(substr(normalizeUtf8String($RequestVornamen[0]), 0, 1)).strtolower(substr(normalizeUtf8String($RequestVornamen[0]), 1));
		$RequestNachname = "";
		foreach ($RequestNachnamen as $nachname) {
			if ($nachname != "") {
				$RequestNachname .= strtoupper(substr(normalizeUtf8String($nachname), 0, 1)).strtolower(substr(normalizeUtf8String($nachname), 1));
			}
		}
		$RequestNachname = trim($RequestNachname);
		$RequestGeburtstag = $args['Geburtstag'];
		$RequestSicherheitsbelehrung = $args['Sicherheitsbelehrung'];
		//$RequestGeburtstag = "19950111183220.733Z";

		$ldapconn = $request -> getAttribute('ldapconn');
		$ldap_base_dn = $request -> getAttribute('ldap_base_dn');

		$entry = array();
		$entry["objectClass"][0] = "inetOrgPerson";
		$entry["objectClass"][1] = "fablabPerson";
		$entry["objectClass"][2] = "posixAccount";
		$entry["uid"] = $RequestVorname.$RequestNachname;
		$entry["cn"] = array();
		$entry["sn"] = "";
		foreach ($RequestVornamen as $vorname) {
			array_push($entry["cn"], trim(normalizeUtf8String($vorname)));
		}
		foreach ($RequestNachnamen as $nachname) {
			$entry["sn"] = $entry["sn"]." ".normalizeUtf8String($nachname);
		}
		$entry["sn"] = trim($entry["sn"]);
		
		$entry["geburtstag"] = $RequestGeburtstag;
		$entry["sicherheitsbelehrung"] = $RequestSicherheitsbelehrung;
		$entry["belehrtVon"] = $request -> getAttribute("request_user");

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

		$entry["gidNumber"] = 2001;
		$configDN = "cn=nextUID,ou=config,dc=ldap-provider,dc=fablab-luebeck";
		$nextUIDNumberEntry = ldap_read($ldapconn, $configDN, "(objectClass=nextUID)", array("uidNumber"));
		$nextUIDNumber = ldap_get_entries($ldapconn, $nextUIDNumberEntry);

		$uidNumber = $nextUIDNumber[0]["uidnumber"][0];
		$newConfigVals = array("uidNumber" => $uidNumber + 1 );
		ldap_mod_replace($ldapconn, $configDN, $newConfigVals);

		$entry["uidNumber"] = $uidNumber;
		$entry["homeDirectory"] = "/home/".strtolower($entry['uid']);

		if (ldap_add($ldapconn, $dn, $entry)) {
			return $response -> withJson($entry["uid"], 201);
		} else {
			return $response -> withStatus(500);
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
		$sts = explode(" ", $st);
		$x = var_export($sts, true);

		$term = "(&(objectClass=fablabPerson)(|";
		foreach ($sts as $searchterm) {
			if ($searchterm != "") {
				$term = $term."(cn=*$searchterm*)(sn=*$searchterm*)(uid=*$searchterm*)";
			}
		}
		$term .= "))";
		$selectedKeys = array("cn", "sn", "uid", "dn", "geburtstag", "rfid", "mitgliedsart", "objectClass");

		$searchtermrfid = "(&(objectClass=fablabPerson)(rfid=".cleanRFIDTag($st)."))";
		$ergRfid = ldap_search($ldapconn, $dn, $searchtermrfid, $selectedKeys);
		$resultRfid = ldap_get_entries($ldapconn, $ergRfid);

		if ($resultRfid && $resultRfid["count"] > 0) {
			$results = $resultRfid;
		} else {
			$erg = ldap_search($ldapconn, $dn, $term, $selectedKeys);
			$results = ldap_get_entries($ldapconn, $erg);
		}

		$ar = array();
		if (isset($request->getQueryParams()["filter"])) {
			$filter = json_decode($request -> getQueryParams()["filter"], true);
		}
		for ($i = 0; $i < $results['count']; $i++) {
			$use = true;
			if (isset($filter, $filter["maschine"])) {
				$einweisungTerm = "(&(objectClass=einweisung)(eingewiesener=".$results[$i]["dn"]."))";
				$einweisungSuche = ldap_search($ldapconn, $filter["maschine"], $einweisungTerm, array("dn"));
				$einweisung = ldap_get_entries($ldapconn, $einweisungSuche);
				if ($einweisung["count"] < 1) {
					$use = false;
				}
			}
			if (isset($filter, $filter['mitgliedschaft'])) {
				$use = false;
				if (is_array($filter['mitgliedschaft'])) {
					foreach ($filter['mitgliedschaft'] as $mitgliedschaft) {
						if ($results[$i]["mitgliedsart"][0] == $mitgliedschaft) {
							$use = true;
						}
					}
				} else if (isset($filter) && $filter['mitgliedschaft'] === ''){
					$use = !isset($results[$i]['mitgliedsart']);
				}
			}
			if (isset($filter, $filter['notObjectClass'])) {
				foreach ($results[$i]["objectclass"] as $class) {
					if ($class == $filter['notObjectClass']) {
						$use = false;
					}
				}
			}

			if ($use) {
				array_push($ar, array(
					"vorname"=>$results[$i]["cn"][0],
					"nachname"=>$results[$i]["sn"][0],
					"uid"=>$results[$i]["uid"][0],
					"dn"=>$results[$i]["dn"],
					"geburtstag"=>$results[$i]["geburtstag"][0],
					"rfid"=>$results[$i]["rfid"][0]
				));
			}
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

		$erg = ldap_search($ldapconn, $dn, $searchTerm, array("cn", "sn", "uid", "dn", "sicherheitsbelehrung"));
		$results = ldap_get_entries($ldapconn, $erg);
		$ar = array();
		for ($i = 0; $i < $results['count']; $i++) {
			array_push($ar, array(
				"vorname"=>$results[$i]["cn"][0],
				"nachname"=>$results[$i]["sn"][0],
				"uid"=>$results[$i]["uid"][0],
				"dn"=>$results[$i]["dn"],
				"sicherheitsbelehrung"=>$results[$i]["sicherheitsbelehrung"][0]
			));
		}

		return $response -> withJson($ar, 201);
	});

	/**
	* Gibt alle vorhandenen Geräte des Fablab zurück
	*/
	$app -> get('/Maschinen', function(Request $request, Response $response, array $args) {
		$userDn = $request -> getAttribute("request_user");
		$ldap_base_dn = $request -> getAttribute("ldap_base_dn");
		$ldapconn = $request -> getAttribute("ldapconn");

		$dn = "ou=einweisung,".$ldap_base_dn;
		$filter = "(&(objectClass=geraet)(member=$userDn)";
		if (isset($request->getQueryParams()["filter"])) {
			if ($request->getQueryParams()["filter"] === "tiered") {
				$filter .= "(gestaffelteEinweisung=TRUE)";
			}
		}
		$filter .= ")";

		$sr = ldap_search($ldapconn, $dn, $filter, array("geraetname", "dn", "cn"));

		$result = ldap_get_entries($ldapconn, $sr);
		$ar = array();

		for ($i = 0; $i < $result['count']; $i++) {
			array_push($ar, array("name"=>$result[$i]["geraetname"][0], "dn"=>$result[$i]["dn"], "cn"=>$result[$i]["cn"][0]));
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

	$app -> get('/Staffeleinweisung/{geraet}/{nutzer}', function(Request $request, Response $response, array $args) {
		$geraet = $args["geraet"];
		$nutzer = $args["nutzer"];

		$ldapconn = $request -> getAttribute("ldapconn");
		$ldap_base_dn = $request -> getAttribute("ldap_base_dn");

		$fields = array("dn", "aktiviert", "kommentar");
		$sr = ldap_search($ldapconn, $geraet, "(&(objectClass=einweisung)(eingewiesener=$nutzer))", $fields);
		$result = ldap_get_entries($ldapconn, $sr);

		$ar = array(
			"kommentar"=>"",
			"aktiviert"=>false
		);
		if ($result["count"] > 0) {
			if (isset($result[0]["aktiviert"])) {
				$ar["aktiviert"] = $result[0]["aktiviert"][0];
			}
			if (isset($result[0]["kommentar"])) {
				$ar["kommentar"] = $result[0]["kommentar"][0];
			}
		}

		return $response -> withJson($ar, 201);
	});

	$app -> post('/Staffeleinweisung/{geraet}/{nutzer}', function(Request $request, Response $response, array $args) {
		$geraet = $args["geraet"];
		$nutzer = $args["nutzer"];

		$ldapconn = $request -> getAttribute("ldapconn");
		$ldap_base_dn = $request -> getAttribute("ldap_base_dn");
		
		$vals = $request -> getParsedBody();
		$aktiviert = strtolower($vals["aktiviert"])==='true' ? 'TRUE' : 'FALSE';
		$kommentar = $vals["kommentar"];

		$einweisungSuche = ldap_search($ldapconn, $geraet, "(&(objectClass=einweisung)(eingewiesener=$nutzer))", array("dn"));
		$einweisungErg = ldap_get_entries($ldapconn, $einweisungSuche);
		if ($einweisungErg["count"] > 0) {
			ldap_mod_replace($ldapconn, $einweisungErg[0]["dn"], array(
				"aktiviert" => $aktiviert,
				"kommentar" => $kommentar
			));
		} else {
			return $response -> withStatus(404);
		}
	});

	$app -> run();

	/**
	* Converts ldap timestamp to unix
	*/
	function ldapToUnixTimestamp($ldapdate) {
		return strtotime(substr($ldapdate, 4, 2).'/'.substr($ldapdate, 6, 2)
											.'/'.substr($ldapdate, 0, 4));
	}

	/**
	*	Compares LDAP-Dates, does NOT care for times
	*/
	function compareLDAPDates($date1, $date2) {
		for ($i = 0; $i < 8; $i++) {
			if (intval($date1[$i]) > intval($date2[$i])) {
				return false;
			} else if (intval($date1[$i]) < intval($date2[$i])) {
				return true;
			}
		}

		return false;
	}

	function cleanRFIDTag($tag) {
		return strtoupper(preg_replace('/(?![0-9a-fA-F])./', "", $tag));
	}

	function normalizeUtf8String($s) {
    // Normalizer-class missing!
    if (! class_exists("Normalizer", $autoload = false))
        return $s;


    // maps German (umlauts) and other European characters onto two characters before just removing diacritics
    $s    = preg_replace( '@\x{00c4}@u'    , "AE",    $s );    // umlaut Ä => AE
    $s    = preg_replace( '@\x{00d6}@u'    , "OE",    $s );    // umlaut Ö => OE
    $s    = preg_replace( '@\x{00dc}@u'    , "UE",    $s );    // umlaut Ü => UE
    $s    = preg_replace( '@\x{00e4}@u'    , "ae",    $s );    // umlaut ä => ae
    $s    = preg_replace( '@\x{00f6}@u'    , "oe",    $s );    // umlaut ö => oe
    $s    = preg_replace( '@\x{00fc}@u'    , "ue",    $s );    // umlaut ü => ue
    $s    = preg_replace( '@\x{00f1}@u'    , "ny",    $s );    // ñ => ny
    $s    = preg_replace( '@\x{00ff}@u'    , "yu",    $s );    // ÿ => yu


    // maps special characters (characters with diacritics) on their base-character followed by the diacritical mark
        // exmaple:  Ú => U´,  á => a`
    $s = Normalizer::normalize( $s, Normalizer::FORM_D );


    $s    = preg_replace( '@\pM@u'        , "",    $s );    // removes diacritics


    $s    = preg_replace( '@\x{00df}@u'    , "ss",    $s );    // maps German ß onto ss
    $s    = preg_replace( '@\x{00c6}@u'    , "AE",    $s );    // Æ => AE
    $s    = preg_replace( '@\x{00e6}@u'    , "ae",    $s );    // æ => ae
    $s    = preg_replace( '@\x{0132}@u'    , "IJ",    $s );    // ? => IJ
    $s    = preg_replace( '@\x{0133}@u'    , "ij",    $s );    // ? => ij
    $s    = preg_replace( '@\x{0152}@u'    , "OE",    $s );    // Œ => OE
    $s    = preg_replace( '@\x{0153}@u'    , "oe",    $s );    // œ => oe

    $s    = preg_replace( '@\x{00d0}@u'    , "D",    $s );    // Ð => D
    $s    = preg_replace( '@\x{0110}@u'    , "D",    $s );    // Ð => D
    $s    = preg_replace( '@\x{00f0}@u'    , "d",    $s );    // ð => d
    $s    = preg_replace( '@\x{0111}@u'    , "d",    $s );    // d => d
    $s    = preg_replace( '@\x{0126}@u'    , "H",    $s );    // H => H
    $s    = preg_replace( '@\x{0127}@u'    , "h",    $s );    // h => h
    $s    = preg_replace( '@\x{0131}@u'    , "i",    $s );    // i => i
    $s    = preg_replace( '@\x{0138}@u'    , "k",    $s );    // ? => k
    $s    = preg_replace( '@\x{013f}@u'    , "L",    $s );    // ? => L
    $s    = preg_replace( '@\x{0141}@u'    , "L",    $s );    // L => L
    $s    = preg_replace( '@\x{0140}@u'    , "l",    $s );    // ? => l
    $s    = preg_replace( '@\x{0142}@u'    , "l",    $s );    // l => l
    $s    = preg_replace( '@\x{014a}@u'    , "N",    $s );    // ? => N
    $s    = preg_replace( '@\x{0149}@u'    , "n",    $s );    // ? => n
    $s    = preg_replace( '@\x{014b}@u'    , "n",    $s );    // ? => n
    $s    = preg_replace( '@\x{00d8}@u'    , "O",    $s );    // Ø => O
    $s    = preg_replace( '@\x{00f8}@u'    , "o",    $s );    // ø => o
    $s    = preg_replace( '@\x{017f}@u'    , "s",    $s );    // ? => s
    $s    = preg_replace( '@\x{00de}@u'    , "T",    $s );    // Þ => T
    $s    = preg_replace( '@\x{0166}@u'    , "T",    $s );    // T => T
    $s    = preg_replace( '@\x{00fe}@u'    , "t",    $s );    // þ => t
    $s    = preg_replace( '@\x{0167}@u'    , "t",    $s );    // t => t

    // remove all non-ASCii characters
    $s    = preg_replace( '@[^\0-\x80]@u'    , "",    $s );


    // possible errors in UTF8-regular-expressions
    if (empty($s))
        return $original_string;
    else
        return $s;
}
?>
