-- Gym feedback table
CREATE TABLE
    gym_feedbacks (
        feedback_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        gym_id BIGINT UNSIGNED NOT NULL,
        client_id BIGINT UNSIGNED DEFAULT NULL, -- Client giving the feedback
        trainer_id BIGINT UNSIGNED DEFAULT NULL, -- Trainer giving the feedback
        rating TINYINT UNSIGNED NOT NULL CHECK (rating BETWEEN 1 AND 5),
        comment TEXT DEFAULT NULL,
        reply TEXT DEFAULT NULL,
        video_url VARCHAR(255) DEFAULT NULL,
        feedback_type ENUM ('client', 'trainer') NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (gym_id) REFERENCES gyms (gym_id) ON DELETE CASCADE,
        FOREIGN KEY (client_id) REFERENCES clients (client_id) ON DELETE SET NULL,
        FOREIGN KEY (trainer_id) REFERENCES trainers (trainer_id) ON DELETE SET NULL
    ) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;