CREATE TABLE
    trainer_weekly_slots (
        slot_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        session_id BIGINT UNSIGNED NOT NULL, -- Refers to gym_sessions.session_id
        trainer_id BIGINT UNSIGNED NOT NULL, -- Assigned trainer
        replacement_trainer_id BIGINT UNSIGNED DEFAULT NULL, -- Backup or temporary replacement trainer
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        -- Foreign Keys
        FOREIGN KEY (trainer_id) REFERENCES trainers (trainer_id) ON DELETE CASCADE,
        FOREIGN KEY (session_id) REFERENCES gym_sessions (session_id) ON DELETE CASCADE,
        FOREIGN KEY (replacement_trainer_id) REFERENCES trainers (trainer_id) ON DELETE SET NULL,
        UNIQUE (session_id, trainer_id),
        INDEX (trainer_id),
        INDEX (session_id)
    ) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

```
-- Assign trainer_id = 1 to all gym_sessions (session_id 1–7)
INSERT INTO trainer_weekly_slots (session_id, trainer_id)
VALUES
(1, 1),
(2, 1),
(3, 1),
(4, 1),
(5, 1),
(6, 1),
(7, 1);

```
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
            valid_from DATE DEFAULT NULL,
            valid_to DATE DEFAULT NULL,
            -- 👤 Audit info
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
            INDEX (valid_from),
            INDEX (valid_to)
    ) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

```

-- 1️⃣ Daily recurring session (every day)
INSERT INTO gym_sessions 
(service_name, description, start_time, duration_minutes, recurrence, gym_id, capacity, is_active, created_by)
VALUES 
('Morning Yoga', 'Daily Yoga for flexibility', '06:30:00', 60, 'Daily', 1, 15, TRUE, 1);

-- 2️⃣ Custom weekdays session (Mon, Wed, Fri)
INSERT INTO gym_sessions 
(service_name, description, start_time, duration_minutes, recurrence, week_days, gym_id, capacity, is_active, created_by)
VALUES 
('Strength Training', 'Strength and conditioning', '18:00:00', 90, 'Custom', 'Mon,Wed,Fri', 1, 12, TRUE, 1);

-- 3️⃣ One-time session
INSERT INTO gym_sessions 
(service_name, description, start_time, duration_minutes, recurrence, valid_from, valid_to, gym_id, capacity, is_active, created_by)
VALUES 
('Special Bootcamp', 'One-time intensive session', '10:00:00', 120, 'OneTime', '2025-11-05', '2025-11-05', 1, 20, TRUE, 1);

-- 4️⃣ Weekly recurring (every week on Tue)
INSERT INTO gym_sessions 
(service_name, description, start_time, duration_minutes, recurrence, week_days, gym_id, capacity, is_active, created_by)
VALUES 
('Cardio Blast', 'Weekly cardio session', '07:00:00', 45, 'Weekly', 'Tue', 1, 18, TRUE, 1);

-- 5️⃣ Monthly recurring (e.g., first Sat of every month)
INSERT INTO gym_sessions 
(service_name, description, start_time, duration_minutes, recurrence, week_days, gym_id, capacity, is_active, created_by)
VALUES 
('Monthly Workshop', 'Nutrition and fitness workshop', '09:00:00', 120, 'Monthly', 'Sat', 1, 25, TRUE, 1);

-- 6️⃣ Another Custom weekdays session (Tue + Thu)
INSERT INTO gym_sessions 
(service_name, description, start_time, duration_minutes, recurrence, week_days, gym_id, capacity, is_active, created_by)
VALUES 
('Pilates', 'Pilates for core strength', '17:30:00', 60, 'Custom', 'Tue,Thu', 1, 10, TRUE, 1);

-- 7️⃣ Evening Yoga Daily (alternative daily session)
INSERT INTO gym_sessions 
(service_name, description, start_time, duration_minutes, recurrence, gym_id, capacity, is_active, created_by)
VALUES 
('Evening Yoga', 'Relaxing evening yoga', '20:00:00', 60, 'Daily', 1, 12, TRUE, 1);



    ```