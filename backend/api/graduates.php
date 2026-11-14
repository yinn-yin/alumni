<?php
declare(strict_types=1);

require_once dirname(__DIR__) . '/bootstrap.php';

try {
    $connection = database();
    $method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

    if ($method === 'GET') {
        if (!isset($_GET['id'])) {
            respond(['data' => list_graduates($connection)]);
        }

        $id = filter_var($_GET['id'], FILTER_VALIDATE_INT);
        if ($id === false || $id < 1) {
            throw new InvalidArgumentException('Graduate ID must be a positive integer.');
        }

        $graduate = find_graduate($connection, $id);
        if ($graduate === null) {
            respond(['error' => 'Graduate not found.'], 404);
        }
        respond(['data' => $graduate]);
    }

    if ($method === 'POST') {
        $graduate = validate_graduate(read_json());
        $statement = $connection->prepare(
            'INSERT INTO graduates
             (name, email, program, graduation_year, academic_background, status, role, employer, location, color)
             VALUES
             (:name, :email, :program, :year, :academicBackground, :status, :role, :employer, :location, :color)'
        );
        $statement->execute(graduate_parameters($graduate));
        respond(['data' => find_graduate($connection, (int) $connection->lastInsertId())], 201);
    }

    if ($method === 'PUT') {
        $id = filter_var($_GET['id'] ?? null, FILTER_VALIDATE_INT);
        if ($id === false || $id < 1) {
            throw new InvalidArgumentException('Graduate ID must be a positive integer.');
        }
        if (find_graduate($connection, $id) === null) {
            respond(['error' => 'Graduate not found.'], 404);
        }

        $graduate = validate_graduate(read_json());
        $parameters = graduate_parameters($graduate);
        $parameters['id'] = $id;
        $statement = $connection->prepare(
            'UPDATE graduates
             SET name = :name, email = :email, program = :program, graduation_year = :year,
                 academic_background = :academicBackground, status = :status, role = :role,
                 employer = :employer, location = :location, color = :color
             WHERE id = :id'
        );
        $statement->execute($parameters);
        respond(['data' => find_graduate($connection, $id)]);
    }

    header('Allow: GET, POST, PUT');
    respond(['error' => 'Method not allowed.'], 405);
} catch (InvalidArgumentException $exception) {
    respond(['error' => $exception->getMessage()], 400);
} catch (PDOException $exception) {
    error_log($exception->getMessage());
    respond(['error' => 'MySQL request failed. Check the connection and schema.'], 500);
} catch (RuntimeException $exception) {
    error_log($exception->getMessage());
    respond(['error' => $exception->getMessage()], 500);
}
