CREATE TABLE
    support_tickets (
        ticket_id BIGINT AUTO_INCREMENT PRIMARY KEY,
        subject VARCHAR(255) NOT NULL,
        category ENUM ('billing', 'technical', 'trainer', 'other') NOT NULL,
        priority ENUM ('low', 'medium', 'high') DEFAULT 'medium',
        status ENUM ('open', 'pending', 'resolved', 'closed') DEFAULT 'open',
        -- Optional references
        trainer_id BIGINT DEFAULT NULL,
        client_id BIGINT DEFAULT NULL,
        gym_id BIGINT DEFAULT NULL,
        admin_id BIGINT DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        -- Foreign key constraints
        FOREIGN KEY (trainer_id) REFERENCES trainers (trainer_id) ON DELETE SET NULL,
        FOREIGN KEY (admin_id) REFERENCES admin_details (admin_id) ON DELETE SET NULL,
        FOREIGN KEY (client_id) REFERENCES clients (client_id) ON DELETE SET NULL,
        FOREIGN KEY (gym_id) REFERENCES gyms (gym_id) ON DELETE SET NULL
    ) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4;

CREATE TABLE
    support_messages (
        message_id BIGINT AUTO_INCREMENT PRIMARY KEY,
        ticket_id BIGINT NOT NULL,
        sender_id BIGINT NOT NULL,
        message TEXT NOT NULL,
        attachment_url VARCHAR(255) DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (ticket_id) REFERENCES support_tickets (ticket_id) ON DELETE CASCADE
    );