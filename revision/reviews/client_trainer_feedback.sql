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
        reply TEXT DEFAULT NULL,
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
INSERT INTO
    client_trainer_feedback (
        client_id,
        trainer_id,
        quality,
        punctuality,
        hygiene,
        workout_feel,
        rebook,
        misbehave_reported,
        rating,
        comments,
        video_url
    )
VALUES
    (
        1,
        1,
        'Good',
        'Very Good',
        'Good',
        'Just Right',
        'Yes',
        0,
        4,
        'Trainer was very helpful',
        NULL
    ),
    (
        1,
        1,
        'Excellent',
        'Excellent',
        'Excellent',
        'Too Hard',
        'Maybe',
        0,
        5,
        'Loved the session',
        NULL
    ),
    (
        1,
        1,
        'Average',
        'Good',
        'Average',
        'Just Right',
        'Yes',
        0,
        3,
        'Session was okay',
        NULL
    ),
    (
        1,
        1,
        'Poor',
        'Average',
        'Good',
        'Too Easy',
        'No',
        0,
        2,
        'Could be better',
        NULL
    ),
    (
        1,
        1,
        'Very Good',
        'Very Good',
        'Very Good',
        'Just Right',
        'Yes',
        0,
        4,
        'Good energy and guidance',
        NULL
    ),
    (
        1,
        1,
        'Good',
        'Good',
        'Average',
        'Too Hard',
        'Maybe',
        0,
        4,
        'Challenging workout',
        NULL
    ),
    (
        1,
        1,
        'Excellent',
        'Good',
        'Excellent',
        'Just Right',
        'Yes',
        0,
        5,
        'Perfect session',
        NULL
    ),
    (
        1,
        1,
        'Average',
        'Average',
        'Average',
        'Too Easy',
        'No',
        0,
        3,
        'It was fine',
        NULL
    ),
    (
        1,
        1,
        'Very Good',
        'Good',
        'Good',
        'Just Right',
        'Maybe',
        0,
        4,
        'Trainer explained exercises well',
        NULL
    ),
    (
        1,
        1,
        'Good',
        'Very Good',
        'Excellent',
        'Too Hard',
        'Yes',
        0,
        4,
        'Intense but rewarding',
        NULL
    ),
    (
        1,
        1,
        'Poor',
        'Poor',
        'Average',
        'Too Easy',
        'No',
        0,
        2,
        'Not very motivating',
        NULL
    ),
    (
        1,
        1,
        'Excellent',
        'Very Good',
        'Excellent',
        'Just Right',
        'Yes',
        0,
        5,
        'Excellent guidance',
        NULL
    ),
    (
        1,
        1,
        'Very Good',
        'Good',
        'Very Good',
        'Too Hard',
        'Maybe',
        0,
        4,
        'Loved the challenge',
        NULL
    ),
    (
        1,
        1,
        'Good',
        'Average',
        'Good',
        'Just Right',
        'Yes',
        0,
        4,
        'Good effort by trainer',
        NULL
    ),
    (
        1,
        1,
        'Average',
        'Good',
        'Average',
        'Too Easy',
        'No',
        0,
        3,
        'Could improve',
        NULL
    ),
    (
        1,
        1,
        'Very Good',
        'Very Good',
        'Excellent',
        'Just Right',
        'Yes',
        0,
        4,
        'Trainer was motivating',
        NULL
    ),
    (
        1,
        1,
        'Excellent',
        'Excellent',
        'Excellent',
        'Too Hard',
        'Maybe',
        0,
        5,
        'Fantastic session',
        NULL
    ),
    (
        1,
        1,
        'Good',
        'Good',
        'Good',
        'Just Right',
        'Yes',
        0,
        4,
        'Enjoyed the session',
        NULL
    ),
    (
        1,
        1,
        'Poor',
        'Average',
        'Poor',
        'Too Easy',
        'No',
        0,
        2,
        'Not satisfied',
        NULL
    ),
    (
        1,
        1,
        'Very Good',
        'Very Good',
        'Good',
        'Just Right',
        'Yes',
        0,
        4,
        'Trainer was professional',
        NULL
    );