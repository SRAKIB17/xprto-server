-- টেবিল: client_muscle_muscles
-- উদ্দেশ্য: প্রতিটি ক্লায়েন্টের শরীরের বিভিন্ন অংশে স্কেলেটাল মাসলের শতাংশ সংরক্ষণ করা।
CREATE TABLE
    client_muscles_record (
        id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY, -- প্রাইমারি কী: প্রতিটি রেকর্ডের ইউনিক আইডি, অটো ইনক্রিমেন্ট হবে
        client_id BIGINT UNSIGNED NOT NULL, -- ক্লায়েন্টের আইডি (clients টেবিলের client_id রেফারেন্স করবে)
        added_by BIGINT UNSIGNED DEFAULT NULL,
        whole_body_percent DECIMAL(5, 2) NOT NULL, -- সম্পূর্ণ শরীরের স্কেলেটাল মাসলের শতাংশ (0.00 - 100.00)
        trunk_percent DECIMAL(5, 2) DEFAULT NULL, -- ধড়/ট্রাঙ্কের মাসল শতাংশ (0.00 - 100.00)
        arms_percent DECIMAL(5, 2) DEFAULT NULL, -- দুই বাহুর মাসল শতাংশ
        legs_percent DECIMAL(5, 2) DEFAULT NULL, -- দুই পায়ের মাসল শতাংশ
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        type ENUM ("skeletal", "subcutaneous") DEFAULT "skeletal",
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, -- ডেটা শেষবার কখন আপডেট হয়েছে তা স্বয়ংক্রিয়ভাবে সংরক্ষণ
        -- ডেটা ভ্যালিডেশনের জন্য CHECK কন্ডিশন (MySQL 8.0+ এ কার্যকর)
        CONSTRAINT client_muscle_chk_whole_body_percent CHECK (
            whole_body_percent >= 0
            AND whole_body_percent <= 100
        ),
        CONSTRAINT client_muscle_chk_trunk_percent CHECK (
            trunk_percent IS NULL
            OR (
                trunk_percent >= 0
                AND trunk_percent <= 100
            )
        ),
        CONSTRAINT client_muscle_chk_arms_percent CHECK (
            arms_percent IS NULL
            OR (
                arms_percent >= 0
                AND arms_percent <= 100
            )
        ),
        CONSTRAINT client_muscle_chk_legs_percent CHECK (
            legs_percent IS NULL
            OR (
                legs_percent >= 0
                AND legs_percent <= 100
            )
        ),
        INDEX (client_id),
        INDEX (type),
        -- ফরেন কী: clients টেবিলের client_id রেফারেন্স; ক্লায়েন্ট মুছে গেলে সংশ্লিষ্ট ডেটাও মুছে যাবে
        FOREIGN KEY (client_id) REFERENCES clients (client_id) ON DELETE CASCADE,
        FOREIGN KEY (added_by) REFERENCES trainers (trainer_id) ON DELETE SET NULL
    ) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

```sql
INSERT INTO client_muscles_record 
(client_id, whole_body_percent, trunk_percent, arms_percent, legs_percent)
VALUES
(1, 42.5, 44.1, 39.8, 40.5),
(1, 43.8, 45.0, 41.2, 42.1),
(1, 44.7, 46.3, 42.0, 43.5),
(1, 45.2, 47.1, 43.0, 44.0),
(1, 46.0, 47.8, 44.1, 44.9),
(1, 46.9, 48.2, 45.0, 45.7),
(1, 47.3, 48.9, 45.8, 46.2),
(1, 48.0, 49.4, 46.3, 46.8),
(1, 48.5, 50.0, 47.0, 47.5),
(1, 49.2, 50.7, 47.8, 48.0);
 ```