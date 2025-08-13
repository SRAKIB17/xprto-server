-- টেবিল: skeletal_muscles
-- উদ্দেশ্য: প্রতিটি ক্লায়েন্টের শরীরের বিভিন্ন অংশে স্কেলেটাল মাসলের শতাংশ সংরক্ষণ করা।
CREATE TABLE
    skeletal_muscles (
        skeletal_id BIGINT AUTO_INCREMENT PRIMARY KEY, -- প্রাইমারি কী: প্রতিটি রেকর্ডের ইউনিক আইডি, অটো ইনক্রিমেন্ট হবে
        client_id BIGINT NOT NULL, -- ক্লায়েন্টের আইডি (clients টেবিলের client_id রেফারেন্স করবে)
        whole_body_percent DECIMAL(5, 2) NOT NULL, -- সম্পূর্ণ শরীরের স্কেলেটাল মাসলের শতাংশ (0.00 - 100.00)
        trunk_percent DECIMAL(5, 2) DEFAULT NULL, -- ধড়/ট্রাঙ্কের মাসল শতাংশ (0.00 - 100.00)
        arms_percent DECIMAL(5, 2) DEFAULT NULL, -- দুই বাহুর মাসল শতাংশ
        legs_percent DECIMAL(5, 2) DEFAULT NULL, -- দুই পায়ের মাসল শতাংশ
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, -- ডেটা শেষবার কখন আপডেট হয়েছে তা স্বয়ংক্রিয়ভাবে সংরক্ষণ
        -- ডেটা ভ্যালিডেশনের জন্য CHECK কন্ডিশন (MySQL 8.0+ এ কার্যকর)
        CONSTRAINT chk_whole_body_percent CHECK (
            whole_body_percent >= 0
            AND whole_body_percent <= 100
        ),
        CONSTRAINT chk_trunk_percent CHECK (
            trunk_percent IS NULL
            OR (
                trunk_percent >= 0
                AND trunk_percent <= 100
            )
        ),
        CONSTRAINT chk_arms_percent CHECK (
            arms_percent IS NULL
            OR (
                arms_percent >= 0
                AND arms_percent <= 100
            )
        ),
        CONSTRAINT chk_legs_percent CHECK (
            legs_percent IS NULL
            OR (
                legs_percent >= 0
                AND legs_percent <= 100
            )
        ),
        -- ফরেন কী: clients টেবিলের client_id রেফারেন্স; ক্লায়েন্ট মুছে গেলে সংশ্লিষ্ট ডেটাও মুছে যাবে
        FOREIGN KEY (client_id) REFERENCES clients (client_id) ON DELETE CASCADE
    ) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4;

-- পারফরম্যান্স উন্নয়নের জন্য ইনডেক্স (client_id তে)
CREATE INDEX idx_skeletal_muscles_client_id ON skeletal_muscles (client_id);

-- বিকল্প/অতিরিক্ত ফিল্ড (প্রয়োজন অনুযায়ী যোগ করা যেতে পারে):
-- measured_at TIMESTAMP DEFAULT NULL, -- মাপা হয়েছে কোন সময়ে
-- measured_by VARCHAR(100) DEFAULT NULL, -- কে বা কোন ডিভাইস দ্বারা মাপা হয়েছে
-- measurement_method VARCHAR(100) DEFAULT NULL, -- মাপার পদ্ধতি (যেমন: বডি স্ক্যান, ক্যালিপার ইত্যাদি)
-- notes TEXT DEFAULT NULL, -- অতিরিক্ত নোট বা পর্যবেক্ষণ
-- উদাহরণ: ডেটা ইনসার্ট
INSERT INTO
    skeletal_muscles (
        client_id,
        whole_body_percent,
        trunk_percent,
        arms_percent,
        legs_percent
    )
VALUES
    (101, 45.50, 47.00, 43.00, 46.20);

-- উদাহরণ কুয়েরি:
-- 1) একটি ক্লায়েন্টের সর্বশেষ মাসল শতাংশ রেকর্ড বের করা
SELECT
    *
FROM
    skeletal_muscles
WHERE
    client_id = 101
ORDER BY
    updated_at DESC
LIMIT
    1;

-- 2) যেসব ক্লায়েন্টের স্কেলেটাল মাসল শতাংশ 50% এর বেশি
SELECT
    client_id,
    whole_body_percent
FROM
    skeletal_muscles
WHERE
    whole_body_percent > 50
ORDER BY
    whole_body_percent DESC;

-- নোট (বাংলায়):
-- 1) DECIMAL(5,2) ব্যবহার করা হয়েছে যাতে 0.00 থেকে 100.00 শতাংশ পর্যন্ত নির্ভুল মান রাখা যায়।
-- 2) CHECK কন্ডিশন MySQL 8.0 এর নিচে কার্যকর না হলে অ্যাপ লেভেলে ভ্যালিডেশন করতে হবে।
-- 3) `client_id` এর উপর ইনডেক্স দ্রুত ডেটা রিট্রিভের জন্য খুবই উপকারী।
-- 4) আলাদা তারিখ অনুযায়ী একাধিক মাপ রাখার জন্য `measured_at` কলাম যুক্ত করা বাঞ্ছনীয়।
-- 5) রিপোর্টিংয়ের জন্য measurement_method এবং measured_by কলাম যোগ করলে ডেটা ফিল্টার সহজ হবে।