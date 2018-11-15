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
		$app->ldapconn = $ldapconn;

		$response = $next($request, $response);

		ldap_close($ldapconn);

		return $response;
	});

	$app -> get('/Einweisung/{RequestUser}/{RequestMachine}', function (Request $request, Response $response, array $args) {
		$params = $request->getQueryParams();

		$AuthorUser = $params['author_user'];
		$AuthorPassword = $params['author_password'];

		$RequestUser = $args['RequestUser'];
		$RequestMachine = $args['RequestMachine'];

		//$response -> getBody() -> write($RequestUser." ".$RequestMachine);

		if ($RequestUser == "Test" && $RequestMachine == "Lasercutter") {
			$response -> getBody() -> write("true");
		} else {
			$response -> getBody() -> write("false");
		}
		return $response;
	});

	$app -> post('/Einweisung/{RequestUser}', function (Request $request, Response $response, array $args) {
		$params = $request -> getParsedBody();
		$AuthorUser = $params['author_user'];
		$AuthorPassword = $params['author_password'];

		$RequestUser = $args['RequestUser'];
		$RequestMachine = $params['machine'];

		$response->getBody()->write("ldap insert with $RequestUser, $RequestMachine as User $AuthorUser with password $AuthorPassword");

		return $response;
	});

	$app -> get('/User', function (Request $request, Response $response, array $args) {
		$params = $request->getQueryParams();

		$AuthorUser = $params['author_user'];
		$AuthorPassword = $params['author_password'];

		$searchTerm = $params['search_term'];


		$data = array(
			array(
				"name" => "Max Mustermann",
				"uid" => "MaxMustermann123"
			)
		);
		return $response -> withJson($data, 201);
	});

	$app -> get('/User/{vorname}/{nachname}/{geburtsdatum}', function(Request $request, Response $response, array $args) {
		$vorname = $args['vorname'];
		$nachname = $args['nachname'];
		$geburtsdatum = $args['geburtsdatum'];

		$params = $request->getQueryParams();

		$AuthorUser = $params['author_user'];
		$AuthorPassword = $params['author_password'];

		$searchTerm = "(objectClass=*)(cn=$vorname)(sn=$nachname)(birthday=$geburtsdatum)";

		$searchResults = array(
			array(
				"vorname"=>"Max",
				"nachname"=>"Müller",
				"geburtsdatum"=>"01.01.1970",
				"uid"=>'MaxMüller',
				"TagId"=>"1010"
			),
			array(
				"vorname"=>"Max",
				"nachname"=>"Müller",
				"geburtsdatum"=>"01.01.1970",
				"uid"=>"MaxMüller1",
				"TagId"=>"1022"
			)
		);

		//$response->getBody()->write($searchTerm);
		return $response->withJson($searchResults);
	});

	$app -> get('/Maschinen', function(Request $request, Response $response, array $args) {
		$ldap_base_dn = $request -> getAttribute("ldap_base_dn");
		$ldapconn = $request -> getAttribute("ldapconn");

		$dn = "ou=maschine,".$ldap_base_dn;
		$filter = "(objectClass=geraet)";

		$sr = ldap_search($ldapconn, $dn, $filter, array("geraetname"));

		$result = ldap_get_entries($ldapconn, $sr);
		$ar = array();
		for ($i = 0; $i < $result['count']; $i++) {
			array_push($ar, array("name"=>$result[$i]["geraetname"][0]));
		}

		return $response -> withJson($ar, 201);
	});

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
