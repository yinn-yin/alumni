<?php
declare(strict_types=1);

require_once dirname(__DIR__) . '/bootstrap.php';

$connection = null;
try {
    $connection = database();
    $payload = read_json();
    $graduates = $payload['graduates'] ?? null;
    if (!is_array($graduates) || $graduates === [] || count($graduates) > 1000) {
        throw new InvalidArgumentException('Provide between 1 and 1000 graduate records to import.');
    }

    $lock = $connection->query("SELECT GET_LOCK('alumni_initial_graduate_import', 10)")->fetchColumn();
    if ((int) $lock !== 1) {
        throw new RuntimeException('Could not safely start the initial import. Please retry.');
    }

    $connection->beginTransaction();
    $existingId = $connection->query('SELECT id FROM graduates LIMIT 1 FOR UPDATE')->fetchColumn();
    if ($existingId !== false) {
        $connection->commit();
        respond(['data' => list_graduates($connection), 'imported' => false]);
    }

    $statement = $connection->prepare(
        'INSERT INTO graduates
         (name, email, program, graduation_year, academic_background, status, role, employer, location, color)
         VALUES
         (:name, :email, :program, :year, :academicBackground, :status, :role, :employer, :location, :color)'
    );
    foreach (array_reverse($graduates) as $graduate) {
        if (!is_array($graduate)) {
            throw new InvalidArgumentException('Each imported graduate must be a JSON object.');
        }
        $statement->execute(graduate_parameters(validate_graduate($graduate)));
    }

    $connection->commit();
    respond(['data' => list_graduates($connection), 'imported' => true], 201);
} catch (InvalidArgumentException $exception) {
    if ($connection instanceof PDO && $connection->inTransaction()) {
        $connection->rollBack();
    }
    respond(['error' => $exception->getMessage()], 400);
} catch (PDOException $exception) {
    if ($connection instanceof PDO && $connection->inTransaction()) {
        $connection->rollBack();
    }
    error_log($exception->getMessage());
    respond(['error' => 'Graduate migration failed and was rolled back. Check the MySQL connection and schema.'], 500);
} catch (RuntimeException $exception) {
    if ($connection instanceof PDO && $connection->inTransaction()) {
        $connection->rollBack();
    }
    error_log($exception->getMessage());
    respond(['error' => $exception->getMessage()], 500);
}
