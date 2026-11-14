<?php
declare(strict_types=1);

function respond(array $payload, int $status = 200): void
{
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($payload, JSON_THROW_ON_ERROR | JSON_UNESCAPED_UNICODE);
    exit;
}

function database(): PDO
{
    static $connection = null;
    if ($connection instanceof PDO) {
        return $connection;
    }

    $host = getenv('DB_HOST') ?: '127.0.0.1';
    $name = getenv('DB_NAME') ?: 'alumni_tracker';
    $user = getenv('DB_USER');
    if ($user === false || $user === '') {
        throw new RuntimeException('Set DB_USER before starting the PHP API.');
    }
    $password = getenv('DB_PASSWORD');

    try {
        $connection = new PDO(
            "mysql:host={$host};dbname={$name};charset=utf8mb4",
            $user,
            $password === false ? '' : $password,
            [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES => false,
            ]
        );
    } catch (PDOException $exception) {
        error_log($exception->getMessage());
        throw new RuntimeException('Could not connect to MySQL. Check the database settings.', 0, $exception);
    }

    return $connection;
}

function read_json(): array
{
    $body = file_get_contents('php://input');
    try {
        $payload = json_decode($body === false ? '' : $body, true, 512, JSON_THROW_ON_ERROR);
    } catch (JsonException $exception) {
        respond(['error' => 'Request body must contain valid JSON.'], 400);
    }

    if (!is_array($payload)) {
        respond(['error' => 'Request body must be a JSON object.'], 400);
    }

    return $payload;
}

function required_string(array $input, string $key, int $maxLength, string $default = ''): string
{
    $value = $input[$key] ?? $default;
    if (!is_string($value)) {
        throw new InvalidArgumentException("The {$key} field must be text.");
    }

    $value = trim($value);
    if ($value === '' || strlen($value) > $maxLength) {
        throw new InvalidArgumentException("The {$key} field is required and must be at most {$maxLength} characters.");
    }

    return $value;
}

function validate_graduate(array $input): array
{
    $name = required_string($input, 'name', 160);
    $email = required_string($input, 'email', 254);
    if (filter_var($email, FILTER_VALIDATE_EMAIL) === false) {
        throw new InvalidArgumentException('Enter a valid email address.');
    }

    $year = filter_var($input['year'] ?? null, FILTER_VALIDATE_INT);
    if ($year === false || $year < 1950 || $year > 2100) {
        throw new InvalidArgumentException('Graduation year must be between 1950 and 2100.');
    }

    $status = required_string($input, 'status', 32);
    $allowedStatuses = ['Employed', 'Further study', 'Seeking work', 'Unreported'];
    if (!in_array($status, $allowedStatuses, true)) {
        throw new InvalidArgumentException('Choose a valid graduate outcome.');
    }

    $color = $input['color'] ?? 'blue';
    $allowedColors = ['coral', 'blue', 'yellow', 'green', 'pink', 'purple', 'orange', 'teal'];
    if (!is_string($color) || !in_array($color, $allowedColors, true)) {
        throw new InvalidArgumentException('Choose a valid avatar color.');
    }

    return [
        'name' => $name,
        'email' => $email,
        'program' => required_string($input, 'program', 255),
        'year' => $year,
        'academicBackground' => required_string($input, 'academicBackground', 120, 'Not specified'),
        'status' => $status,
        'role' => required_string($input, 'role', 160, '-'),
        'employer' => required_string($input, 'employer', 160, '-'),
        'location' => required_string($input, 'location', 160, '-'),
        'color' => $color,
    ];
}

function list_graduates(PDO $connection): array
{
    $statement = $connection->query(
        'SELECT id, name, email, program, graduation_year AS year,
                academic_background AS academicBackground, status, role, employer, location, color
         FROM graduates ORDER BY id DESC'
    );
    return array_map(static function (array $graduate): array {
        $graduate['id'] = (int) $graduate['id'];
        $graduate['year'] = (int) $graduate['year'];
        return $graduate;
    }, $statement->fetchAll());
}

function find_graduate(PDO $connection, int $id): ?array
{
    $statement = $connection->prepare(
        'SELECT id, name, email, program, graduation_year AS year,
                academic_background AS academicBackground, status, role, employer, location, color
         FROM graduates WHERE id = :id'
    );
    $statement->execute(['id' => $id]);
    $graduate = $statement->fetch();
    if ($graduate === false) {
        return null;
    }

    $graduate['id'] = (int) $graduate['id'];
    $graduate['year'] = (int) $graduate['year'];
    return $graduate;
}

function graduate_parameters(array $graduate): array
{
    return [
        'name' => $graduate['name'],
        'email' => $graduate['email'],
        'program' => $graduate['program'],
        'year' => $graduate['year'],
        'academicBackground' => $graduate['academicBackground'],
        'status' => $graduate['status'],
        'role' => $graduate['role'],
        'employer' => $graduate['employer'],
        'location' => $graduate['location'],
        'color' => $graduate['color'],
    ];
}
