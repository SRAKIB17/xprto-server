-- Assignment master (one row per assignment)
CREATE TABLE
    session_assignment_clients (
        assignment_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        client_id BIGINT UNSIGNED NOT NULL,
        session_id BIGINT UNSIGNED NOT NULL,
        valid_from DATE NOT NULL,
        valid_to DATE NOT NULL,
        status ENUM ('active', 'cancelled', 'completed') DEFAULT 'active',
        idempotent_key VARCHAR(191) DEFAULT NULL UNIQUE,
        assigned_by BIGINT UNSIGNED NULL, -- admin or system user id
        note TEXT DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (client_id) REFERENCES clients (client_id) ON DELETE CASCADE,
        FOREIGN KEY (session_id) REFERENCES gym_sessions (session_id) ON DELETE CASCADE,
        FOREIGN KEY (assigned_by) REFERENCES gyms (gym_id) ON DELETE SET NULL,
        INDEX (client_id),
        INDEX (session_id),
        INDEX (valid_from),
        INDEX (valid_to)
    ) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4;