-- উদ্দেশ্য: প্রতিটি ক্লায়েন্টের শরীরের বিভিন্ন অংশে সাবকিউটেনিয়াস (চর্মের নিচের) ফ্যাট শতাংশ সংরক্ষণ করা।
CREATE TABLE
    subcutaneous_fat (
        sub_fat_id BIGINT AUTO_INCREMENT PRIMARY KEY, -- প্রাইমারি কী: প্রতিটি রেকর্ডের ইউনিক আইডি
        client_id BIGINT NOT NULL, -- ক্লায়েন্টের আইডি, clients টেবিলের সাথে লিঙ্ক করবে
        whole_body_percent DECIMAL(5, 2) NOT NULL, -- পুরো শরীরের সাবকিউটেনিয়াস ফ্যাট শতাংশ (উদাহরণ: 12.50) — ইউনিট: শতাংশ (%)
        trunk_percent DECIMAL(5, 2) DEFAULT NULL, -- ট্রাঙ্ক/শরীরকেন্দ্রীয় অংশের ফ্যাট শতাংশ (0.00 - 100.00)
        arms_percent DECIMAL(5, 2) DEFAULT NULL, -- বাহুদের ফ্যাট শতাংশ
        legs_percent DECIMAL(5, 2) DEFAULT NULL, -- পায়ের ফ্যাট শতাংশ
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, -- শেষবার কখন আপডেট করা হয়েছে (অটো)
        -- ডাটা সঠিকতা নিশ্চিত করতে CHECK কন্ডিশন (MySQL 8.0+ সমর্থন করে)
        CONSTRAINT chk_whole_percent CHECK (
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
        -- ফরেন কি: clients টেবিলের client_id রেফারেন্স করে; ক্লায়েন্ট মুছে ফেলা হলে সংশ্লিষ্ট ফ্যাট রেকর্ডগুলো অটোম্যাটিক ডিলিট হবে
        FOREIGN KEY (client_id) REFERENCES clients (client_id) ON DELETE CASCADE
    ) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4;

-- InnoDB ব্যবহার করা হয়েছে FK ও ট্রাঞ্জেকশন সহজ রাখার জন্য
-- পারফরম্যান্স বাড়াতে: ক্লায়েন্ট আইডির উপর ইনডেক্স থাকা দরকার (অনুসন্ধান ও জয়েন দ্রুত করতে)
CREATE INDEX idx_subcutaneous_fat_client_id ON subcutaneous_fat (client_id);

-- বিকল্প/অতিরিক্ত ফিল্ড (প্রয়োজনে আনকমেন্ট করে যোগ করতে পারেন):
-- measured_at TIMESTAMP DEFAULT NULL, -- মেপা হওয়ার সঠিক সময় (যদি আলাদা রাখতে চান)
-- measured_by VARCHAR(100) DEFAULT NULL, -- যে ব্যক্তি/ডিভাইস দ্বারা পরিমাপ হয়েছে (অ্যাপ/স্কেল মডেল ইত্যাদি)
-- measurement_method VARCHAR(100) DEFAULT NULL, -- পরিমাপের পদ্ধতি (বডি–কম্পোজিশন-স্ক্যান/ক্যালিপার ইত্যাদি)
-- notes TEXT DEFAULT NULL, -- কোন অতিরিক্ত নোট অথবা পর্যবেক্ষণ
-- উদাহরণ: ডেটা ইনসার্ট
INSERT INTO
    subcutaneous_fat (
        client_id,
        whole_body_percent,
        trunk_percent,
        arms_percent,
        legs_percent
    )
VALUES
    (123, 18.50, 20.00, 17.00, 16.50);

-- client_id=123 এর জন্য একটি উদাহরণ রেকর্ড
-- সাধারণ প্রশ্ন (SELECT) উদাহরণ:
-- 1) একটি ক্লায়েন্টের সর্বশেষ রেকর্ড দেখা
SELECT
    *
FROM
    subcutaneous_fat
WHERE
    client_id = 123
ORDER BY
    updated_at DESC
LIMIT
    1;

-- 2) ফ্যাট শতাংশ বিশ্লেষণ: যেখানে পুরো শরীরের সাবকিউটেনিয়াস ফ্যাট 25% এর বেশি
SELECT
    client_id,
    whole_body_percent,
    updated_at
FROM
    subcutaneous_fat
WHERE
    whole_body_percent > 25
ORDER BY
    whole_body_percent DESC;

-- নোট এবং সুপারিশ (বাংলায়):
-- 1) DECIMAL(5,2) ব্যবহার করা হয়েছে যাতে 0.00 থেকে 100.00 পর্যন্ত শতাংশ সঠিকভাবে রাখা যায় (উদাহরণ: 100.00)। যদি ভবিষ্যতে আরও বড় মান বা ভিন্ন ইউনিট দরকার হয়, টাইপ সামঞ্জস্য করুন।
-- 2) CHECK কন্ডিশন ডাটা ভ্যালিডেশন বাড়ায়; তবে পুরোনো MySQL সংস্করণে CHECK অপ্রয়োগ হতে পারে — সেক্ষেত্রে অ্যাপ লেভেলে ভ্যালিডেশন নিশ্চিত করুন।
-- 3) যদি একই ক্লায়েন্টের একাধিক মেজারমেন্ট থাকে, তাহলে `measured_at` কলাম যোগ করে সময় অনুযায়ী ট্র্যাক করা ভাল।
-- 4) রিপোর্টিং বা অ্যানালাইটিক্সের জন্য `client_id`-এ ইনডেক্স থাকা জরুরি — তাই উপরের মতো ইনডেক্স তৈরি করা হয়েছে।
-- 5) যদি আপনার সিস্টেমে মাল্টিপল ধরন/মেথডের মেজারমেন্ট থাকে (উদাহরণ: ক্যালিপার, বডি-স্ক্যান), তাহলে `measurement_method` ও `measured_by` যোগ করতে পারেন — এতে পরে ডাটা ফিল্টার করা সহজ হবে।