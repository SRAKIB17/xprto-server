-- টেবিল: gym_owners
-- উদ্দেশ্য: জিম মালিকদের সম্পূর্ণ তথ্য, অ্যাকাউন্ট, সাবস্ক্রিপশন, পেমেন্ট, এবং অডিট ট্র্যাকিং
CREATE TABLE
    gyms (
        gym_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        fullname VARCHAR(100) NOT NULL,
        email VARCHAR(100) NOT NULL UNIQUE,
        phone VARCHAR(20) NOT NULL UNIQUE,
        gender ENUM ('male', 'female', 'other') DEFAULT NULL,
        dob DATE DEFAULT NULL,
        gym_name VARCHAR(150) NOT NULL,
        address TEXT DEFAULT NULL,
        gym_type VARCHAR(100) DEFAULT NULL,
        postal_code VARCHAR(20) DEFAULT NULL,
        country VARCHAR(50) DEFAULT NULL,
        district VARCHAR(50) DEFAULT NULL,
        lat INT DEFAULT NULL,
        lng INT DEFAULT NULL,
        state VARCHAR(50) DEFAULT NULL,
        total_clients INT DEFAULT 0,
        plan_features JSON DEFAULT NULL,
        status ENUM (
            'active',
            'inactive',
            'paused',
            'suspended',
            'banned'
        ) DEFAULT 'active',
        verification_status ENUM (
            'non_verified',
            'verified',
            'fully_verified',
            'suspicious'
        ) NOT NULL DEFAULT 'non_verified',
        subscription_plan ENUM ('basic', 'premium', 'enterprise', 'custom') DEFAULT 'basic',
        subscription_start DATE DEFAULT NULL,
        subscription_end DATE DEFAULT NULL,
        auto_renew BOOLEAN DEFAULT FALSE,
        payment_method ENUM (
            'cash',
            'card',
            'bank_transfer',
            'upi',
            'wallet',
            'cheque'
        ) DEFAULT NULL,
        last_payment_date DATE DEFAULT NULL,
        next_payment_due DATE DEFAULT NULL,
        payment_status ENUM (
            'paid',
            'unpaid',
            'partial',
            'overdue',
            'refunded'
        ) DEFAULT 'unpaid',
        hashed VARCHAR(255) DEFAULT NULL,
        salt VARCHAR(255) DEFAULT NULL,
        two_factor_enabled BOOLEAN DEFAULT FALSE,
        last_login TIMESTAMP NULL DEFAULT NULL,
        failed_login_attempts INT DEFAULT 0,
        avatar VARCHAR(255) DEFAULT NULL,
        logo_url VARCHAR(255) DEFAULT NULL,
        invoice_prefix VARCHAR(20) DEFAULT 'GYM',
        notes TEXT DEFAULT NULL,
        registered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        last_visit TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        CONSTRAINT chk_mobile_length_gyms CHECK (CHAR_LENGTH(mobile_number) BETWEEN 7 AND 20),
        CONSTRAINT chk_email_format_gyms CHECK (email LIKE '%_@_%._%'),
        CONSTRAINT chk_subscription_dates_gyms CHECK (subscription_end >= subscription_start)
    ) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- পারফরম্যান্স ইনডেক্স
CREATE INDEX idx_gym_owners_status ON gym_owners (status);

CREATE INDEX idx_gym_owners_subscription_end ON gym_owners (subscription_end);

CREATE INDEX idx_gym_owners_city ON gym_owners (city);

CREATE INDEX idx_gym_owners_plan ON gym_owners (subscription_plan);

CREATE TABLE
    IF NOT EXISTS gyms (
        id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
        owner_id BIGINT UNSIGNED NOT NULL,
        name VARCHAR(150) NOT NULL,
        legal_name VARCHAR(200) NULL,
        email VARCHAR(150) NULL,
        phone VARCHAR(30) NULL,
        website VARCHAR(200) NULL,
        description TEXT NULL,
        logo_url VARCHAR(255) NULL,
        verification_status ENUM (
            'non_verified',
            'verified',
            'fully_verified',
            'suspicious'
        ) NOT NULL DEFAULT 'non_verified',
        rating DECIMAL(3, 2) NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        CONSTRAINT fk_gyms_owner FOREIGN KEY (owner_id) REFERENCES users (id)
    ) ENGINE = InnoDB;

-- উদাহরণ ডেটা ইনসার্ট
INSERT INTO
    gym_owners (
        fullname,
        email,
        mobile_number,
        gender,
        dob,
        gym_name,
        address,
        city,
        state,
        subscription_plan,
        subscription_start,
        subscription_end,
        auto_renew,
        payment_method,
        last_payment_date,
        next_payment_due,
        status,
        notes
    )
VALUES
    (
        'Rakibul Islam',
        'owner@fitlife.com',
        '+8801712345678',
        'male',
        '1990-05-15',
        'FitLife Gym',
        'Dhanmondi, Dhaka',
        'Dhaka',
        'Dhaka',
        'premium',
        '2025-01-01',
        '2025-12-31',
        TRUE,
        'upi',
        '2025-07-01',
        '2025-08-01',
        'active',
        'Includes VIP locker & personal trainer'
    );

-- উদাহরণ কুয়েরি
-- 1) সক্রিয় জিম মালিকদের তালিকা
SELECT
    *
FROM
    gym_owners
WHERE
    status = 'active'
ORDER BY
    subscription_end ASC;

-- 2) সাবস্ক্রিপশন এক্সপায়ারড মালিক
SELECT
    *
FROM
    gym_owners
WHERE
    subscription_end < CURDATE ()
    AND status = 'active';

-- 3) শহর অনুযায়ী জিম মালিকের তালিকা
SELECT
    *
FROM
    gym_owners
WHERE
    city = 'Dhaka'
ORDER BY
    fullname ASC;

-- 4) 2FA সক্রিয় মালিকদের তালিকা
SELECT
    fullname,
    email,
    gym_name
FROM
    gym_owners
WHERE
    two_factor_enabled = TRUE;