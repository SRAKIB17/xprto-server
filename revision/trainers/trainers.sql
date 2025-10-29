CREATE TABLE
    trainers (
        trainer_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        login_type ENUM ('email', 'google', 'facebook') DEFAULT 'email',
        hashed VARCHAR(255) DEFAULT NULL,
        salt VARCHAR(255) DEFAULT NULL,
        gym_id BIGINT UNSIGNED DEFAULT NULL,
        xprto BOOLEAN DEFAULT TRUE,
        postal_code VARCHAR(20) DEFAULT NULL,
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
        phone VARCHAR(20) UNIQUE NOT NULL,
        gender ENUM ('male', 'female', 'other') DEFAULT 'other',
        dob DATE DEFAULT NULL,
        bio TEXT DEFAULT NULL,
        verified ENUM ("kyc", "assured") DEFAULT NULL,
        badge ENUM("L1","L2","L3","L4","L5") DEFAULT NULL,
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

CREATE TABLE trainer_red_flags (
    red_flag_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    trainer_id BIGINT UNSIGNED NOT NULL,
    type ENUM('kyc_issue', 'low_rating', 'complaint', 'temporary_block', 'suspended') NOT NULL,
    reason TEXT DEFAULT NULL,
    severity ENUM('low', 'medium', 'high') DEFAULT 'medium',
    status ENUM('active', 'resolved') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP NULL DEFAULT NULL,
    
    FOREIGN KEY (trainer_id) REFERENCES trainers(trainer_id) ON DELETE CASCADE,
    INDEX (trainer_id),
    INDEX (status),
    INDEX (severity)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


CREATE TABLE trainer_kyc_verification (
    kyc_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    trainer_id BIGINT UNSIGNED NOT NULL ,
    
    -- KYC Details
    fullname VARCHAR(100) DEFAULT NULL,
    dob DATE DEFAULT NULL,
    document_type ENUM('nid', 'passport', 'aadhaar', 'pan') DEFAULT NULL,
    document_number VARCHAR(100) DEFAULT NULL,
    document_file JSON DEFAULT NULL, -- multiple files (front/back/address proof)
    selfie VARCHAR(255) DEFAULT NULL,
    -- Verification Status
    status ENUM('not_submitted', 'in_review', 'verified', 'rejected', 'blocked') DEFAULT 'not_submitted',
    rejection_reason VARCHAR(255) NULL,
    

    -- Attempts & Payment
    attempts TINYINT UNSIGNED DEFAULT 0, -- কতবার চেষ্টা করেছে
    txn_id VARCHAR(50) DEFAULT NULL,
    paid_first_attempt BOOLEAN DEFAULT FALSE, -- প্রথমবার পেমেন্ট দিয়েছে কি না
        verified_for ENUM ("kyc", "assured") DEFAULT "kyc",

    -- Audit Fields
    verified_at TIMESTAMP NULL,
    UNIQUE(trainer_id, verified_for),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    -- Relations
    FOREIGN KEY (trainer_id) REFERENCES trainers(trainer_id) ON DELETE CASCADE
);

CREATE TABLE trainer_badge_verification (
    badge_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    trainer_id BIGINT UNSIGNED NOT NULL ,
    document_file JSON DEFAULT NULL, -- multiple files (front/back/address proof)
    status ENUM('not_submitted', 'in_review', 'verified', 'rejected') DEFAULT 'not_submitted',
    rejection_reason VARCHAR(255) NULL,
    apply_for ENUM("L1","L2","L3","L4","L5") DEFAULT "L1",
    verified_at TIMESTAMP NULL,
    UNIQUE(trainer_id, apply_for),
    expired_at TIMESTAMP DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (trainer_id) REFERENCES trainers(trainer_id) ON DELETE CASCADE
);


---- dummy


-- 4. Bookings table
CREATE TABLE bookings (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    slot_id BIGINT UNSIGNED NOT NULL,
    user_id BIGINT UNSIGNED NOT NULL,
    status ENUM('pending','confirmed','cancelled','completed') DEFAULT 'pending',
    payment_amount DECIMAL(10,2) DEFAULT 0.00,
    payment_currency VARCHAR(10) DEFAULT 'INR',
    payment_method VARCHAR(50),
    transaction_id VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (slot_id) REFERENCES slots(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 5. Optional: Slot Packages / Recurring Sessions (if you want to group slots into packages)
CREATE TABLE slot_packages (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    trainer_id BIGINT UNSIGNED NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    price DECIMAL(10,2) DEFAULT 0.00,
    duration VARCHAR(10) DEFAULT '60m',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (trainer_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 6. Optional: Linking slots to packages
CREATE TABLE package_slots (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    package_id BIGINT UNSIGNED NOT NULL,
    slot_id BIGINT UNSIGNED NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (package_id) REFERENCES slot_packages(id) ON DELETE CASCADE,
    FOREIGN KEY (slot_id) REFERENCES slots(id) ON DELETE CASCADE,
    UNIQUE KEY unique_package_slot (package_id, slot_id)
);

-- ========================================
-- INDEXES for performance
-- ========================================
CREATE INDEX idx_slots_trainer_date ON slots(trainer_id, date);
CREATE INDEX idx_bookings_slot ON bookings(slot_id);
CREATE INDEX idx_bookings_user ON bookings(user_id);

```
CREATE TABLE
    shifts (
        shift_id BIGINT AUTO_INCREMENT PRIMARY KEY,
        trainer_id BIGINT NOT NULL,
        title VARCHAR(50) NOT NULL, -- Morning, Evening, Night
        start_time DATETIME NOT NULL,
        end_time DATETIME NOT NULL,
        recurrence ENUM ('none', 'daily', 'weekly') DEFAULT 'none',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT fk_shift_trainer FOREIGN KEY (trainer_id) REFERENCES trainers (trainer_id)
    ) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

CREATE TABLE
    trainer_ratings (
        rating_id BIGINT AUTO_INCREMENT PRIMARY KEY,
        trainer_id BIGINT NOT NULL,
        client_id BIGINT NOT NULL,
        score INT CHECK (score BETWEEN 1 AND 5),
        feedback TEXT DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT fk_rating_trainer FOREIGN KEY (trainer_id) REFERENCES trainers (trainer_id),
        CONSTRAINT fk_rating_client FOREIGN KEY (client_id) REFERENCES clients (client_id)
    ) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

CREATE TABLE
    earnings (
        earning_id BIGINT AUTO_INCREMENT PRIMARY KEY,
        trainer_id BIGINT NOT NULL,
        type ENUM ('salary', 'commission', 'bonus') NOT NULL,
        amount DECIMAL(10, 2) NOT NULL,
        currency VARCHAR(10) DEFAULT 'USD',
        reference_id VARCHAR(50) DEFAULT NULL, -- booking id, sale id etc.
        status ENUM ('pending', 'paid') DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT fk_earning_trainer FOREIGN KEY (trainer_id) REFERENCES trainers (trainer_id)
    ) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

CREATE TABLE
    leaves (
        leave_id BIGINT AUTO_INCREMENT PRIMARY KEY,
        trainer_id BIGINT NOT NULL,
        start_date DATE NOT NULL,
        end_date DATE NOT NULL,
        type ENUM ('paid', 'unpaid', 'sick', 'casual') DEFAULT 'casual',
        reason TEXT DEFAULT NULL,
        status ENUM ('pending', 'approved', 'rejected') DEFAULT 'pending',
        admin_note TEXT DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT fk_leave_trainer FOREIGN KEY (trainer_id) REFERENCES trainers (trainer_id)
    ) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

CREATE TABLE
    trainer_documents (
        document_id BIGINT AUTO_INCREMENT PRIMARY KEY,
        trainer_id BIGINT NOT NULL,
        doc_type VARCHAR(100) NOT NULL, -- e.g. "Certification", "License"
        file_url VARCHAR(255) NOT NULL,
        expiry_date DATE DEFAULT NULL,
        status ENUM ('valid', 'expired', 'pending') DEFAULT 'pending',
        uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT fk_doc_trainer FOREIGN KEY (trainer_id) REFERENCES trainers (trainer_id)
    ) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;