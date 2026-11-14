<?php
declare(strict_types=1);

$path = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH);
$routes = [
    '/api/graduates' => __DIR__ . '/api/graduates.php',
    '/api/graduates/import' => __DIR__ . '/api/import.php',
];

if (is_string($path) && isset($routes[$path])) {
    require $routes[$path];
    return true;
}

http_response_code(404);
header('Content-Type: application/json; charset=utf-8');
echo json_encode(['error' => 'API route not found.']);
return true;
