CREATE TABLE
    trainer_gyms (
        id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        trainer_id BIGINT UNSIGNED NOT NULL,
        gym_id BIGINT UNSIGNED NOT NULL,
        assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE (trainer_id, gym_id),
        FOREIGN KEY (trainer_id) REFERENCES trainers (trainer_id) ON DELETE CASCADE,
        FOREIGN KEY (gym_id) REFERENCES gyms (gym_id) ON DELETE CASCADE
    ) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4;