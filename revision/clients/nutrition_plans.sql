CREATE TABLE
    IF NOT EXISTS nutrition_plans (
        plan_id BIGINT UNSIGNED NOT NULL PRIMARY KEY AUTO_INCREMENT,
        client_id BIGINT UNSIGNED DEFAULT NULL, -- references users.user_id
        session_id BIGINT UNSIGNED DEFAULT NULL,
        added_by BIGINT UNSIGNED DEFAULT NULL, -- references trainers.trainer_id
        title VARCHAR(255) DEFAULT NULL,
        description TEXT DEFAULT NULL,
        start DATE NULL,
        end DATE NULL,
        calories INT DEFAULT NULL,
        protein_g DECIMAL(6, 2) DEFAULT NULL,
        carbs_g DECIMAL(6, 2) DEFAULT NULL,
        fats_g DECIMAL(6, 2) DEFAULT NULL,
        attachment JSON NULL, -- ARRAY OF PATH
        tags JSON NULL, -- ARRAY OF TAGS
        -- notes
        client_note TEXT NULL, -- note from client while requesting
        trainer_note TEXT NULL, -- trainer can add private/public notes
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX (added_by, created_at),
        INDEX (title),
        INDEX (client_id, created_at),
        FOREIGN KEY (client_id) REFERENCES clients (client_id) ON DELETE CASCADE ON UPDATE CASCADE,
        FOREIGN KEY (session_id) REFERENCES gym_sessions (session_id) ON DELETE CASCADE ON UPDATE CASCADE,
        FOREIGN KEY (added_by) REFERENCES trainers (trainer_id) ON DELETE CASCADE ON UPDATE CASCADE
    ) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- Main plan
CREATE TABLE
    nutrition_plan_meals (
        meal_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        plan_id BIGINT UNSIGNED NOT NULL,
        -- 🏷️ Basic Info
        name VARCHAR(191) NOT NULL,
        description TEXT DEFAULT NULL,
        -- 🔢 Nutritional Summary
        calories INT DEFAULT NULL,
        protein_g DECIMAL(6, 2) DEFAULT NULL,
        carbs_g DECIMAL(6, 2) DEFAULT NULL,
        fats_g DECIMAL(6, 2) DEFAULT NULL,
        -- 🖼️ Visual / Meal Metadata
        image_url VARCHAR(512) DEFAULT NULL,
        meal_time ENUM ('breakfast', 'lunch', 'dinner', 'snack', 'other') DEFAULT 'other',
        -- 🗓️ Time Window
        notes JSON DEFAULT NULL, -- store array of notes as JSON (better than TEXT)
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        -- 🔗 Foreign Keys
        FOREIGN KEY (plan_id) REFERENCES nutrition_plans (plan_id) ON DELETE CASCADE,
        INDEX (meal_time)
    ) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;