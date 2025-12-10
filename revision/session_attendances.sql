-- !done
CREATE TABLE
    session_attendances (
        attendance_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        run_id BIGINT UNSIGNED NOT NULL,
        session_id BIGINT UNSIGNED DEFAULT NULL, -- references gym_sessions(session_id)
        assignment_id BIGINT UNSIGNED DEFAULT NULL, -- reference to session_assignment_clients if assigned
        client_id BIGINT UNSIGNED DEFAULT NULL, -- redundant for quick lookups (also in assignment)
        trainer_id BIGINT UNSIGNED DEFAULT NULL, -- who marked the attendance
        status ENUM (
            'booked',
            'present',
            'absent',
            'late',
            'left_early'
        ) DEFAULT 'booked',
        checkin_at DATETIME DEFAULT NULL,
        checkout_at DATETIME DEFAULT NULL,
        remark TEXT DEFAULT NULL,
        marked_by BIGINT UNSIGNED NULL, -- who marked the attendance (trainer/admin)
        marked_role ENUM ("trainer", "gym", 'client') DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (run_id) REFERENCES session_runs (run_id) ON DELETE CASCADE,
        FOREIGN KEY (assignment_id) REFERENCES session_assignment_clients (assignment_id) ON DELETE SET NULL,
        FOREIGN KEY (session_id) REFERENCES gym_sessions (session_id) ON DELETE CASCADE,
        FOREIGN KEY (client_id) REFERENCES clients (client_id) ON DELETE CASCADE,
        FOREIGN KEY (trainer_id) REFERENCES trainers (trainer_id) ON DELETE CASCADE,
        UNIQUE (run_id, client_id, session_id, trainer_id), -- avoid duplicate attendance rows
        INDEX (run_id),
        INDEX (client_id),
        INDEX (status)
    ) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

CREATE TABLE
    trainer_session_run_locations (
        location_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        run_id BIGINT UNSIGNED NOT NULL, -- Which session run
        trainer_id BIGINT UNSIGNED NOT NULL, -- Trainer who is sending location
        lat DECIMAL(10, 7) NOT NULL,
        lng DECIMAL(10, 7) NOT NULL,
        distance DECIMAL(10, 7) NOT NULL,
        accuracy FLOAT DEFAULT NULL, -- optional (GPS accuracy)
        speed FLOAT DEFAULT NULL, -- optional
        sent_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, -- ping time
        FOREIGN KEY (run_id) REFERENCES session_runs (run_id) ON DELETE CASCADE,
        INDEX (run_id),
        INDEX (trainer_id),
        INDEX (sent_at)
    ) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;