CREATE TABLE
    client_gym_memberships (
        booking_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        -- 🔗 Relations
        client_id BIGINT UNSIGNED NOT NULL,
        gym_id BIGINT UNSIGNED NOT NULL,
        plan_id BIGINT UNSIGNED NOT NULL,
        valid_from DATE NOT NULL,
        valid_to DATE NOT NULL,
        status ENUM ('active', 'cancelled', 'completed') DEFAULT 'active',
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
        FOREIGN KEY (plan_id) REFERENCES membership_plans (plan_id) ON DELETE CASCADE,
        -- Indexing for faster queries
        INDEX (client_id),
        INDEX (gym_id),
        INDEX (plan_id),
        INDEX (valid_from, valid_to)
    ) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;