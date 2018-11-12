<?php
	require '../vendor/autoload.php';

	use \Psr\Http\Message\ServerRequestInterface as Request;
	use \Psr\Http\Message\ResponseInterface as Response;

	$app = new \Slim\App;

	$app -> post('/Einweisung', function (Request $request, Response $response, array $args) {
		$AuthorUser = $args['author_user'];
		$AuthorPassword = $args['author_password'];

		$RequestUser = $args['request_user'];
		$RequestMachine = $args['machine'];

		echo "ldap insert with $RequestUser, $RequestMachine as User $AuthorUser with password $AuthorPassword";

		return $response;
	});

	$app -> get('/User', function (Request $request, Response $response, array $args) {
		$AuthorUser = $args['author_user'];
		$AuthorPassword = $args['author_password'];

		$searchTerm = $args['search_term'];
		$data = array(
			array(
				"name" => "Max Mustermann",
				"uid" => "MaxMustermann123"
			)
		);
		return $response -> withJson($data, 201);
	});

	$app -> get('/Maschine', function(Request $request, Response $response, array $args) {
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
	});

	$app -> run();
?>
