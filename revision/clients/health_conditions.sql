-- টেবিল: client_health_conditions
-- উদ্দেশ্য: প্রতিটি ক্লায়েন্টের স্বাস্থ্য সম্পর্কিত রেকর্ড (Vital Signs + Body Composition + Device Info) সংরক্ষণ করা।
CREATE TABLE
    client_health_conditions (
        health_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY, -- প্রাইমারি কী
        client_id BIGINT UNSIGNED NOT NULL, -- clients টেবিলের রেফারেন্স
        added_by BIGINT UNSIGNED DEFAULT NULL, -- trainer/doctor যিনি যুক্ত করেছেন
        -- শারীরিক মাপ
        height_cm DECIMAL(5, 2) DEFAULT NULL, -- উচ্চতা (সেমি)
        weight_kg DECIMAL(5, 2) DEFAULT NULL, -- ওজন (কেজি)
        bmi DECIMAL(5, 2) GENERATED ALWAYS AS (
            weight_kg / ((height_cm / 100) * (height_cm / 100))
        ) STORED, -- BMI স্বয়ংক্রিয়ভাবে হিসাব
        -- Fat & Muscle Composition
        fat_kg DECIMAL(5, 2) DEFAULT NULL, -- মোট চর্বির পরিমাণ (কেজি)
        visceral_fat_percent DECIMAL(5, 2) DEFAULT NULL, -- ভিসেরাল ফ্যাট (%)
        subcutaneous_fat_percent DECIMAL(5, 2) DEFAULT NULL, -- সাবকিউটেনিয়াস ফ্যাট (%)
        skeletal_muscle_percent DECIMAL(5, 2) DEFAULT NULL, -- স্কেলেটাল মাসল (%)
        resting_metabolism INT DEFAULT NULL, -- বিশ্রামকালীন মেটাবলিজম (kcal)
        -- Vital Signs
        blood_pressure_systolic INT DEFAULT NULL, -- উপরের ব্লাড প্রেসার (Systolic)
        blood_pressure_diastolic INT DEFAULT NULL, -- নিচের ব্লাড প্রেসার (Diastolic)
        heart_rate INT DEFAULT NULL, -- হার্ট রেট (bpm)
        body_temperature DECIMAL(4, 1) DEFAULT NULL, -- শরীরের তাপমাত্রা (°C)
        blood_sugar_level DECIMAL(5, 2) DEFAULT NULL, -- রক্তে সুগার (mmol/L)
        oxygen_saturation DECIMAL(4, 1) DEFAULT NULL, -- অক্সিজেন স্যাচুরেশন (%)
        -- Health Conditions
        chronic_diseases TEXT DEFAULT NULL, -- দীর্ঘমেয়াদি রোগ (যেমন ডায়াবেটিস)
        medications TEXT DEFAULT NULL, -- ব্যবহৃত ওষুধ
        allergies TEXT DEFAULT NULL, -- অ্যালার্জি তথ্য
        remarks TEXT DEFAULT NULL, -- অতিরিক্ত মন্তব্য
        -- Device Info
        device_name VARCHAR(100) DEFAULT NULL, -- যেমন "InBody-270"
        recorded_by_id BIGINT UNSIGNED DEFAULT NULL, -- ট্রেইনার/স্টাফ আইডি
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX (client_id),
        FOREIGN KEY (client_id) REFERENCES clients (client_id) ON DELETE CASCADE,
        FOREIGN KEY (added_by) REFERENCES trainers (trainer_id) ON DELETE SET NULL
    ) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;