CREATE TABLE
    trainer_weekly_slots (
        slot_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        session_id BIGINT UNSIGNED NOT NULL, -- Refers to gym_sessions.session_id
        trainer_id BIGINT UNSIGNED NOT NULL, -- Assigned trainer
        replacement_trainer_id BIGINT UNSIGNED DEFAULT NULL, -- Backup or temporary replacement trainer
        gym_id BIGINT UNSIGNED NOT NULL, -- Gym where session belongs
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        -- Foreign Keys
        FOREIGN KEY (trainer_id) REFERENCES trainers (trainer_id) ON DELETE CASCADE,
        FOREIGN KEY (session_id) REFERENCES gym_sessions (session_id) ON DELETE CASCADE,
        FOREIGN KEY (replacement_trainer_id) REFERENCES trainers (trainer_id) ON DELETE SET NULL,
        FOREIGN KEY (gym_id) REFERENCES gyms (gym_id) ON DELETE CASCADE,
        UNIQUE (gym_id, session_id, trainer_id),
        INDEX (trainer_id),
        INDEX (gym_id),
        INDEX (session_id)
    ) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

```
INSERT INTO trainer_weekly_slots (session_id, trainer_id, replacement_trainer_id, gym_id)
VALUES
(1, 1, 1, 1),  -- Morning Yoga handled by Rahul Sen, backup Amit Roy
(2, 1, NULL, 1), -- Zumba Fitness by Sneha Das
(3, 1, NULL, 1); -- Strength Training by Rahul Sen

```
CREATE TABLE
    gym_sessions (
        session_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        week_day ENUM ('Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun') DEFAULT NULL, --- if daily then it is null
        start_time TIME NOT NULL,
        gym_id BIGINT UNSIGNED DEFAULT NULL,
        duration_minutes INT UNSIGNED NOT NULL,
        service_name VARCHAR(191) NOT NULL,
        is_active BOOLEAN DEFAULT TRUE, -- if trainer temporarily disables a slot
        recurrence ENUM ('Daily', 'Custom') DEFAULT 'Daily',
        valid_from DATE DEFAULT NULL, -- slot active starting this date (optional)
        valid_to DATE DEFAULT NULL, -- slot active until this date (optional)
        created_by BIGINT UNSIGNED NULL,
        UNIQUE (gym_id, start_time, week_day, service_name),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (gym_id) REFERENCES gyms (gym_id)
    ) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

```
INSERT INTO gym_sessions (
    week_day,
    start_time,
    gym_id,
    duration_minutes,
    service_name,
    is_active,
    recurrence,
    valid_from,
    valid_to,
    created_by
)
VALUES
-- Monday Sessions
('Mon', '07:00:00', 1, 60, 'Morning Yoga', TRUE, 'Daily', '2025-10-01', NULL, 1),
('Mon', '09:00:00', 1, 45, 'Zumba Fitness', TRUE, 'Daily', '2025-10-01', NULL, 1),
('Mon', '18:00:00', 1, 60, 'Weight Training', TRUE, 'Daily', '2025-10-01', NULL, 1),

-- Tuesday Sessions
('Tue', '07:00:00', 1, 60, 'Power Yoga', TRUE, 'Daily', '2025-10-01', NULL, 1),
('Tue', '17:30:00', 1, 90, 'Cardio Burnout', TRUE, 'Daily', '2025-10-01', NULL, 1),

-- Wednesday Sessions
('Wed', '07:30:00', 1, 60, 'CrossFit Circuit', TRUE, 'Daily', '2025-10-01', NULL, 1),
('Wed', '19:00:00', 1, 60, 'Zumba Party', TRUE, 'Daily', '2025-10-01', NULL, 1),

-- Thursday Sessions
('Thu', '06:30:00', 1, 60, 'Stretch & Mobility', TRUE, 'Daily', '2025-10-01', NULL, 1),
('Thu', '18:30:00', 1, 75, 'HIIT Training', TRUE, 'Daily', '2025-10-01', NULL, 1),

-- Friday Sessions
('Fri', '07:00:00', 1, 60, 'Functional Fitness', TRUE, 'Daily', '2025-10-01', NULL, 1),
('Fri', '18:00:00', 1, 60, 'Strength Building', TRUE, 'Daily', '2025-10-01', NULL, 1),

-- Saturday Sessions
('Sat', '08:00:00', 1, 90, 'Weekend Bootcamp', TRUE, 'Custom', '2025-10-01', NULL, 1),
('Sat', '17:00:00', 1, 60, 'Dance Workout', TRUE, 'Custom', '2025-10-01', NULL, 1),

-- Sunday Sessions
('Sun', '09:00:00', 1, 60, 'Meditation & Relax', TRUE, 'Custom', '2025-10-01', NULL, 1),
('Sun', '17:30:00', 1, 75, 'Full Body Stretch', TRUE, 'Custom', '2025-10-01', NULL, 1);

```
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