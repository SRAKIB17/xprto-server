-- USER / TRAINER assumed existing tables:
-- users(user_id PK), trainers(trainer_id PK), services(service_id PK)
-- adjust FK targets if your structure different.
CREATE TABLE
    IF NOT EXISTS booking_requests (
        booking_id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
        booking_code VARCHAR(40) NOT NULL UNIQUE, -- like BK-20251030-XXXX
        client_id BIGINT UNSIGNED NOT NULL, -- references users.user_id
        trainer_id BIGINT UNSIGNED NOT NULL, -- references trainers.trainer_id
        service_id BIGINT UNSIGNED NULL, -- referenced service (optional)
        price DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
        currency CHAR(3) NOT NULL DEFAULT 'INR',
        discount_percent DECIMAL(5, 2) NOT NULL DEFAULT 0.00, -- percent value, e.g. 10.00
        final_price DECIMAL(10, 2) AS (price - (price * discount_percent / 100)) STORED,
        per_unit ENUM ('session', 'hour', 'day', 'week', 'month') DEFAULT 'session',
        -- requested times (what client asked for)
        requested_start DATETIME NULL,
        requested_end DATETIME NULL,
        -- scheduled times (what trainer accepted / admin scheduled)
        scheduled_start DATETIME NULL,
        scheduled_end DATETIME NULL,
        time_from TIME NOT NULL, -- FIXED: was DATE
        duration_minutes INT UNSIGNED DEFAULT 60,
        -- meeting / delivery details
        delivery_mode ENUM ('online', 'doorstep', 'hybrid') NOT NULL DEFAULT 'online',
        location TEXT NULL, -- user provided address (if applicable)
        meet_link VARCHAR(1000) NULL, -- zoom/meet link or similar
        -- notes
        client_note TEXT NULL, -- note from client while requesting
        trainer_note TEXT NULL, -- trainer can add private/public notes
        admin_note TEXT NULL, -- optional admin note
        -- status & flow
        status ENUM (
            'pending',
            'accepted',
            'confirmed',
            'rejected',
            'cancelled',
            'rescheduled',
            'completed'
        ) NOT NULL DEFAULT 'pending',
        status_reason VARCHAR(255) NULL, -- short reason/reject note
        cancelled_by ENUM ('client', 'trainer', 'admin') NULL,
        -- payment
        payment_status ENUM (
            'unpaid',
            'initiated',
            'paid',
            'refunded',
            'failed'
        ) DEFAULT 'unpaid',
        payment_txn_id VARCHAR(100) NULL,
        idempotency_key VARCHAR(191) DEFAULT NULL, -- ensure idempotent ops,
        wallet_used BOOLEAN DEFAULT TRUE,
        -- meta
        created_by BIGINT UNSIGNED NULL,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        responded_at DATETIME NULL, -- when trainer accepted/rejected
        responded_by BIGINT UNSIGNED NULL, -- trainer/admin id who responded
        PRIMARY KEY (booking_id),
        INDEX (trainer_id, status, created_at),
        INDEX (client_id, created_at),
        INDEX (service_id),
        INDEX (booking_code),
        FOREIGN KEY (client_id) REFERENCES clients (client_id) ON DELETE CASCADE ON UPDATE CASCADE,
        FOREIGN KEY (trainer_id) REFERENCES trainers (trainer_id) ON DELETE CASCADE ON UPDATE CASCADE
    ) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;