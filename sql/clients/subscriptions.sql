-- টেবিল: subscriptions
-- উদ্দেশ্য: জিম ক্লায়েন্টদের সাবস্ক্রিপশন প্ল্যান, পেমেন্ট, মেয়াদ, ডিসকাউন্ট, এবং অ্যাক্টিভ স্ট্যাটাস ট্র্যাক করা।
CREATE TABLE
    subscriptions (
        subscription_id BIGINT AUTO_INCREMENT PRIMARY KEY, -- প্রতিটি সাবস্ক্রিপশনের ইউনিক আইডি
        client_id BIGINT NOT NULL, -- কোন ক্লায়েন্টের সাবস্ক্রিপশন (clients টেবিলের client_id রেফারেন্স)
        plan_name VARCHAR(100) NOT NULL, -- মেম্বারশিপ প্ল্যানের নাম (যেমন: Basic, Premium, Annual)
        plan_type ENUM ('monthly', 'quarterly', 'half-yearly', 'yearly') NOT NULL DEFAULT 'monthly', -- প্ল্যানের সময়কাল
        start_date DATE NOT NULL, -- সাবস্ক্রিপশন শুরুর তারিখ
        end_date DATE NOT NULL, -- সাবস্ক্রিপশন শেষ হওয়ার তারিখ
        renewal_date DATE DEFAULT NULL, -- পরবর্তী রিনিউয়াল তারিখ (যদি আগে থেকেই বুক করা থাকে)
        monthly_fee DECIMAL(10, 2) DEFAULT 0.00, -- মাসিক ফি
        trainer_fee DECIMAL(10, 2) DEFAULT 0.00, -- ট্রেইনার ফি (যদি থাকে)
        discount_amount DECIMAL(10, 2) DEFAULT 0.00, -- ডিসকাউন্টের পরিমাণ
        total_amount DECIMAL(10, 2) GENERATED ALWAYS AS ((monthly_fee + trainer_fee) - discount_amount) STORED, -- ফাইনাল পরিশোধযোগ্য পরিমাণ
        payment_status ENUM ('pending', 'paid', 'overdue', 'partial') DEFAULT 'pending', -- পেমেন্ট স্ট্যাটাস
        payment_method ENUM ('cash', 'card', 'bank_transfer', 'upi', 'wallet') DEFAULT NULL, -- পেমেন্টের মাধ্যম
        transaction_id VARCHAR(255) DEFAULT NULL, -- ট্রানজ্যাকশন আইডি (যদি ডিজিটাল পেমেন্ট হয়)
        is_active BOOLEAN DEFAULT TRUE, -- সাবস্ক্রিপশন বর্তমানে সক্রিয় কি না
        auto_renew BOOLEAN DEFAULT FALSE, -- অটো রিনিউয়াল সক্রিয় কিনা
        reminder_sent BOOLEAN DEFAULT FALSE, -- রিনিউয়াল রিমাইন্ডার পাঠানো হয়েছে কিনা
        notes TEXT DEFAULT NULL, -- বিশেষ নোট (যেমন: ফ্রিজ/হোল্ড করা, বিশেষ ছাড়, প্রোমো কোড ইত্যাদি)
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- রেকর্ড তৈরি হওয়ার সময়
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, -- সর্বশেষ আপডেটের সময়
        -- ডেটা ভ্যালিডেশন
        CONSTRAINT chk_fee_non_negative CHECK (
            monthly_fee >= 0
            AND trainer_fee >= 0
            AND discount_amount >= 0
        ),
        CONSTRAINT chk_date_valid CHECK (end_date >= start_date),
        FOREIGN KEY (client_id) REFERENCES clients (client_id) ON DELETE CASCADE -- ক্লায়েন্ট ডিলিট হলে সাবস্ক্রিপশনও ডিলিট হবে
    ) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- পারফরম্যান্স বাড়াতে ইনডেক্স
CREATE INDEX idx_subscriptions_client_id ON subscriptions (client_id);

CREATE INDEX idx_subscriptions_active ON subscriptions (is_active);

CREATE INDEX idx_subscriptions_dates ON subscriptions (start_date, end_date);

-- উদাহরণ ডেটা ইনসার্ট
INSERT INTO
    subscriptions (
        client_id,
        plan_name,
        plan_type,
        start_date,
        end_date,
        monthly_fee,
        trainer_fee,
        discount_amount,
        payment_status,
        payment_method,
        transaction_id,
        is_active,
        auto_renew,
        notes
    )
VALUES
    (
        101,
        'Premium Plan',
        'monthly',
        '2025-08-01',
        '2025-08-31',
        2000.00,
        500.00,
        200.00,
        'paid',
        'upi',
        'TXN123456789',
        TRUE,
        TRUE,
        'Includes free diet consultation'
    );

-- উদাহরণ কুয়েরি:
-- 1) যেসব ক্লায়েন্টের সাবস্ক্রিপশন ৭ দিনের মধ্যে শেষ হবে
SELECT
    client_id,
    plan_name,
    end_date
FROM
    subscriptions
WHERE
    end_date BETWEEN CURDATE () AND DATE_ADD  (CURDATE (), INTERVAL 7 DAY)
ORDER BY
    end_date ASC;

-- 2) যেসব সাবস্ক্রিপশন ওভারডিউ
SELECT
    client_id,
    plan_name,
    payment_status
FROM
    subscriptions
WHERE
    payment_status = 'overdue';

-- 3) সক্রিয় সাবস্ক্রিপশনের মোট আয় হিসাব করা
SELECT
    SUM(total_amount) AS total_revenue
FROM
    subscriptions
WHERE
    is_active = TRUE
    AND payment_status = 'paid';