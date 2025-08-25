-- টেবিল: clients
-- উদ্দেশ্য: প্রতিটি জিম ক্লায়েন্টের ব্যক্তিগত তথ্য, স্বাস্থ্য লক্ষ্য, মেম্বারশিপ, এবং XPRTO ইন্টিগ্রেশন ডেটা সংরক্ষণ
CREATE TABLE
    clients (
        client_id BIGINT AUTO_INCREMENT PRIMARY KEY, -- ইউনিক ক্লায়েন্ট আইডি
        gym_owner_id BIGINT NOT NULL, -- কোন জিম মালিকের সাথে ক্লায়েন্ট যুক্ত (gym_owners টেবিল রেফারেন্স)
        xprto_client BOOLEAN DEFAULT FALSE, -- TRUE = XPRTO অ্যাপ থেকে এসেছে, FALSE = জিম মালিক নিজে যোগ করেছে
        fullname VARCHAR(100) NOT NULL, -- ক্লায়েন্টের পূর্ণ নাম
        mobile_number VARCHAR(20) NOT NULL, -- মোবাইল নম্বর (যোগাযোগের জন্য)
        email VARCHAR(100) NOT NULL, -- ইমেইল (লগইন বা নোটিফিকেশনের জন্য)
        dob DATE DEFAULT NULL, -- জন্ম তারিখ
        age INT GENERATED ALWAYS AS (
            IF (
                dob IS NOT NULL,
                TIMESTAMPDIFF (YEAR, dob, CURDATE ()),
                NULL
            )
        ) STORED, -- স্বয়ংক্রিয়ভাবে বয়স হিসাব করা
        gender ENUM ('male', 'female', 'other') DEFAULT 'other', -- লিঙ্গ
        membership_no VARCHAR(50) UNIQUE DEFAULT NULL, -- মেম্বারশিপ নাম্বার (ইউনিক)
        health_goal TEXT DEFAULT NULL, -- ক্লায়েন্টের ফিটনেস বা স্বাস্থ্য লক্ষ্য
        address TEXT DEFAULT NULL, -- ঠিকানা (ঐচ্ছিক)
        emergency_contact VARCHAR(50) DEFAULT NULL, -- জরুরি যোগাযোগ নম্বর
        medical_conditions TEXT DEFAULT NULL, -- মেডিকেল অবস্থা বা এলার্জি
        registered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- সিস্টেমে নিবন্ধনের সময়
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, -- সর্বশেষ আপডেট সময়
        -- ডেটা ভ্যালিডেশন
        CONSTRAINT chk_mobile_length CHECK (CHAR_LENGTH(mobile_number) BETWEEN 7 AND 20),
        CONSTRAINT chk_email_format CHECK (email LIKE '%_@_%._%'),
        -- ফরেন কি: ক্লায়েন্ট মুছে গেলে সম্পর্কিত ডেটা CASCADE করা যাবে
        FOREIGN KEY (gym_owner_id) REFERENCES gym_owners (gym_owner_id) ON DELETE CASCADE
    ) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4;

CREATE TABLE
    health_data (
        health_id BIGINT AUTO_INCREMENT PRIMARY KEY, -- ইউনিক হেলথ আইডি
        client_id BIGINT NOT NULL, -- কোন ক্লায়েন্টের ডেটা
        weight_kg DECIMAL(5, 2), -- ওজন
        height_cm DECIMAL(5, 2), -- উচ্চতা
        bmi DECIMAL(4, 2), -- বডি মাস ইনডেক্স
        fat_kg DECIMAL(5, 2), -- মোট ফ্যাট কেজি
        visceral_fat_percent DECIMAL(5, 2), -- ভিসেরাল ফ্যাট %
        subcutaneous_fat_percent DECIMAL(5, 2), -- সাবকিউটেনিয়াস ফ্যাট %
        muscle_mass_kg DECIMAL(5, 2), -- মোট মাংসপেশির ওজন
        skeletal_muscle_percent DECIMAL(5, 2), -- স্কেলেটাল মাসল %
        body_age INT, -- দেহের অনুমিত বয়স
        resting_metabolism_kcal DECIMAL(6, 2), -- বেসাল মেটাবলিজম (ক্যালোরি)
        water_percent DECIMAL(5, 2), -- শরীরে পানির %
        bone_mass_kg DECIMAL(5, 2), -- হাড়ের ওজন
        recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- কবে মাপা হয়েছে
        FOREIGN KEY (client_id) REFERENCES clients (client_id) ON DELETE CASCADE
    );

-- পারফরম্যান্স বৃদ্ধির জন্য ইনডেক্স
CREATE INDEX idx_clients_gym_owner_id ON clients (gym_owner_id);

CREATE INDEX idx_clients_email ON clients (email);

CREATE INDEX idx_clients_mobile ON clients (mobile_number);

-- উদাহরণ ডেটা ইনসার্ট
INSERT INTO
    clients (
        gym_owner_id,
        xprto_client,
        fullname,
        mobile_number,
        email,
        dob,
        gender,
        membership_no,
        health_goal,
        address,
        emergency_contact,
        medical_conditions
    )
VALUES
    (
        1,
        TRUE,
        'Rakibul Islam',
        '+8801712345678',
        'rakibul@example.com',
        '1995-05-15',
        'male',
        'GYM-1001',
        'Weight loss and muscle gain',
        'Dhaka, Bangladesh',
        '+8801711111111',
        'None'
    );

-- উদাহরণ কুয়েরি
-- 1) XPRTO ক্লায়েন্টদের তালিকা
SELECT
    *
FROM
    clients
WHERE
    xprto_client = TRUE;

-- 2) নির্দিষ্ট জিম মালিকের সব ক্লায়েন্ট
SELECT
    *
FROM
    clients
WHERE
    gym_owner_id = 1
ORDER BY
    registered_at DESC;

-- 3) বয়স অনুযায়ী ফিল্টার
SELECT
    fullname,
    age,
    gender
FROM
    clients
WHERE
    age BETWEEN 20 AND 30;

__________________________________ ---
__________________________________ ---
__________ ---
__________________________________ ---
CREATE TABLE
    client_ratings (
        rating_id BIGINT AUTO_INCREMENT PRIMARY KEY, -- প্রতিটি রেটিং রেকর্ডের জন্য ইউনিক আইডি
        client_id BIGINT NOT NULL, -- কোন ক্লায়েন্টের জন্য এই রেটিং দেওয়া হয়েছে (clients টেবিলের সাথে সম্পর্ক)
        rating_from ENUM ('superadmin', 'gym_owner', 'trainer', 'system') NOT NULL, -- রেটিং কে দিয়েছে
        rating_value DECIMAL(3, 2) NOT NULL CHECK (
            rating_value >= 0
            AND rating_value <= 5
        ), -- রেটিং ভ্যালু (0 থেকে 5 এর মধ্যে)
        comment TEXT, -- রেটিং এর সাথে দেওয়া মন্তব্য/অভিমত
        rated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- কখন রেটিং দেওয়া হয়েছে
        FOREIGN KEY (client_id) REFERENCES clients (client_id) ON DELETE CASCADE
    ) -- ক্লায়েন্টদের জন্য রেটিং এবং মন্তব্য সংরক্ষণ টেবিল
;

CREATE TABLE
    health_data (
        health_id BIGINT AUTO_INCREMENT PRIMARY KEY, -- প্রতিটি রেকর্ডের ইউনিক আইডি
        client_id BIGINT NOT NULL, -- কোন ক্লায়েন্টের তথ্য (clients.client_id এর FK)
        -- মৌলিক মেট্রিকস (দর্শন/স্টোর করার মূল ডেটা)
        weight_kg DECIMAL(6, 2) COMMENT 'ওজন (কেজি)', -- 9999.99 পর্যন্ত
        height_cm DECIMAL(6, 2) COMMENT 'উচ্চতা (সেন্টিমিটার)',
        fat_kg DECIMAL(6, 2) COMMENT 'শরীরের চর্বি (কেজি) যদি নাপা থাকে',
        visceral_fat_percent DECIMAL(5, 2) COMMENT 'ভিসেরাল ফ্যাট (%)',
        subcutaneous_fat_percent DECIMAL(5, 2) COMMENT 'সাবকিউটেনাস ফ্যাট (%) - যদি উপস্থিত থাকে',
        skeletal_muscle_percent DECIMAL(5, 2) COMMENT 'স্কেলেটাল মাসল (%)',
        -- মেটাবলিক ও গুরুত্বপূর্ন সূচক
        resting_metabolism_kcal DECIMAL(8, 2) COMMENT 'বিশ্রাম ক্যালোরি (kcal/day)',
        bmi DECIMAL(5, 2) COMMENT 'বডি মেস ইনডেক্স (BMI) - auto অথবা manual',
        body_age INT COMMENT 'বডি এজ (যদি ডিভাইস দেয়)',
        actual_age INT COMMENT 'প্রকৃত বয়স (বহির্ভূত সূত্র হতে আসতে পারে)',
        -- ব্লাড/বায়ো মার্কার (ঐচ্ছিক, প্রয়োজনে রাখা যাবে)
        blood_pressure_systolic INT COMMENT 'রক্তচাপ সিস্টোলিক (mmHg) - ঐচ্ছিক',
        blood_pressure_diastolic INT COMMENT 'রক্তচাপ ডায়াস্টোলিক (mmHg) - ঐচ্ছিক',
        resting_heart_rate INT COMMENT 'বিশ্রাম হার (BPM) - ঐচ্ছিক',
        blood_glucose_mg_dl DECIMAL(6, 2) COMMENT 'ব্লাড গ্লুকোজ (mg/dL) - ঐচ্ছিক',
        -- রিপোর্ট/পরিমাপ সম্পর্কিত মেটাডেটা
        measurement_date DATE NOT NULL COMMENT 'কবে পরিমাপ/রিপোর্ট নেয়া হয়েছে',
        measurement_time TIME DEFAULT NULL COMMENT 'যদি সময় আলাদাভাবে দরকার হয়',
        measurement_timezone VARCHAR(50) DEFAULT 'Asia/Dhaka' COMMENT 'টাইমজোন রেকর্ড',
        measurement_device VARCHAR(100) DEFAULT 'manual' COMMENT 'যন্ত্র/সিস্টেম; ex: inbody-270, fitbit, manual',
        report_source ENUM ('manual', 'machine', 'xprto_sync', 'third_party') DEFAULT 'manual' COMMENT 'ডেটা উৎস',
        recorded_by_user_id BIGINT DEFAULT NULL COMMENT 'যদি স্টাফ/ট্রেনার রেকর্ড করেন (users টেবিল রেফ)',
        -- প্রগ্রেস ট্র্যাকিং/ট্যাগ
        note VARCHAR(1000) DEFAULT NULL COMMENT 'প্রশিক্ষক বা স্বাস্থ্য পরামর্শকারীর নোট',
        flagged_for_followup BOOLEAN DEFAULT FALSE COMMENT 'ফলোআপ প্রয়োজন কিনা (টগল)',
        -- রেকর্ড ট্র্যাকিং
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'রেকর্ড তৈরি তারিখ/সময়',
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'সর্বশেষ আপডেট',
        is_active BOOLEAN DEFAULT TRUE COMMENT 'ডেটা সক্রিয়/অক্টিভ (soft-delete জন্য)',
        -- Referencing foreign key (clients টেবিল অবশ্যই আগে থাকতে হবে)
        CONSTRAINT fk_health_client FOREIGN KEY (client_id) REFERENCES clients (client_id) ON DELETE CASCADE
    ) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = 'ক্লায়েন্টদের স্বাস্থ্য পরিমাপ ও সম্পর্কিত ডেটা';

-- দ্রুত ক্লায়েন্ট-ভিত্তিক অনুসন্ধানের জন্য
CREATE INDEX idx_health_client_date ON health_data (client_id, measurement_date);

-- ডেটা সূত্র/রিপোর্ট সোর্স অনুসারে ফিল্টার করার জন্য
CREATE INDEX idx_health_report_source ON health_data (report_source);

-- ফলোআপ প্রয়োজনীয় ক্লায়েন্ট দ্রুত খুঁজতে
CREATE INDEX idx_health_flag_followup ON health_data (flagged_for_followup, measurement_date);

-- CREATE TABLE health_data_history (
--     history_id BIGINT AUTO_INCREMENT PRIMARY KEY,
--     health_id BIGINT NOT NULL, -- মূল রেকর্ড আইডি
--     client_id BIGINT NOT NULL,
--     changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
--     change_type ENUM('insert','update','delete') NOT NULL,
--     changed_by_user_id BIGINT DEFAULT NULL,
--     old_data JSON DEFAULT NULL COMMENT 'আপডেট পূর্বের ডেটা (JSON)',
--     new_data JSON DEFAULT NULL COMMENT 'আপডেট পরবর্তী ডেটা (JSON)'
-- ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE
    disputes (
        dispute_id BIGINT AUTO_INCREMENT PRIMARY KEY,
        user_id BIGINT NOT NULL,
        booking_id VARCHAR(64) NULL,
        attendance_id VARCHAR(64) NULL,
        gym_id BIGINT NULL,
        trainer_id BIGINT NULL,
        dispute_type ENUM (
            'attendance',
            'payment',
            'behavior',
            'safety',
            'other'
        ) NOT NULL,
        reason_category VARCHAR(100) NOT NULL,
        description TEXT,
        preferred_resolution ENUM (
            'correction',
            'refund',
            'reschedule',
            'warning',
            'other'
        ) DEFAULT 'correction',
        evidence JSON DEFAULT NULL, -- array of {url, type, size, meta}
        status ENUM (
            'submitted',
            'needs_info',
            'under_review',
            'accepted',
            'partial',
            'rejected',
            'cancelled',
            'appealed'
        ) DEFAULT 'submitted',
        priority ENUM ('low', 'normal', 'high') DEFAULT 'normal',
        assigned_to BIGINT NULL, -- staff id
        review_notes TEXT,
        resolution JSON DEFAULT NULL, -- {action, amount, admin_id, date}
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        closed_at TIMESTAMP NULL
    );