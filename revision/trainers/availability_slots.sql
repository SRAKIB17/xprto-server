CREATE TABLE
    trainer_weekly_slots (
        slot_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
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
        FOREIGN KEY (gym_id) REFERENCES gyms (gym_id),
        UNIQUE (
            gym_id,
            trainer_id,
            week_day,
            start_time,
            duration_minutes
        ),
        INDEX (trainer_id),
        INDEX (gym_id),
        INDEX (week_day)
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

-------------------------------------------------------------------------------------------------------------------------------
-- 3. Availability Slots table
CREATE TABLE
    availability_slots (
        slot_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        trainer_id BIGINT UNSIGNED NOT NULL,
        service_id BIGINT UNSIGNED NOT NULL,
        date_from DATE NOT NULL,
        date_to DATE DEFAULT NULL,
        time_from TIME NOT NULL, -- FIXED: was DATE
        time_to TIME NOT NULL,
        notes VARCHAR(255),
        recurrence_type ENUM ('None', 'Daily', 'Custom') DEFAULT 'None',
        recurrence_days JSON DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE (
            trainer_id,
            date_from,
            date_to,
            time_from,
            time_to
        ),
        FOREIGN KEY (trainer_id) REFERENCES trainers (trainer_id) ON DELETE CASCADE,
        FOREIGN KEY (service_id) REFERENCES trainer_services (service_id) ON DELETE CASCADE
    ) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- =====================================
-- SAMPLE DATA FOR availability_slots
-- =====================================
```
INSERT INTO availability_slots
(trainer_id, service_id, date_from, date_to, time_from, time_to, notes, recurrence_type, recurrence_days)
VALUES
-- Service 1
(1, 1, '2025-10-06', NULL, '09:00:00', '10:00:00', 'Morning session', 'None', NULL),
(1, 1, '2025-10-06', NULL, '11:00:00', '12:00:00', 'Late morning session', 'None', NULL),

-- Service 2
(1, 2, '2025-10-06', '2025-10-15', '10:00:00', '11:00:00', 'Yoga basics', 'Daily', NULL),
(1, 2, '2025-10-07', '2025-10-15', '16:00:00', '17:00:00', 'Evening yoga', 'Daily', NULL),

-- Service 3 (Custom recurrence)
(1, 3, '2025-10-08', '2025-10-30', '09:00:00', '10:00:00', 'Strength training', 'Custom', '["Mon","Wed","Fri"]'),
(1, 3, '2025-10-08', '2025-10-30', '11:00:00', '12:00:00', 'Strength advanced', 'Custom', '["Tue","Thu"]'),

-- Service 4
(1, 4, '2025-10-09', '2025-10-09', '08:00:00', '09:00:00', 'Powerlifting intro', 'None', NULL),
(1, 4, '2025-10-09', '2025-10-09', '10:00:00', '11:00:00', 'Powerlifting advanced', 'None', NULL),

-- Service 5 (Custom recurrence)
(1, 5, '2025-10-10', '2025-10-30', '07:00:00', '08:00:00', 'Morning cardio', 'Custom', '["Mon","Tue","Wed"]'),
(1, 5, '2025-10-10', '2025-10-30', '17:00:00', '18:00:00', 'Evening cardio', 'Custom', '["Thu","Fri"]'),

-- Service 6
(1, 7, '2025-10-11', '2025-10-11', '09:00:00', '10:00:00', 'Pilates session', 'None', NULL),
(1, 5, '2025-10-11', '2025-10-11', '12:00:00', '13:00:00', 'Pilates core', 'None', NULL),

-- Service 7 (Daily)
(1, 7, '2025-10-12', '2025-10-30', '08:00:00', '09:00:00', 'Morning stretch', 'Daily', NULL),
(1, 7, '2025-10-12', '2025-10-30', '18:00:00', '19:00:00', 'Evening stretch', 'Daily', NULL),

-- Service 8 (Custom)
(1, 8, '2025-10-13', '2025-10-30', '10:00:00', '11:00:00', 'HIIT training', 'Custom', '["Mon","Wed","Fri"]'),
(1, 8, '2025-10-13', '2025-10-30', '15:00:00', '16:00:00', 'HIIT advanced', 'Custom', '["Tue","Thu"]'),

-- Service 9
(1, 9, '2025-10-14', '2025-10-14', '09:00:00', '10:00:00', 'Functional training', 'None', NULL),
(1, 9, '2025-10-14', '2025-10-14', '14:00:00', '15:00:00', 'Functional advanced', 'None', NULL),

-- Service 10 (Daily)
(1, 10, '2025-10-15', '2025-10-30', '07:00:00', '08:00:00', 'Core training', 'Daily', NULL),
(1, 10, '2025-10-15', '2025-10-30', '17:00:00', '18:00:00', 'Core evening session', 'Daily', NULL);

```