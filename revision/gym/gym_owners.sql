-- টেবিল: gym_owners
-- উদ্দেশ্য: জিম মালিকদের সম্পূর্ণ তথ্য, অ্যাকাউন্ট, সাবস্ক্রিপশন, পেমেন্ট, এবং অডিট ট্র্যাকিং
CREATE TABLE
    gyms (
        gym_id BIGINT AUTO_INCREMENT PRIMARY KEY, -- ইউনিক জিম মালিক আইডি
        -- ব্যক্তিগত তথ্য
        fullname VARCHAR(100) NOT NULL, -- জিম মালিকের পূর্ণ নাম
        email VARCHAR(100) NOT NULL UNIQUE, -- ইমেইল (লগইন ও নোটিফিকেশনের জন্য)
        mobile_number VARCHAR(20) NOT NULL UNIQUE, -- মোবাইল নম্বর
        gender ENUM ('male', 'female', 'other') DEFAULT 'other', -- লিঙ্গ
        dob DATE DEFAULT NULL, -- জন্ম তারিখ
        -- জিম সম্পর্কিত তথ্য
        gym_name VARCHAR(150) NOT NULL, -- জিমের নাম
        address TEXT DEFAULT NULL, -- ঠিকানা
        city VARCHAR(50) DEFAULT NULL,
        lat INT DEFAULT NULL,
        lng INT DEFAULT NULL,
        state VARCHAR(50) DEFAULT NULL,
        country VARCHAR(50) DEFAULT 'Bangladesh',
        postal_code VARCHAR(20) DEFAULT NULL,
        total_clients INT DEFAULT 0, -- মোট ক্লায়েন্ট সংখ্যা
        plan_features JSON DEFAULT NULL, -- প্ল্যান ফিচার বা বেনিফিটের বিস্তারিত JSON (উদাহরণ: ক্লায়েন্ট লিমিট, স্টাফ সংখ্যা)
        -- অ্যাকাউন্ট স্ট্যাটাস ও সাবস্ক্রিপশন
        status ENUM (
            'active',
            'inactive',
            'paused',
            'suspended',
            'banned'
        ) DEFAULT 'active', -- অ্যাকাউন্ট স্ট্যাটাস
        subscription_plan ENUM ('basic', 'premium', 'enterprise', 'custom') DEFAULT 'basic', -- জিম মালিকের প্ল্যান
        subscription_start DATE DEFAULT NULL,
        subscription_end DATE DEFAULT NULL,
        auto_renew BOOLEAN DEFAULT FALSE, -- অটো রিনিউয়াল সক্রিয় কিনা
        -- পেমেন্ট সম্পর্কিত তথ্য
        payment_method ENUM (
            'cash',
            'card',
            'bank_transfer',
            'upi',
            'wallet',
            'cheque'
        ) DEFAULT NULL, -- পেমেন্ট মাধ্যম
        last_payment_date DATE DEFAULT NULL,
        next_payment_due DATE DEFAULT NULL,
        payment_status ENUM (
            'paid',
            'unpaid',
            'partial',
            'overdue',
            'refunded'
        ) DEFAULT 'unpaid',
        -- নিরাপত্তা ও লগিং
        password_hash VARCHAR(255) DEFAULT NULL, -- লগইন পাসওয়ার্ড হ্যাশ
        two_factor_enabled BOOLEAN DEFAULT FALSE, -- 2FA সক্রিয় কিনা
        last_login TIMESTAMP NULL DEFAULT NULL, -- শেষ লগইন সময়
        failed_login_attempts INT DEFAULT 0, -- ব্যর্থ লগইন ট্র্যাক
        -- মিডিয়া এবং ইনভয়েস
        profile_photo VARCHAR(255) DEFAULT NULL, -- প্রোফাইল ছবি URL
        logo_url VARCHAR(255) DEFAULT NULL, -- জিম লোগো URL
        invoice_prefix VARCHAR(20) DEFAULT 'GYM', -- ইনভয়েসের জন্য প্রিফিক্স
        -- নোট ও অতিরিক্ত তথ্য
        notes TEXT DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- তৈরি হওয়ার সময়
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, -- সর্বশেষ আপডেট
        last_visit TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        -- ডেটা ভ্যালিডেশন
        CONSTRAINT chk_mobile_length CHECK (CHAR_LENGTH(mobile_number) BETWEEN 7 AND 20),
        CONSTRAINT chk_email_format CHECK (email LIKE '%_@_%._%'),
        CONSTRAINT chk_subscription_dates CHECK (subscription_end >= subscription_start)
    ) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4;

-- পারফরম্যান্স ইনডেক্স
CREATE INDEX idx_gym_owners_status ON gym_owners (status);

CREATE INDEX idx_gym_owners_subscription_end ON gym_owners (subscription_end);

CREATE INDEX idx_gym_owners_city ON gym_owners (city);

CREATE INDEX idx_gym_owners_plan ON gym_owners (subscription_plan);

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