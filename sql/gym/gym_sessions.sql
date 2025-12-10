CREATE TABLE
    gym_sessions (
        session_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        -- 🗓️ Weekday or custom recurring setup
        week_days
        SET
            ('Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun') DEFAULT NULL,
            -- if recurrence = 'Daily', week_days = NULL
            start_time TIME NOT NULL,
            end_time TIME GENERATED ALWAYS AS (
                ADDTIME (start_time, SEC_TO_TIME (duration_minutes * 60))
            ) STORED,
            gym_id BIGINT UNSIGNED DEFAULT NULL,
            -- 💪 Trainer or class info
            service_name VARCHAR(191) NOT NULL,
            description TEXT DEFAULT NULL,
            -- ⚙️ Config
            capacity INT DEFAULT 10,
            duration_minutes INT UNSIGNED NOT NULL,
            is_active BOOLEAN DEFAULT TRUE,
            recurrence ENUM ('Daily', 'Custom', 'OneTime', 'Weekly', 'Monthly') DEFAULT 'Daily',
            -- 📅 Active period (optional)
            created_by BIGINT UNSIGNED NULL,
            updated_by BIGINT UNSIGNED NULL,
            -- 🕒 Timestamps
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            -- 🔗 Relations
            FOREIGN KEY (gym_id) REFERENCES gyms (gym_id) ON DELETE CASCADE,
            -- ⚡ Indexing
            INDEX (gym_id),
            INDEX (is_active),
            INDEX (service_name),
    ) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;