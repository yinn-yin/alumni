CREATE DATABASE IF NOT EXISTS alumni_tracker
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE alumni_tracker;

CREATE TABLE IF NOT EXISTS graduates (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  name VARCHAR(160) NOT NULL,
  email VARCHAR(254) NOT NULL,
  program VARCHAR(255) NOT NULL,
  graduation_year SMALLINT UNSIGNED NOT NULL,
  academic_background VARCHAR(120) NOT NULL DEFAULT 'Not specified',
  status ENUM('Employed', 'Further study', 'Seeking work', 'Unreported') NOT NULL DEFAULT 'Unreported',
  role VARCHAR(160) NOT NULL DEFAULT '-',
  employer VARCHAR(160) NOT NULL DEFAULT '-',
  location VARCHAR(160) NOT NULL DEFAULT '-',
  color VARCHAR(16) NOT NULL DEFAULT 'blue',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_graduates_year (graduation_year),
  KEY idx_graduates_status (status)
) ENGINE=InnoDB
  DEFAULT CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;
