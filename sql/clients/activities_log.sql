-- টেবিল: activities_log
-- উদ্দেশ্য: জিম ক্লায়েন্টদের প্রতিদিনের অ্যাক্টিভিটি / ওয়ার্কআউট / সেশন লগ সংরক্ষণ করা
CREATE TABLE
    activities_log (
        activity_id BIGINT AUTO_INCREMENT PRIMARY KEY, -- প্রাইমারি কী: প্রতিটি অ্যাক্টিভিটির ইউনিক আইডি
        client_id BIGINT NOT NULL, -- কোন ক্লায়েন্টের অ্যাক্টিভিটি (clients টেবিলের client_id রেফারেন্স করবে)
        activity_date DATE NOT NULL, -- অ্যাক্টিভিটি হওয়ার তারিখ
        activity_type VARCHAR(50) NOT NULL, -- অ্যাক্টিভিটির ধরন (যেমন: Cardio, Strength, Yoga, HIIT)
        sub_activity VARCHAR(50) DEFAULT NULL, -- সাব-অ্যাক্টিভিটি/নির্দিষ্ট এক্সারসাইজ (যেমন: Running, Bench Press, Deadlift)
        duration_minutes INT DEFAULT NULL, -- সময়কাল (মিনিটে)
        calories_burned DECIMAL(6, 2) DEFAULT NULL, -- ক্যালোরি খরচ (kcal)
        intensity_level ENUM ('low', 'medium', 'high') DEFAULT NULL, -- ইন্টেনসিটি লেভেল
        description TEXT DEFAULT NULL, -- বিস্তারিত বর্ণনা বা নোট
        trainer_id BIGINT DEFAULT NULL, -- ট্রেনারের আইডি (যদি থাকে, trainers টেবিল রেফারেন্স করা যেতে পারে)
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- কখন লগ তৈরি হয়েছে
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, -- আপডেট হলে সময়
        FOREIGN KEY (client_id) REFERENCES clients (client_id) ON DELETE CASCADE,
        -- যদি ট্রেনার টেবিল থাকে তাহলে FK অ্যাড করা যেতে পারে:
        -- FOREIGN KEY (trainer_id) REFERENCES trainers (trainer_id) ON DELETE SET NULL,
        -- ভ্যালিডেশন চেক
        CONSTRAINT chk_duration CHECK (
            duration_minutes IS NULL
            OR duration_minutes >= 0
        ),
        CONSTRAINT chk_calories CHECK (
            calories_burned IS NULL
            OR calories_burned >= 0
        )
    ) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- পারফরম্যান্স উন্নত করার জন্য ইনডেক্স
CREATE INDEX idx_activities_client_date ON activities_log (client_id, activity_date);

CREATE INDEX idx_activity_type ON activities_log (activity_type);

-- উদাহরণ ইনসার্ট (একটি দিনের কার্ডিও ওয়ার্কআউট)
INSERT INTO
    activities_log (
        client_id,
        activity_date,
        activity_type,
        sub_activity,
        duration_minutes,
        calories_burned,
        intensity_level,
        description
    )
VALUES
    (
        101,
        '2025-08-13',
        'Cardio',
        'Treadmill Running',
        30,
        300.50,
        'high',
        'Morning cardio session at 6 AM'
    );

-- উদাহরণ কুয়েরি:
-- 1) নির্দিষ্ট ক্লায়েন্টের মাসিক মোট ক্যালোরি খরচ
SELECT
    client_id,
    SUM(calories_burned) AS total_calories,
    DATE_FORMAT (activity_date, '%Y-%m') AS month
FROM
    activities_log
WHERE
    client_id = 101
GROUP BY
    month;

-- 2) সবচেয়ে বেশি সময়ের অ্যাক্টিভিটি
SELECT
    *
FROM
    activities_log
WHERE
    duration_minutes = (
        SELECT
            MAX(duration_minutes)
        FROM
            activities_log
    );

-- 3) নির্দিষ্ট টাইপের (যেমন: Strength) সাপ্তাহিক অ্যাক্টিভিটি লিস্ট
SELECT
    *
FROM
    activities_log
WHERE
    activity_type = 'Strength'
    AND activity_date BETWEEN CURDATE () - INTERVAL 7 DAY AND CURDATE  ();

-- নোট:
-- 1) `activity_date` রাখা হয়েছে যাতে লগের সময় আলাদা রাখা যায়।
-- 2) `duration_minutes` ও `calories_burned` বিশ্লেষণ, প্রগতি রিপোর্ট ও ট্রেনিং পরিকল্পনার জন্য উপকারী।
-- 3) `trainer_id` দিলে ট্রেনার অনুযায়ী রিপোর্ট করা যাবে।
-- 4) `intensity_level` ENUM হিসেবে রাখা হয়েছে যাতে ইনপুটে কনসিসটেন্সি থাকে।
-- 5) ইনডেক্সগুলো বড় ডেটাবেসে কুয়েরি দ্রুত করবে, বিশেষত client_id + activity_date একসাথে ব্যবহার করলে।