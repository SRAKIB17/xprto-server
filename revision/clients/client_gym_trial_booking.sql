CREATE TABLE
    client_gym_trial_booking (
        booking_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        -- 🔗 Relations
        client_id BIGINT UNSIGNED NOT NULL,
        gym_id BIGINT UNSIGNED NOT NULL,
        session_id BIGINT UNSIGNED NOT NULL,
        -- 🗓️ Date info
        day INT NOT NULL,
        month INT NOT NULL,
        year INT NOT NULL,
        -- 💰 Payment / transaction info
        txn_id VARCHAR(191) NOT NULL,
        reference VARCHAR(191) DEFAULT NULL,
        -- 🔑 Identifier / idempotent key for safely retrying
        idempotent_key VARCHAR(191) DEFAULT NULL UNIQUE,
        -- ⏰ Timestamps
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        -- ⚡ Relations
        FOREIGN KEY (client_id) REFERENCES clients (client_id) ON DELETE CASCADE,
        FOREIGN KEY (gym_id) REFERENCES gyms (gym_id) ON DELETE CASCADE,
        FOREIGN KEY (session_id) REFERENCES gym_sessions (session_id) ON DELETE CASCADE,
        -- Indexing for faster queries
        INDEX idx_client_id (client_id),
        INDEX idx_gym_id (gym_id),
        INDEX idx_session_id (session_id),
        INDEX idx_date (day, month, year)
    ) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;