CREATE TABLE
    trainers (
        trainer_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        login_type ENUM ('email', 'google', 'facebook') DEFAULT 'email',
        hashed VARCHAR(255) DEFAULT NULL,
        salt VARCHAR(255) DEFAULT NULL,
        gym_id BIGINT UNSIGNED DEFAULT NULL,
        xprto BOOLEAN DEFAULT TRUE,
        postal_code VARCHAR(20) DEFAULT NULL,
        is_online BOOLEAN DEFAULT TRUE,
        country VARCHAR(50) DEFAULT NULL,
        state VARCHAR(50) DEFAULT NULL,
        district VARCHAR(50) DEFAULT NULL,
        address TEXT DEFAULT NULL,
        lat INT DEFAULT NULL,
        lng INT DEFAULT NULL,
        email_verified BOOLEAN DEFAULT FALSE,
        fullname VARCHAR(100) NOT NULL,
        age INT DEFAULT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        phone VARCHAR(20) UNIQUE DEFAULT NULL,
        gender ENUM ('male', 'female', 'other') DEFAULT 'other',
        dob DATE DEFAULT NULL,
        bio TEXT DEFAULT NULL,
        verified ENUM ("kyc", "assured") DEFAULT NULL,
        badge ENUM ("L1", "L2", "L3", "L4", "L5") DEFAULT NULL,
        specialization JSON DEFAULT NULL, -- e.g. "Strength, Yoga, Rehab"
        certification JSON DEFAULT NULL, -- comma-separated or JSON list
        avatar VARCHAR(255) DEFAULT NULL,
        cover VARCHAR(255) DEFAULT NULL,
        -- coverage_km DECIMAL(5,2) NOT NULL DEFAULT 5.00,
        experience_years INT DEFAULT 0,
        hire_date DATE DEFAULT NULL,
        status ENUM (
            'active',
            'inactive',
            'temporary-block',
            'suspended'
        ) DEFAULT 'active',
        registered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        last_visit TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        CONSTRAINT chk_mobile_length CHECK (CHAR_LENGTH(phone) BETWEEN 7 AND 20),
        CONSTRAINT chk_email_format CHECK (email LIKE '%_@_%._%'),
        FOREIGN KEY (gym_id) REFERENCES gyms (gym_id) ON DELETE SET NULL
    ) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

CREATE TABLE
    trainer_red_flags (
        red_flag_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        trainer_id BIGINT UNSIGNED NOT NULL,
        type ENUM (
            'kyc_issue',
            'low_rating',
            'complaint',
            'temporary_block',
            'suspended'
        ) NOT NULL,
        reason TEXT DEFAULT NULL,
        severity ENUM ('low', 'medium', 'high') DEFAULT 'medium',
        status ENUM ('active', 'resolved') DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        resolved_at TIMESTAMP NULL DEFAULT NULL,
        FOREIGN KEY (trainer_id) REFERENCES trainers (trainer_id) ON DELETE CASCADE,
        INDEX (trainer_id),
        INDEX (status),
        INDEX (severity)
    ) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

CREATE TABLE
    trainer_kyc_verification (
        kyc_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        trainer_id BIGINT UNSIGNED NOT NULL,
        -- KYC Details
        fullname VARCHAR(100) DEFAULT NULL,
        dob DATE DEFAULT NULL,
        document_type ENUM ('nid', 'passport', 'aadhaar', 'pan') DEFAULT NULL,
        document_number VARCHAR(100) DEFAULT NULL,
        document_file JSON DEFAULT NULL, -- multiple files (front/back/address proof)
        selfie VARCHAR(255) DEFAULT NULL,
        -- Verification Status
        status ENUM (
            'not_submitted',
            'in_review',
            'verified',
            'rejected',
            'blocked'
        ) DEFAULT 'not_submitted',
        rejection_reason VARCHAR(255) NULL,
        -- Attempts & Payment
        attempts TINYINT UNSIGNED DEFAULT 0, -- কতবার চেষ্টা করেছে
        txn_id VARCHAR(50) DEFAULT NULL,
        paid_first_attempt BOOLEAN DEFAULT FALSE, -- প্রথমবার পেমেন্ট দিয়েছে কি না
        verified_for ENUM ("kyc", "assured") DEFAULT "kyc",
        -- Audit Fields
        verified_at TIMESTAMP NULL,
        UNIQUE (trainer_id, verified_for),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        -- Relations
        FOREIGN KEY (trainer_id) REFERENCES trainers (trainer_id) ON DELETE CASCADE
    );

CREATE TABLE
    trainer_badge_verification (
        badge_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        trainer_id BIGINT UNSIGNED NOT NULL,
        document_file JSON DEFAULT NULL, -- multiple files (front/back/address proof)
        status ENUM (
            'not_submitted',
            'in_review',
            'verified',
            'rejected'
        ) DEFAULT 'not_submitted',
        rejection_reason VARCHAR(255) NULL,
        apply_for ENUM ("L1", "L2", "L3", "L4", "L5") DEFAULT "L1",
        verified_at TIMESTAMP NULL,
        UNIQUE (trainer_id, apply_for),
        expired_at TIMESTAMP DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (trainer_id) REFERENCES trainers (trainer_id) ON DELETE CASCADE
    );

---- dummy