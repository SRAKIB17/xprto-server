CREATE TABLE
    IF NOT EXISTS abuse_reports (
        id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
        reporter_user_id BIGINT UNSIGNED NOT NULL,
        reporter_role ENUM ('client', 'trainer', 'gym', 'admin') DEFAULT NULL,
        reported_user_id BIGINT UNSIGNED NOT NULL,
        reported_role ENUM ('client', 'trainer', 'gym', 'admin') NOT NULL,
        report_type VARCHAR(100) NOT NULL,
        details TEXT NOT NULL,
        evidence_url JSON NULL,
        status ENUM ('pending', 'reviewed', 'resolved', 'suspended') NOT NULL DEFAULT 'pending',
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        resolved_by BIGINT UNSIGNED NULL,
        resolved_role ENUM ('system', 'admin', 'gym', 'trainer') DEFAULT NULL,
        resolved_at DATETIME NULL,
        resolution_notes TEXT NULL,
        -- Remove if you want multiple reports per who_id+who
        -- UNIQUE (who_id, who),
        INDEX idx_reported_user (reported_user_id),
        INDEX idx_reporter_user (reporter_user_id),
        -- UNIQUE (reported_user_id, reporter_user_id, report_type),
        INDEX idx_status (status)
    ) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

```
INSERT INTO abuse_reports 
(reported_user_id, reporter_user_id, reported_role, report_type, details, evidence_url, status, created_at, resolved_by, resolved_role, resolved_at, resolution_notes)
VALUES
(1, 1, 'trainer', 'harassment', 'User reported harassment during training session.', JSON_ARRAY('https://cdn.example.com/evidence1.jpg'), 'resolved', NOW(), 99, 'admin', NOW(), 'Trainer suspended for 7 days'),

(3, 1, 'trainer', 'fraud', 'User claims trainer charged extra without consent.', JSON_ARRAY('https://cdn.example.com/evidence2.jpg'), 'resolved', NOW(), 101, 'system', NOW(), 'Auto-detected fraudulent activity.'),

(4, 1, 'trainer', 'spam', 'Trainer sending promotional spam messages repeatedly.', JSON_ARRAY('https://cdn.example.com/evidence3.png','https://cdn.example.com/evidence4.png'), 'pending', NOW(), NULL, NULL, NULL, NULL),

(5, 1, 'trainer', 'unsafe', 'Unsafe workout instructions given, user felt pain.', JSON_ARRAY('https://cdn.example.com/evidence5.jpg'), 'reviewed', NOW(), 102, 'gym', NOW(), 'Warned trainer, monitoring ongoing.'),

(6, 1, 'trainer', 'other', 'Trainer used inappropriate language.', JSON_ARRAY('https://cdn.example.com/evidence6.mp4'), 'pending', NOW(), NULL, NULL, NULL, NULL),

(7, 1, 'trainer', 'harassment', 'Unwanted personal comments made during session.', JSON_ARRAY('https://cdn.example.com/evidence7.jpg'), 'resolved', NOW(), 100, 'admin', NOW(), 'Trainer account under probation.'),

(8, 1, 'trainer', 'spam', 'Trainer repeatedly messaging outside training hours.', JSON_ARRAY('https://cdn.example.com/evidence8.png'), 'pending', NOW(), NULL, NULL, NULL, NULL),

(9, 1, 'trainer', 'unsafe', 'Trainer suggested excessive weights without warm-up.', JSON_ARRAY('https://cdn.example.com/evidence9.jpg'), 'resolved', NOW(), 105, 'trainer', NOW(), 'Acknowledged mistake, given safety training.'),

(10, 1, 'trainer', 'fraud', 'Payment collected directly bypassing platform.', JSON_ARRAY('https://cdn.example.com/evidence10.jpg'), 'reviewed', NOW(), 106, 'admin', NOW(), 'Refund issued to client, trainer fined.'),

(11, 1, 'trainer', 'other', 'Trainer was late multiple times, disrupting schedule.', JSON_ARRAY('https://cdn.example.com/evidence11.jpg'), 'pending', NOW(), NULL, NULL, NULL, NULL);

``` ```
INSERT INTO abuse_reports 
(reported_user_id, reporter_user_id, reported_role, report_type, details, evidence_url, status, created_at, resolved_by, resolved_role, resolved_at, resolution_notes)
VALUES
(1, 1, 'gym', 'harassment', 'Gym staff behaved rudely with client.', JSON_ARRAY('https://cdn.example.com/gym_evidence1.jpg'), 'resolved', NOW(), 99, 'admin', NOW(), 'Warning issued to gym management.'),

(1, 3, 'gym', 'fraud', 'Client claims gym charged hidden fees.', JSON_ARRAY('https://cdn.example.com/gym_evidence2.jpg'), 'reviewed', NOW(), 100, 'system', NOW(), 'Detected extra charges, refund processed.'),

(1, 4, 'gym', 'spam', 'Gym keeps sending unwanted promotional SMS.', JSON_ARRAY('https://cdn.example.com/gym_evidence3.png','https://cdn.example.com/gym_evidence4.png'), 'pending', NOW(), NULL, NULL, NULL, NULL),

(1, 5, 'gym', 'unsafe', 'Broken equipment caused safety concerns.', JSON_ARRAY('https://cdn.example.com/gym_evidence5.jpg'), 'resolved', NOW(), 101, 'admin', NOW(), 'Equipment replaced, issue fixed.'),

(1, 6, 'gym', 'other', 'Gym hygiene not maintained properly.', JSON_ARRAY('https://cdn.example.com/gym_evidence6.jpg'), 'pending', NOW(), NULL, NULL, NULL, NULL),

(1, 7, 'gym', 'harassment', 'Trainer at gym made inappropriate comments.', JSON_ARRAY('https://cdn.example.com/gym_evidence7.jpg'), 'reviewed', NOW(), 102, 'gym', NOW(), 'Internal disciplinary action taken.'),

(1, 8, 'gym', 'spam', 'Excessive marketing calls after signup.', JSON_ARRAY('https://cdn.example.com/gym_evidence8.png'), 'pending', NOW(), NULL, NULL, NULL, NULL),

(1, 9, 'gym', 'unsafe', 'Fire exit blocked during peak hours.', JSON_ARRAY('https://cdn.example.com/gym_evidence9.jpg'), 'resolved', NOW(), 103, 'admin', NOW(), 'Gym fined and instructed to comply with safety rules.'),

(1, 10, 'gym', 'fraud', 'Membership fee collected twice.', JSON_ARRAY('https://cdn.example.com/gym_evidence10.jpg'), 'reviewed', NOW(), 104, 'system', NOW(), 'Refund given, issue flagged for audit.'),

(1, 11, 'gym', 'other', 'Air conditioning not working for weeks.', JSON_ARRAY('https://cdn.example.com/gym_evidence11.jpg'), 'pending', NOW(), NULL, NULL, NULL, NULL);

```