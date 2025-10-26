CREATE TABLE
    trainer_weekly_slots (
        slot_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        session_id BIGINT UNSIGNED DEFAULT NULL,
        trainer_id BIGINT UNSIGNED NOT NULL, -- Trainer
        gym_id BIGINT UNSIGNED NOT NULL, -- Gym where the trainer works
        -- Day-of-week slot
        week_day ENUM ('Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun') DEFAULT NULL, --- if daily then it is null
        start_time TIME NOT NULL,
        duration_minutes INT UNSIGNED NOT NULL,
        -- Slot details
        service_name VARCHAR(191) NOT NULL,
        recurrence ENUM ('Daily', 'Custom') DEFAULT 'Daily',
        valid_from DATE DEFAULT NULL, -- slot active starting this date (optional)
        valid_to DATE DEFAULT NULL, -- slot active until this date (optional)
        -- Status / meta
        is_active BOOLEAN DEFAULT TRUE, -- if trainer temporarily disables a slot
        created_by BIGINT UNSIGNED NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        -- Foreign keys
        FOREIGN KEY (trainer_id) REFERENCES trainers (trainer_id),
        FOREIGN KEY (session_id) REFERENCES gym_sessions (session_id),
        FOREIGN KEY (gym_id) REFERENCES gyms (gym_id),
        UNIQUE (
            gym_id,
            session_id,
            trainer_id,
            week_day,
            start_time,
            duration_minutes
        ),
        INDEX (trainer_id),
        INDEX (gym_id),
        INDEX (week_day)
    ) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

CREATE TABLE
    gym_sessions (
        session_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        week_day ENUM ('Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun') DEFAULT NULL, --- if daily then it is null
        start_time TIME NOT NULL,
        gym_id BIGINT UNSIGNED DEFAULT NULL,
        duration_minutes INT UNSIGNED NOT NULL,
        created_by BIGINT UNSIGNED NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (gym_id) REFERENCES gyms (gym_id)
    ) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- Exceptions for specific dates (modify/remove/add overrides)
CREATE TABLE
    slot_exceptions (
        exception_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        slot_id BIGINT UNSIGNED NULL, -- null for added ad-hoc slot (not from template)
        exception_date DATE NOT NULL, -- the date this exception applies to
        action ENUM ('remove', 'modify', 'add') NOT NULL DEFAULT 'remove',
        -- when action='modify' or 'add', optional override fields:
        start_time TIME NOT NULL,
        duration_minutes INT UNSIGNED NOT NULL,
        service_name VARCHAR(191) DEFAULT NULL,
        reason TEXT DEFAULT NULL, -- optional reason for exception
        created_by BIGINT UNSIGNED NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (slot_id) REFERENCES trainer_weekly_slots (slot_id) ON DELETE SET NULL,
        INDEX (exception_date)
    ) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

```
-- Morning slots
INSERT INTO trainer_weekly_slots
    (trainer_id, gym_id, week_day, start_time, duration_minutes, service_name, recurrence, valid_from, valid_to, is_active, created_by)
VALUES
    (1, 1, 'Mon', '07:00:00', 60, 'Yoga Class', 'Custom', '2025-10-27', NULL, TRUE, 1),
    (1, 1, 'Mon', '08:00:00', 60, 'Yoga Class', 'Custom', '2025-10-27', NULL, TRUE, 1),
    (1, 1, 'Tue', '07:00:00', 60, 'Yoga Class', 'Custom', '2025-10-27', NULL, TRUE, 1),
    (1, 1, 'Tue', '08:00:00', 60, 'Yoga Class', 'Custom', '2025-10-27', NULL, TRUE, 1),
    (1, 1, 'Wed', '07:00:00', 60, 'Yoga Class', 'Custom', '2025-10-27', NULL, TRUE, 1),
    (1, 1, 'Wed', '08:00:00', 60, 'Yoga Class', 'Custom', '2025-10-27', NULL, TRUE, 1),
    (1, 1, 'Thu', '07:00:00', 60, 'Yoga Class', 'Custom', '2025-10-27', NULL, TRUE, 1),
    (1, 1, 'Thu', '08:00:00', 60, 'Yoga Class', 'Custom', '2025-10-27', NULL, TRUE, 1),
    (1, 1, 'Fri', '07:00:00', 60, 'Yoga Class', 'Custom', '2025-10-27', NULL, TRUE, 1),
    (1, 1, 'Fri', '08:00:00', 60, 'Yoga Class', 'Custom', '2025-10-27', NULL, TRUE, 1),
    (1, 1, 'Sat', '07:00:00', 60, 'Yoga Class', 'Custom', '2025-10-27', NULL, TRUE, 1),
    (1, 1, 'Sat', '08:00:00', 60, 'Yoga Class', 'Custom', '2025-10-27', NULL, TRUE, 1),
    (1, 1, 'Sun', '07:00:00', 60, 'Yoga Class', 'Custom', '2025-10-27', NULL, TRUE, 1),
    (1, 1, 'Sun', '08:00:00', 60, 'Yoga Class', 'Custom', '2025-10-27', NULL, TRUE, 1);

-- Evening slots
INSERT INTO trainer_weekly_slots
    (trainer_id, gym_id, week_day, start_time, duration_minutes, service_name, recurrence, valid_from, valid_to, is_active, created_by)
VALUES
    (1, 1, 'Mon', '17:00:00', 60, 'Yoga Class', 'Custom', '2025-10-27', NULL, TRUE, 1),
    (1, 1, 'Mon', '18:00:00', 60, 'Yoga Class', 'Custom', '2025-10-27', NULL, TRUE, 1),
    (1, 1, 'Tue', '17:00:00', 60, 'Yoga Class', 'Custom', '2025-10-27', NULL, TRUE, 1),
    (1, 1, 'Tue', '18:00:00', 60, 'Yoga Class', 'Custom', '2025-10-27', NULL, TRUE, 1),
    (1, 1, 'Wed', '17:00:00', 60, 'Yoga Class', 'Custom', '2025-10-27', NULL, TRUE, 1),
    (1, 1, 'Wed', '18:00:00', 60, 'Yoga Class', 'Custom', '2025-10-27', NULL, TRUE, 1),
    (1, 1, 'Thu', '17:00:00', 60, 'Yoga Class', 'Custom', '2025-10-27', NULL, TRUE, 1),
    (1, 1, 'Thu', '18:00:00', 60, 'Yoga Class', 'Custom', '2025-10-27', NULL, TRUE, 1),
    (1, 1, 'Fri', '17:00:00', 60, 'Yoga Class', 'Custom', '2025-10-27', NULL, TRUE, 1),
    (1, 1, 'Fri', '18:00:00', 60, 'Yoga Class', 'Custom', '2025-10-27', NULL, TRUE, 1),
    (1, 1, 'Sat', '17:00:00', 60, 'Yoga Class', 'Custom', '2025-10-27', NULL, TRUE, 1),
    (1, 1, 'Sat', '18:00:00', 60, 'Yoga Class', 'Custom', '2025-10-27', NULL, TRUE, 1),
    (1, 1, 'Sun', '17:00:00', 60, 'Yoga Class', 'Custom', '2025-10-27', NULL, TRUE, 1),
    (1, 1, 'Sun', '18:00:00', 60, 'Yoga Class', 'Custom', '2025-10-27', NULL, TRUE, 1);


    ```