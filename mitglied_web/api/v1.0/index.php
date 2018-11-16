<?php
	require '../vendor/autoload.php';
	require 'cors.php';

	use \Psr\Http\Message\ServerRequestInterface as Request;
	use \Psr\Http\Message\ResponseInterface as Response;

	$app = new \Slim\App;

	$app -> add(function($request, $response, $next) {
		$ldaphost = "192.168.3.4";
		$ldapport = 389;

		$ldapconn = ldap_connect($ldaphost, $ldapport);
		if (!$ldapconn) {
			$response -> getBody() -> write("LDAP-Server Verbindung nicht möglich<br>");
			$response -> getBody() -> write(ldap_error($ldapconn));
			return $response -> withStatus(500);
		}

		$request = $request -> withAttribute("ldapconn", $ldapconn);
		$request = $request -> withAttribute("ldap_base_dn", "dc=ldap-provider,dc=fablab-luebeck");

		ldap_set_option($ldapconn,LDAP_OPT_PROTOCOL_VERSION,3);
		ldap_start_tls($ldapconn);

		$response = $next($request, $response);

		ldap_close($ldapconn);

		return $response;
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
		$params = $request->getQueryParams();

		$AuthorUser = $params['author_user'];
		$AuthorPassword = $params['author_password'];

		$RequestToken = $args['RequestToken'];
		$RequestMachine = $args['RequestMachine'];

		$ldapconn = $request -> getAttribute('ldapconn');
		$ldap_base_dn = $request -> getAttribute('ldap_base_dn');

		if (ldap_bind($ldapconn, "uid=".$AuthorUser.",ou=user,".$ldap_base_dn, $AuthorPassword)) {
			$dn = "ou=user,".$ldap_base_dn;
			$userterm = "(&(objectClass=fablabPerson)(rfid=$RequestToken))";

			$RequestUserErg = ldap_search($ldapconn, $dn, $userterm, array("dn"));
			$RequestUserResults = ldap_get_entries($ldapconn, $RequestUserErg);

			if ($RequestUserResults["count"] === 1) {
				$RequestUser = $RequestUserResults[0]["dn"];

				$einweisungdn = "ou=einweisung,".$ldap_base_dn;
				$einweisungterm = "(&(objectClass=einweisung)(eingewiesener=$RequestUser)(geraet=$RequestMachine))";

				$einweisungErg = ldap_search($ldapconn, $einweisungdn, $einweisungterm, array("dn"));
				$einweisungResult = ldap_get_entries($ldapconn, $einweisungErg);

				if ($einweisungResult['count'] === 1) {
					$response -> getBody() -> write("true\n");
					return $response -> withStatus(201);
				}
			}
		} else {
			return $response -> withStatus(401);
		}
		$response -> getBody() -> write("false\n");
		return $response -> withStatus(201);
	});


	/**
	* $RequestUser : DN des zu ändernden Nutzers
	* $RequestMachine : DN der eingewiesenen Maschine
	* $RequestDate : Datum der Einweisung
	* author_user : UID des anfragenden Nutzers
	* author_password : Passwort des anfragenden Nutzers
	*
	* Legt eine Einweisung am gegebenen Datum für den zu ändernden Nutzer an
	*/
	$app -> post('/Einweisung/{RequestUser}/{RequestMachine}/{RequestDate}', function (Request $request, Response $response, array $args) {
		$params = $request -> getParsedBody();
		$AuthorUser = $params['author_user'];
		$AuthorPassword = $params['author_password'];

		$RequestUser = $args['RequestUser'];
		$RequestMachine = $args['RequestMachine'];
		$RequestDate = $args['RequestDate'];

		$ldapconn = $request -> getAttribute('ldapconn');
		$ldap_base_dn = $request -> getAttribute('ldap_base_dn');

		//TODO: Sanitycheck inputs!
		if (ldap_bind($ldapconn, "uid=".$AuthorUser.",ou=user,".$ldap_base_dn, $AuthorPassword)) {
			$entry = array();
			$entry["objectClass"] = "einweisung";
			$entry["eingewiesener"] = $RequestUser;
			$entry["geraet"] = $RequestMachine;
			$entry["einweisungsdatum"] = $RequestDate;
			$entry["distinctname"] = uniqid("e_");

			return $response -> withJson(ldap_add($ldapconn, "distinctname=".$entry['distinctname'].",ou=einweisung,dc=ldap-provider,dc=fablab-luebeck", $entry), 201);
		}


		return $response -> withStatus(401);
	});

	/**
	* $search_term : Name der gesucht wird
	* author_user : UID des anfragenden Benutzers
	* author_password : Passwort des anfragenden Benutzers
	*
	* Sucht nach Nutzern die zum Suchterm passen
	*/
	$app -> get('/User/{SearchTerm}', function (Request $request, Response $response, array $args) {
		$params = $request->getQueryParams();

		$AuthorUser = $params['author_user'];
		$AuthorPassword = $params['author_password'];

		$st = $args['SearchTerm'];

		$ldapconn = $request -> getAttribute("ldapconn");
		$ldap_base_dn = $request -> getAttribute("ldap_base_dn");

		if (ldap_bind($ldapconn, "uid=".$AuthorUser.",ou=user,".$ldap_base_dn, $AuthorPassword)) {

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
		} else {
			return $response -> withStatus(401);
		}
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

		$params = $request->getQueryParams();

		$AuthorUser = $params['author_user'];
		$AuthorPassword = $params['author_password'];

		$searchTerm = "(&(objectClass=inetOrgPerson)(cn=$vorname)(sn=$nachname)(geburtstag=$geburtsdatum))";

		$ldapconn = $request -> getAttribute("ldapconn");
		$ldap_base_dn = $request -> getAttribute("ldap_base_dn");

		if (ldap_bind($ldapconn, "uid=".$AuthorUser.",ou=user,".$ldap_base_dn, $AuthorPassword)) {
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

		}

		//$response->getBody()->write($searchTerm);
		return $response->withStatus(401);
	});

	/**
	* Gibt alle vorhandenen Geräte des Fablab zurück
	*/
	$app -> get('/Maschinen', function(Request $request, Response $response, array $args) {
		$ldap_base_dn = $request -> getAttribute("ldap_base_dn");
		$ldapconn = $request -> getAttribute("ldapconn");

		$dn = "ou=maschine,".$ldap_base_dn;
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

		$params = $request->getQueryParams();
		$username = $params['author_user'];
		$password = $params['author_password'];

		$ldapconn = $request -> getAttribute("ldapconn");
		$ldap_base_dn = $request -> getAttribute("ldap_base_dn");

		if (ldap_bind($ldapconn, "uid=".$username.",ou=user,".$ldap_base_dn, $password)) {
			return $response -> withJson(true, 201);
		}
		return $response -> withStatus(401);
	});

	$app -> run();
?>
