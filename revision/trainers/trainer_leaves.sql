CREATE TABLE
    trainer_leaves (
        leave_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        trainer_id BIGINT UNSIGNED NOT NULL,
        gym_id BIGINT UNSIGNED NULL,
        applied_by BIGINT UNSIGNED NULL, -- same as trainer_id or manager/admin in some cases
        -- Leave Info
        leave_type ENUM (
            'paid',
            'unpaid',
            'sick',
            'casual',
            'emergency',
            'maternity',
            'other'
        ) DEFAULT 'unpaid',
        reason TEXT DEFAULT NULL,
        attachment JSON DEFAULT NULL, -- e.g. medical certificate, supporting docs
        start_date DATE NOT NULL,
        end_date DATE NOT NULL,
        retroactive BOOLEAN DEFAULT FALSE,
        total_days DECIMAL(5, 2) GENERATED ALWAYS AS (DATEDIFF (end_date, start_date) + 1) STORED,
        -- Leave Status
        status ENUM (
            'pending',
            'approved',
            'rejected',
            'cancelled',
            'completed'
        ) DEFAULT 'pending',
        decision_by BIGINT UNSIGNED NULL, -- gym owner or admin
        decision_role ENUM ('gym', 'admin', 'system') DEFAULT NULL,
        decision_at TIMESTAMP NULL,
        decision_reason TEXT DEFAULT NULL,
        admin_comments TEXT DEFAULT NULL,
        -- Payroll Integration
        is_paid BOOLEAN DEFAULT FALSE,
        deducted_days DECIMAL(5, 2) DEFAULT 0.00,
        linked_payroll_id BIGINT UNSIGNED NULL, -- connect to payroll table if needed
        salary_adjustment DECIMAL(12, 2) DEFAULT 0.00, -- auto calculated if unpaid
        -- Additional metadata
        replacement_trainer_id BIGINT UNSIGNED NULL, -- optional if substitute trainer assigned
        notify_trainer BOOLEAN DEFAULT TRUE,
        notify_manager BOOLEAN DEFAULT TRUE,
        extra JSON DEFAULT NULL, -- e.g. {"half_day": true, "shift": "morning"}
        -- Audit
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        -- Foreign Keys
        FOREIGN KEY (trainer_id) REFERENCES trainers (trainer_id) ON DELETE CASCADE,
        FOREIGN KEY (gym_id) REFERENCES gyms (gym_id) ON DELETE SET NULL,
        FOREIGN KEY (replacement_trainer_id) REFERENCES trainers (trainer_id) ON DELETE SET NULL,
        INDEX (trainer_id),
        INDEX (gym_id),
        INDEX (status),
        INDEX (leave_type),
        INDEX (start_date),
        INDEX (end_date)
    ) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_general_ci;

CREATE TABLE
    trainer_leave_balance (
        id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        trainer_id BIGINT UNSIGNED NOT NULL,
        gym_id BIGINT UNSIGNED NULL,
        year YEAR NOT NULL,
        paid_leave_total DECIMAL(5, 2) DEFAULT 12.00, -- total annual allowance
        paid_leave_used DECIMAL(5, 2) DEFAULT 0.00,
        unpaid_leave_used DECIMAL(5, 2) DEFAULT 0.00,
        carry_forward DECIMAL(5, 2) DEFAULT 0.00,
        remarks TEXT DEFAULT NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (trainer_id) REFERENCES trainers (trainer_id) ON DELETE CASCADE,
        FOREIGN KEY (gym_id) REFERENCES gyms (gym_id) ON DELETE SET NULL,
        UNIQUE (trainer_id, year)
    ) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_general_ci;

```
INSERT INTO trainer_leaves (
    trainer_id, gym_id, leave_type, reason, start_date, end_date, attachment
)
VALUES
(1, 1, 'sick', 'Fever and rest recommended by doctor', '2025-10-22', '2025-10-24', JSON_ARRAY('medical_certificate.pdf')),

    ```