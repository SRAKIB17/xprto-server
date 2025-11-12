CREATE TABLE
  IF NOT EXISTS workout_plans (
    plan_id BIGINT UNSIGNED NOT NULL PRIMARY KEY AUTO_INCREMENT,
    client_id BIGINT UNSIGNED DEFAULT NULL, -- references users.user_id
    session_id BIGINT UNSIGNED DEFAULT NULL,
    added_by BIGINT UNSIGNED DEFAULT NULL, -- references trainers.trainer_id
    title VARCHAR(255) DEFAULT NULL,
    start DATE NULL,
    end DATE NULL,
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

CREATE TABLE
  IF NOT EXISTS workout_exercises (
    exercise_id BIGINT UNSIGNED NOT NULL PRIMARY KEY AUTO_INCREMENT,
    plan_id BIGINT UNSIGNED NOT NULL, -- references workout_plans.plan_id
    name VARCHAR(255) NOT NULL, -- e.g., Squat, Bench Press
    sets JSON DEFAULT NULL COMMENT 'Array of sets with reps, rest, duration, weight',
    ```
      [
    { "set": 1, "reps": 12, "rest_time": "00:45", "duration": "01:20", "weight": 5, "weight_unit": "kg", "misc": "Keep back straight" },
    { "set": 2, "reps": 10, "rest_time": "01:00", "duration": "01:15", "weight": 6, "weight_unit": "kg", "misc": "Increase weight slightly" },
    { "set": 3, "reps": 8, "rest_time": "01:30", "duration": "01:10", "weight": 7, "weight_unit": "kg", "misc": "Last set, controlled tempo" }
  ],
    ``` attachment JSON NULL, -- optional: image/video links array of string
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (plan_id) REFERENCES workout_plans (plan_id) ON DELETE CASCADE ON UPDATE CASCADE,
    INDEX (plan_id),
    INDEX (name)
  ) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

```
INSERT INTO workout_plans 
(client_id, session_id, added_by, title, start, end, attachment, tags, client_note, trainer_note)
VALUES
(1, 1, 1, '8-Week Strength & Hypertrophy', '2025-11-10', '2026-01-05',
 JSON_ARRAY('tempo.pdf', 'demo.mp4'),
 JSON_ARRAY('Strength', 'Hypertrophy', 'Weight Training'),
 'I want to focus on muscle gain.',
 'Beginner program. Include progressive overload + rest intervals.'),

(1, 1, 1, 'Fat Loss & Core Stability', '2025-11-12', '2025-12-12',
 JSON_ARRAY('core_routine.pdf'),
 JSON_ARRAY('Cardio', 'Core', 'Freehand'),
 'Focus on fat reduction and core control.',
 'Add HIIT twice per week, track calories, avoid overtraining.'),

(1, 1, 1, 'Zumba & Dance Cardio Routine', '2025-11-15', '2025-12-15',
 JSON_ARRAY('zumba_demo.mp4'),
 JSON_ARRAY('Zumba', 'Dance', 'Cardio'),
 'I prefer energetic sessions with music.',
 'Include warmup + cooldown to prevent cramps.'),

(1, 1, 1, 'Powerlifting Foundation Plan', '2025-11-20', '2026-01-20',
 JSON_ARRAY('lift_guide.pdf'),
 JSON_ARRAY('Powerlifting', 'Strength'),
 'Learning compound lifts.',
 'Emphasize squat, bench, deadlift form and weekly load tracking.'),

(1, 1, 1, 'Home Freehand Beginner Program', '2025-11-05', '2025-12-05',
 JSON_ARRAY('bodyweight.pdf'),
 JSON_ARRAY('Freehand', 'Bodyweight'),
 'No gym access — want simple home workouts.',
 'Track form with video feedback. Add rest-pause training later.'),

(1, 1, 1, 'Functional Mobility & Flexibility', '2025-11-01', '2025-12-01',
 JSON_ARRAY('mobility_plan.pdf'),
 JSON_ARRAY('Mobility', 'Stretching', 'Yoga'),
 'Want better flexibility and posture.',
 'Add yoga stretches + mobility drills daily.'),

(1, 1, 1, 'Athlete Endurance Boost', '2025-11-10', '2026-01-10',
 JSON_ARRAY('endurance.pdf'),
 JSON_ARRAY('Endurance', 'Running', 'Conditioning'),
 'Preparing for upcoming 5K race.',
 'Focus on interval running, breathing technique, and recovery.'),

(1, 1, 1, 'Upper Body Strength Builder', '2025-11-08', '2025-12-08',
 JSON_ARRAY('upperbody_demo.mp4'),
 JSON_ARRAY('Chest', 'Arms', 'Shoulders'),
 'Want to tone upper body and improve posture.',
 'Include push–pull split with progressive overload every 2 weeks.'),

(1, 1, 1, 'Full Body Functional Training', '2025-11-14', '2025-12-28',
 JSON_ARRAY('fullbody_plan.pdf'),
 JSON_ARRAY('Functional', 'Strength', 'Balance'),
 'Need balanced routine for all muscles.',
 'Alternate between strength, balance, and endurance sessions.'),

(1, 1, 1, 'Mindful Yoga & Recovery Routine', '2025-11-18', '2025-12-18',
 JSON_ARRAY('yoga_demo.mp4'),
 JSON_ARRAY('Yoga', 'Mindfulness', 'Recovery'),
 'Need relaxation and mental focus.',
 'Include meditation + breathing sessions with stretching.');

```
-- !_-----------------------------------------------------