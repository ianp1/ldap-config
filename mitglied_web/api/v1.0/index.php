<?php
	require '../vendor/autoload.php';
	require 'cors.php';

	use \Psr\Http\Message\ServerRequestInterface as Request;
	use \Psr\Http\Message\ResponseInterface as Response;

	$app = new \Slim\App;

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
		$data = array(
			array(
				"name" => "Lasercutter",
				"mentoren" => array(
					"Andre",
					"Christian"
				)
			),
			array(
				"name" => "Ultimaker 1 Original",
				"mentoren" => array(
					"Bjarne"
				)
			)
		);
		return $response -> withJson($data, 201);
	});

	$app -> get('/Authentifizierung', function(Request $request, Response $response, array $args) {

		$params = $request->getQueryParams();

		$username = $params['author_user'];
		$password = $params['author_password'];
		if ($username == 'IanPoesse' && $password == '123geheim') {
			return $response -> withJson(true, 201);
		}
		return $response -> withStatus(401);
	});

	$app -> run();
?>
