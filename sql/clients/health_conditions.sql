-- টেবিল: health_conditions
-- উদ্দেশ্য: জিম/ফিটনেস ক্লায়েন্টদের স্বাস্থ্য সম্পর্কিত শর্ত, অসুখ বা শারীরিক সমস্যা সংরক্ষণ
CREATE TABLE
    health_conditions (
        condition_id BIGINT AUTO_INCREMENT PRIMARY KEY, -- প্রতিটি হেলথ কন্ডিশনের ইউনিক আইডি
        client_id BIGINT NOT NULL, -- কোন ক্লায়েন্টের কন্ডিশন (clients টেবিলের client_id রেফারেন্স)
        condition_name VARCHAR(150) NOT NULL, -- কন্ডিশনের নাম (যেমন: উচ্চ রক্তচাপ, ডায়াবেটিস)
        description VARCHAR(500) DEFAULT NULL, -- কন্ডিশনের বিস্তারিত বিবরণ
        diagnosis_date DATE DEFAULT NULL, -- কন্ডিশন প্রথম কবে শনাক্ত হয়েছে
        severity ENUM ('mild', 'moderate', 'severe', 'critical') DEFAULT 'mild', -- গুরুতরতার স্তর
        status ENUM (
            'active',
            'under treatment',
            'recovered',
            'resolved'
        ) DEFAULT 'active', -- বর্তমান অবস্থা
        medication VARCHAR(255) DEFAULT NULL, -- প্রযোজ্য হলে চলমান ওষুধের নাম
        allergies VARCHAR(255) DEFAULT NULL, -- প্রাসঙ্গিক অ্যালার্জি তথ্য (যেমন: peanut, penicillin)
        notes TEXT DEFAULT NULL, -- যেকোনো অতিরিক্ত নোট বা পর্যবেক্ষণ
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, -- শেষবার আপডেটের সময়
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- রেকর্ড তৈরির সময়
        -- ফরেন কী: ক্লায়েন্ট মুছে গেলে তার সব হেলথ কন্ডিশনও মুছে যাবে
        FOREIGN KEY (client_id) REFERENCES clients (client_id) ON DELETE CASCADE
    ) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- পারফরম্যান্স উন্নয়নের জন্য ইনডেক্স
CREATE INDEX idx_health_conditions_client_id ON health_conditions (client_id);

CREATE INDEX idx_health_conditions_status ON health_conditions (status);

CREATE INDEX idx_health_conditions_severity ON health_conditions (severity);

-- উদাহরণ ডেটা ইনসার্ট
INSERT INTO
    health_conditions (
        client_id,
        condition_name,
        description,
        diagnosis_date,
        severity,
        status,
        medication,
        allergies,
        notes
    )
VALUES
    (
        101,
        'High Blood Pressure',
        'ক্লায়েন্টের রক্তচাপ সাধারণত উচ্চ থাকে',
        '2023-06-15',
        'moderate',
        'under treatment',
        'Amlodipine 5mg',
        'None',
        'প্রতিদিন সকালে BP চেক করতে হবে'
    ),
    (
        102,
        'Type 2 Diabetes',
        'রক্তে শর্করার মাত্রা নিয়ন্ত্রণে সমস্যা',
        '2022-11-05',
        'severe',
        'active',
        'Metformin 500mg',
        'Peanut',
        'ডায়েট কন্ট্রোল ও এক্সারসাইজ চলছে'
    );

-- উদাহরণ কুয়েরি
-- 1) সক্রিয় গুরুতর কন্ডিশন বিশিষ্ট ক্লায়েন্টদের তালিকা
SELECT
    client_id,
    condition_name,
    severity,
    status
FROM
    health_conditions
WHERE
    severity IN ('severe', 'critical')
    AND status = 'active';

-- 2) নির্দিষ্ট ক্লায়েন্টের স্বাস্থ্য ইতিহাস
SELECT
    *
FROM
    health_conditions
WHERE
    client_id = 101
ORDER BY
    diagnosis_date DESC;

-- নোট (বাংলায়):
-- 1) `condition_name` আলাদা রাখার ফলে ফিল্টার বা রিপোর্ট সহজ হবে।
-- 2) `severity` ও `status` ENUM ফিল্ডগুলো ব্যবহার করলে ডেটা ভ্যালিডেশন শক্তিশালী হবে।
-- 3) `diagnosis_date` থাকলে রোগের টাইমলাইন ট্র্যাক করা সম্ভব।
-- 4) `medication` ও `allergies` রাখলে ট্রেনার বা মেডিক্যাল কনসালট্যান্ট সহজেই সতর্ক থাকতে পারবেন।
-- 5) ইনডেক্স যোগ করার ফলে বড় ডাটাবেসেও দ্রুত কুয়েরি সম্ভব।