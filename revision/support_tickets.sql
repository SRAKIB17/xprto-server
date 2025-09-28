CREATE TABLE
    support_tickets (
        ticket_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        subject VARCHAR(255) NOT NULL,
        category ENUM ('billing', 'technical', 'trainer', 'other') NOT NULL,
        priority ENUM ('low', 'medium', 'high') DEFAULT 'medium',
        created_by ENUM ('system', 'admin', 'gym', 'trainer', 'client') DEFAULT "client",
        status ENUM ('open', 'pending', 'resolved', 'closed') DEFAULT 'pending',
        -- Optional references
        trainer_id BIGINT UNSIGNED DEFAULT NULL,
        client_id BIGINT UNSIGNED DEFAULT NULL,
        gym_id BIGINT UNSIGNED DEFAULT NULL,
        admin_id BIGINT UNSIGNED DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        -- Foreign key constraints
        FOREIGN KEY (trainer_id) REFERENCES trainers (trainer_id) ON DELETE SET NULL,
        FOREIGN KEY (admin_id) REFERENCES admin_details (admin_id) ON DELETE SET NULL,
        FOREIGN KEY (client_id) REFERENCES clients (client_id) ON DELETE SET NULL,
        FOREIGN KEY (gym_id) REFERENCES gyms (gym_id) ON DELETE SET NULL
    ) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

CREATE TABLE
    support_messages (
        message_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        ticket_id BIGINT UNSIGNED NOT NULL,
        sender_id BIGINT UNSIGNED NOT NULL,
        sender_role ENUM ('system', 'admin', 'gym', 'trainer', 'client') DEFAULT "client",
        message TEXT NOT NULL,
        attachments JSON DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (ticket_id) REFERENCES support_tickets (ticket_id) ON DELETE CASCADE
    );

```
    -- Insert 10 support tickets
INSERT INTO support_tickets (subject, category, priority, status, trainer_id, client_id, gym_id, admin_id)
VALUES
('Billing issue with last session', 'billing', 'high', 'open', 1, 1, NULL, NULL),
('Unable to access trainer dashboard', 'technical', 'medium', 'pending', 1, 1, NULL, NULL),
('Trainer missed scheduled session', 'trainer', 'medium', 'open', 1, 1, NULL, NULL),
('Payment discrepancy for package', 'billing', 'high', 'open', 1, 1, NULL, NULL),
('Technical glitch during video call', 'technical', 'high', 'pending', 1, 1, NULL, NULL),
('Request to change session timing', 'trainer', 'low', 'open', 1, 1, NULL, NULL),
('Feedback on trainer behavior', 'trainer', 'medium', 'resolved', 1, 1, NULL, NULL),
('Gym facility access issue', 'other', 'medium', 'open', 1, 1, NULL, NULL),
('Refund request for cancelled session', 'billing', 'high', 'pending', 1, 1, NULL, NULL),
('App crashes while booking session', 'technical', 'high', 'open', 1, 1, NULL, NULL);

-- Insert corresponding messages for each ticket (1-3 messages per ticket randomly)
INSERT INTO support_messages (ticket_id, sender_id, message, attachments)
VALUES
(1, 1, 'I was charged twice for my last session. Please check.', JSON_ARRAY('invoice_1.png')),
(1, 101, 'We are reviewing your billing issue. Please wait.', NULL),
(2, 1, 'Cannot login to trainer dashboard since yesterday.', NULL),
(2, 101, 'Our tech team is investigating this issue.', NULL),
(3, 1, 'Trainer did not show up for my session today.', JSON_ARRAY('session_screenshot.jpg')),
(3, 201, 'We apologize. The trainer will contact you shortly.', NULL),
(4, 1, 'Package payment is not reflecting in my account.', NULL),
(4, 101, 'We will update you once resolved.', NULL),
(5, 1, 'Video call froze multiple times during session.', JSON_ARRAY('screenshot1.png','screenshot2.png')),
(5, 101, 'Technical team notified.', NULL),
(6, 1, 'Requesting to change my session timing.', NULL),
(6, 201, 'Trainer has confirmed the new timing.', NULL),
(7, 1, 'Wanted to give feedback on trainer behavior.', NULL),
(7, 101, 'Thank you for the feedback. We will take note.', NULL),
(8, 1, 'Cannot access gym facility after 6 PM.', NULL),
(8, 201, 'Issue logged with gym management.', NULL),
(9, 1, 'Requesting refund for cancelled session.', NULL),
(9, 101, 'Refund process started. Please allow 3-5 days.', NULL),
(10, 1, 'App crashes while trying to book a session.', NULL),
(10, 101, 'Bug reported. Fix will be deployed soon.', NULL);

    ```