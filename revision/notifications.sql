-- টেবিল: notifications
-- উদ্দেশ্য: জিম ক্লায়েন্টদের জন্য বিভিন্ন ধরনের নোটিফিকেশন পাঠানো, ট্র্যাক করা এবং পাঠানো ব্যক্তির তথ্য সংরক্ষণ।
CREATE TABLE
    notifications (
        notification_id BIGINT AUTO_INCREMENT PRIMARY KEY, -- প্রতিটি নোটিফিকেশনের ইউনিক আইডি
        client_id BIGINT NOT NULL, -- কোন ক্লায়েন্টকে পাঠানো হয়েছে (clients টেবিলের client_id রেফারেন্স)
        trainer_id BIGINT DEFAULT NULL,
        -- Sender (notification কে পাঠিয়েছে)
        sender_type ENUM ('system', 'admin', 'gym_owner', 'trainer') NOT NULL DEFAULT 'system',
        sender_id BIGINT NULL, -- sender_type যদি human user হয় তবে এখানে তাদের আইডি থাকবে
        title VARCHAR(255) NOT NULL, -- নোটিফিকেশনের সংক্ষিপ্ত শিরোনাম
        message TEXT NOT NULL, -- নোটিফিকেশনের বিস্তারিত বার্তা
        type ENUM (
            'alert', -- জরুরি বার্তা
            'offer', -- অফার/ডিসকাউন্ট
            'update', -- সিস্টেম আপডেট
            'announcement', -- ঘোষণা
            'reminder', -- রিমাইন্ডার
            'payment_due', -- পেমেন্ট ডিউ
            'class_schedule', -- ক্লাস শিডিউল
            'feedback', -- ফিডব্যাক/রিভিউ অনুরোধ
            'achievement', -- অর্জন/অ্যাচিভমেন্ট
            'system_event' -- সিস্টেম ইভেন্ট (যেমন নতুন ফিচার রিলিজ)
        ) NOT NULL DEFAULT 'alert',
        -- Future metadata (extra JSON data রাখার জন্য)
        metadata JSON NULL,
        type ENUM (
            'alert', -- জরুরি বার্তা
            'offer', -- অফার/ডিসকাউন্ট
            'update', -- সিস্টেম আপডেট
            'announcement', -- ঘোষণা
            'reminder', -- রিমাইন্ডার (যেমন: মেম্বারশিপ রিনিউ)
            'payment_due', -- পেমেন্ট ডিউ
            'class_schedule' -- ক্লাস শিডিউল
        ) NOT NULL DEFAULT 'alert',
        priority ENUM ('low', 'medium', 'high', 'urgent') DEFAULT 'medium', -- গুরুত্বের মাত্রা
        status ENUM ('pending', 'sent', 'read', 'dismissed') DEFAULT 'pending', -- পাঠানো ও পড়ার অবস্থা
        delivery_method
        SET
            ('app', 'email', 'sms', 'whatsapp') DEFAULT 'app', -- কোন মাধ্যমে পাঠানো হয়েছে
            -- কে পাঠিয়েছে তার তথ্য
            sender_type ENUM ('system', 'admin', 'gym_owner', 'trainer') NOT NULL DEFAULT 'system',
            sender_id BIGINT NULL, -- sender_type যদি admin/gym_owner/trainer হয়, তাহলে এখানে তাদের আইডি
            sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- কখন পাঠানো হয়েছে
            read_at TIMESTAMP NULL DEFAULT NULL, -- কখন পড়েছে
            expires_at TIMESTAMP NULL DEFAULT NULL, -- কখন মেয়াদ শেষ হবে
            FOREIGN KEY (client_id) REFERENCES clients (client_id) ON DELETE CASCADE
            -- নোট: sender_id এর জন্য আলাদা রিলেশন টেবিল থাকতে পারে যেমন admins/trainers
    ) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4;

-- ইনডেক্স তৈরী
CREATE INDEX idx_notifications_client_id ON notifications (client_id);

CREATE INDEX idx_notifications_sender_type ON notifications (sender_type);

CREATE INDEX idx_notifications_status ON notifications (status);

CREATE INDEX idx_notifications_type ON notifications (type);

-- উদাহরণ ডেটা ইনসার্ট
INSERT INTO
    notifications (
        client_id,
        title,
        message,
        type,
        priority,
        status,
        delivery_method,
        sender_type,
        sender_id,
        expires_at
    )
VALUES
    (
        101,
        'মেম্বারশিপ রিনিউ',
        'আপনার মেম্বারশিপ ৩ দিনের মধ্যে শেষ হবে। রিনিউ করতে আজই যোগাযোগ করুন।',
        'reminder',
        'high',
        'pending',
        'app,email,sms',
        'system',
        NULL,
        DATE_ADD (NOW (), INTERVAL 3 DAY)
    ),
    (
        102,
        'নতুন যোগা ক্লাস',
        'আপনার যোগা ক্লাস প্রতি বুধবার সন্ধ্যা ৬টায়।',
        'class_schedule',
        'medium',
        'sent',
        'app',
        'trainer',
        12,
        NULL
    ),
    (
        103,
        'জিমের ছুটির নোটিশ',
        'আগামী শুক্রবার জিম বন্ধ থাকবে।',
        'announcement',
        'medium',
        'pending',
        'app,email',
        'gym_owner',
        5,
        DATE_ADD (NOW (), INTERVAL 2 DAY)
    );

-- উদাহরণ কুয়েরি:
-- 1) নির্দিষ্ট ক্লায়েন্টের আনরিড নোটিফিকেশন বের করা
SELECT
    *
FROM
    notifications
WHERE
    client_id = 101
    AND status = 'sent'
    AND read_at IS NULL;

-- 2) কোন ট্রেইনার কোন নোটিফিকেশন পাঠিয়েছে, তার লিস্ট
SELECT
    notification_id,
    title,
    message,
    sent_at
FROM
    notifications
WHERE
    sender_type = 'trainer'
    AND sender_id = 12;

-- 3) মেয়াদোত্তীর্ণ অফার ডিলিট করা
DELETE FROM notifications
WHERE
    expires_at IS NOT NULL
    AND expires_at < NOW ();

-- নোট (বাংলায়):
-- 1) sender_type + sender_id রাখার ফলে বোঝা যাবে নোটিফিকেশন কে পাঠিয়েছে এবং প্রয়োজন হলে sender_id থেকে তার ডিটেইলস বের করা যাবে।
-- 2) যদি sender_type = 'system' হয়, তাহলে sender_id NULL রাখা যাবে।
-- 3) আলাদা admins, trainers, gym_owners টেবিল থেকে sender_id দিয়ে জয়েন করলে সম্পূর্ণ তথ্য পাওয়া যাবে (নাম, ইমেইল ইত্যাদি)।
-- 4) delivery_method SET টাইপে একাধিক মাধ্যম সেভ করা সম্ভব।
-- 5) priority এবং status দিয়ে ড্যাশবোর্ডে সাজানো সহজ হবে।