CREATE TABLE
    client_trainer_feedback (
        feedback_id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
        -- References
        client_id BIGINT UNSIGNED NOT NULL,
        trainer_id BIGINT UNSIGNED NOT NULL,
        -- Session quality ratings
        quality ENUM (
            'Poor',
            'Average',
            'Good',
            'Very Good',
            'Excellent'
        ) DEFAULT NULL,
        punctuality ENUM (
            'Poor',
            'Average',
            'Good',
            'Very Good',
            'Excellent'
        ) DEFAULT NULL,
        hygiene ENUM (
            'Poor',
            'Average',
            'Good',
            'Very Good',
            'Excellent'
        ) DEFAULT NULL,
        workout_feel ENUM ('Too Easy', 'Just Right', 'Too Hard') DEFAULT NULL,
        rebook ENUM ('Yes', 'Maybe', 'No') DEFAULT NULL,
        -- Misbehavior / issue reporting
        misbehave_reported TINYINT (1) NOT NULL DEFAULT 0,
        misbehave_details TEXT DEFAULT NULL,
        -- Ratings & comments
        rating TINYINT UNSIGNED NOT NULL,
        comments TEXT DEFAULT NULL,
        -- Optional video upload
        video_url VARCHAR(255) DEFAULT NULL,
        -- Timestamps
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        -- Indexes
        KEY idx_client_trainer_feedback (client_id, trainer_id),
        -- Foreign keys
        FOREIGN KEY (client_id) REFERENCES clients (client_id) ON DELETE CASCADE ON UPDATE CASCADE,
        FOREIGN KEY (trainer_id) REFERENCES trainers (trainer_id) ON DELETE CASCADE ON UPDATE CASCADE
    ) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci