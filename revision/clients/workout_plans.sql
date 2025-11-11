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
        INDEX(title),
        INDEX (client_id, created_at),
        FOREIGN KEY (client_id) REFERENCES clients (client_id) ON DELETE CASCADE ON UPDATE CASCADE,
        FOREIGN KEY (session_id) REFERENCES gym_sessions (session_id) ON DELETE CASCADE ON UPDATE CASCADE,
        FOREIGN KEY (added_by) REFERENCES trainers (trainer_id) ON DELETE CASCADE ON UPDATE CASCADE
    ) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

--- !_-----------------------------------------------------
CREATE TABLE workout_plan_tags (
  workout_plan_id BIGINT NOT NULL,
  tag_id SMALLINT NOT NULL,
  PRIMARY KEY (workout_plan_id, tag_id),
  FOREIGN KEY (workout_plan_id) REFERENCES workout_plans(id) ON DELETE CASCADE,
  FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE RESTRICT
) ENGINE=InnoDB;

-- Assignments: assign plan to clients or to a class
CREATE TABLE workout_plan_assignments (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  workout_plan_id BIGINT NOT NULL,
  assignee_type ENUM('user','class') NOT NULL,
  assignee_id BIGINT NOT NULL, -- user.id or classes.id depending on assignee_type
  assigned_by BIGINT, -- who assigned it (trainer)
  assigned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  status ENUM('active','completed','cancelled') DEFAULT 'active',
  start_date DATE DEFAULT NULL,
  end_date DATE DEFAULT NULL,
  FOREIGN KEY (workout_plan_id) REFERENCES workout_plans(id) ON DELETE CASCADE,
  FOREIGN KEY (assigned_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- Trainer notes & attachments (files or inline notes)
CREATE TABLE trainer_notes (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  workout_plan_id BIGINT NOT NULL,
  trainer_id BIGINT NOT NULL,
  note TEXT,
  file_name VARCHAR(255),
  file_url VARCHAR(1024),
  file_mime VARCHAR(100),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (workout_plan_id) REFERENCES workout_plans(id) ON DELETE CASCADE,
  FOREIGN KEY (trainer_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- Media attachments (videos/images)
CREATE TABLE workout_media (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  workout_plan_id BIGINT NOT NULL,
  media_type ENUM('video','image','pdf','other') NOT NULL,
  file_name VARCHAR(255),
  file_url VARCHAR(1024),
  mime VARCHAR(100),
  duration_seconds INT NULL, -- for videos
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  uploaded_by BIGINT,
  FOREIGN KEY (workout_plan_id) REFERENCES workout_plans(id) ON DELETE CASCADE,
  FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- Audit: publish history
CREATE TABLE workout_plan_history (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  workout_plan_id BIGINT NOT NULL,
  event_type ENUM('created','updated','published','unpublished','assigned','unassigned','deleted') NOT NULL,
  actor_id BIGINT,
  data JSON,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (workout_plan_id) REFERENCES workout_plans(id) ON DELETE CASCADE,
  FOREIGN KEY (actor_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- Indexes to help searches
CREATE INDEX idx_workout_title ON workout_plans(title(120));
CREATE INDEX idx_workout_visibility ON workout_plans(visibility);
CREATE INDEX idx_assignments_assignee ON workout_plan_assignments(assignee_type, assignee_id);

-- Pre-populate some common tags
INSERT IGNORE INTO tags (name) VALUES ('Zumba'),('Cardio'),('Weight Training'),('Freehand'),('HIIT'),('Mobility');

-- ------------------------------------------------------------
-- Sample INSERT: create a workout plan (transactional)
-- ------------------------------------------------------------
START TRANSACTION;

-- assume trainer id = 2 exists
INSERT INTO workout_plans (trainer_id, title, description, sessions_per_week, start_date, duration_weeks, recurrence, schedule, visibility)
VALUES
(2,
 '8-week Strength & Hypertrophy',
 '8-week progressive strength + hypertrophy program with 4 sessions per week.',
 4,
 '2025-11-17',
 8,
 JSON_OBJECT('type','weekly','interval',1,'days', JSON_ARRAY(1,3,5,7)), -- 1=Mon etc (your convention)
 JSON_ARRAY(
   JSON_OBJECT('day','Monday','time','18:00','session_title','Upper Body Strength'),
   JSON_OBJECT('day','Wednesday','time','18:00','session_title','Lower Body Strength'),
   JSON_OBJECT('day','Friday','time','18:00','session_title','Hypertrophy Push'),
   JSON_OBJECT('day','Sunday','time','10:00','session_title','Full Body Conditioning')
 ),
 'draft'
);

SET @plan_id = LAST_INSERT_ID();

-- attach tags (e.g., Weight Training, Cardio)
INSERT INTO workout_plan_tags (workout_plan_id, tag_id)
SELECT @plan_id, id FROM tags WHERE name IN ('Weight Training','Cardio');

-- attach a trainer note PDF
INSERT INTO trainer_notes (workout_plan_id, trainer_id, note, file_name, file_url, file_mime)
VALUES (@plan_id, 2, 'Tempo guidelines and rep ranges. See attached PDF.', 'tempo.pdf','/uploads/tempo.pdf','application/pdf');

-- attach a demo video
INSERT INTO workout_media (workout_plan_id, media_type, file_name, file_url, mime, duration_seconds, uploaded_by)
VALUES (@plan_id, 'video', 'demo_upper.mp4','/uploads/demo_upper.mp4','video/mp4', 120, 2);

-- record history
INSERT INTO workout_plan_history (workout_plan_id, event_type, actor_id, data)
VALUES (@plan_id, 'created', 2, JSON_OBJECT('initial_visibility','draft','sessions_per_week',4));

COMMIT;

-- ------------------------------------------------------------
-- Sample UPDATE: edit plan and publish (transactional)
-- ------------------------------------------------------------
START TRANSACTION;

-- Update basic fields
UPDATE workout_plans
SET title = '8-week Strength & Hypertrophy (Updated)',
    description = CONCAT(description, '\n\nUpdated: Added mobility work.'),
    sessions_per_week = 4,
    visibility = 'published',
    updated_at = CURRENT_TIMESTAMP
WHERE id = @plan_id;

-- Replace tags (example: remove Cardio, add Mobility)
DELETE FROM workout_plan_tags WHERE workout_plan_id = @plan_id;
INSERT INTO workout_plan_tags (workout_plan_id, tag_id)
SELECT @plan_id, id FROM tags WHERE name IN ('Weight Training','Mobility');

-- record publish history
INSERT INTO workout_plan_history (workout_plan_id, event_type, actor_id, data)
VALUES (@plan_id, 'published', 2, JSON_OBJECT('published_at', NOW()));

COMMIT;

-- ------------------------------------------------------------
-- Assign plan to users (clients) or classes
-- ------------------------------------------------------------
-- assign to a client (user id 10)
INSERT INTO workout_plan_assignments (workout_plan_id, assignee_type, assignee_id, assigned_by, start_date, end_date)
VALUES (@plan_id, 'user', 10, 2, '2025-11-17', DATE_ADD('2025-11-17', INTERVAL 8 WEEK));

-- assign to a class (class id 3)
INSERT INTO workout_plan_assignments (workout_plan_id, assignee_type, assignee_id, assigned_by, start_date, end_date)
VALUES (@plan_id, 'class', 3, 2, '2025-11-17', DATE_ADD('2025-11-17', INTERVAL 8 WEEK));

-- ------------------------------------------------------------
-- Helpful SELECT queries
-- ------------------------------------------------------------

-- Get a plan with tags, media, notes and assignments
SELECT
  p.*,
  (SELECT JSON_ARRAYAGG(JSON_OBJECT('id',t.id,'name',t.name)) FROM tags t
     JOIN workout_plan_tags pt ON pt.tag_id = t.id WHERE pt.workout_plan_id = p.id) AS tags,
  (SELECT JSON_ARRAYAGG(JSON_OBJECT('id',m.id,'type',m.media_type,'url',m.file_url,'name',m.file_name)) FROM workout_media m WHERE m.workout_plan_id = p.id) AS media,
  (SELECT JSON_ARRAYAGG(JSON_OBJECT('id',n.id,'note',n.note,'file',n.file_url,'created_at',n.created_at)) FROM trainer_notes n WHERE n.workout_plan_id = p.id) AS notes
FROM workout_plans p
WHERE p.id = @plan_id AND p.is_deleted = 0;

-- List published plans with a given tag (e.g., Zumba)
SELECT p.*
FROM workout_plans p
JOIN workout_plan_tags pt ON pt.workout_plan_id = p.id
JOIN tags t ON t.id = pt.tag_id
WHERE t.name = 'Zumba' AND p.visibility = 'published' AND p.is_deleted = 0;

-- Active assignments for a user (plans currently active)
SELECT a.*, p.title, p.start_date, p.duration_weeks
FROM workout_plan_assignments a
JOIN workout_plans p ON p.id = a.workout_plan_id
WHERE a.assignee_type='user' AND a.assignee_id = 10
  AND a.status='active' AND p.is_deleted = 0
  AND (a.start_date IS NULL OR a.start_date <= CURDATE())
  AND (a.end_date IS NULL OR a.end_date >= CURDATE());

-- Quick search by title / fulltext (requires fulltext index if desired)
ALTER TABLE workout_plans ADD FULLTEXT idx_ft_title_description (title, description);
SELECT * FROM workout_plans WHERE MATCH(title,description) AGAINST('strength hypertrophy' IN NATURAL LANGUAGE MODE) LIMIT 20;

-- ------------------------------------------------------------
-- Example: Soft-delete a plan (and record history)
-- ------------------------------------------------------------
UPDATE workout_plans SET is_deleted = 1, visibility='draft', updated_at = CURRENT_TIMESTAMP WHERE id = @plan_id;
INSERT INTO workout_plan_history (workout_plan_id, event_type, actor_id, data) VALUES (@plan_id, 'deleted', 2, NULL);

-- ------------------------------------------------------------
-- Utilities: A simple stored procedure to publish a plan (validates fields)
-- ------------------------------------------------------------
DELIMITER $$
CREATE PROCEDURE publish_workout_plan(IN in_plan_id BIGINT, IN actor_id BIGINT)
BEGIN
  DECLARE v_exists INT;
  SELECT COUNT(*) INTO v_exists FROM workout_plans WHERE id = in_plan_id AND is_deleted = 0;
  IF v_exists = 0 THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Plan not found or deleted';
  END IF;

  -- Basic validation example: ensure start_date and sessions_per_week exist
  IF (SELECT start_date FROM workout_plans WHERE id = in_plan_id) IS NULL THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Start date is required to publish';
  END IF;

  UPDATE workout_plans
    SET visibility = 'published', updated_at = CURRENT_TIMESTAMP
    WHERE id = in_plan_id;

  INSERT INTO workout_plan_history (workout_plan_id, event_type, actor_id, data)
  VALUES (in_plan_id, 'published', actor_id, JSON_OBJECT('published_at', NOW()));
END$$
DELIMITER ;

-- Usage:
-- CALL publish_workout_plan(123, 2);

