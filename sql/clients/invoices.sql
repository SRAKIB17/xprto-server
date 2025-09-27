-- টেবিল: invoices
-- উদ্দেশ্য: জিম ক্লায়েন্টদের ইনভয়েস সংরক্ষণ, যেখানে পেমেন্ট, ডিউ তারিখ, ডিসকাউন্ট, পেনাল্টি, এবং বিলিং তথ্য থাকবে
CREATE TABLE
    invoices (
        invoice_id BIGINT AUTO_INCREMENT PRIMARY KEY, -- প্রতিটি ইনভয়েসের ইউনিক আইডি (অটো ইনক্রিমেন্ট)
        client_id BIGINT NOT NULL, -- ক্লায়েন্ট আইডি (clients টেবিল রেফারেন্স)
        billing_id BIGINT DEFAULT NULL, -- বিলিং অ্যাড্রেস/তথ্য (billing_info টেবিল রেফারেন্স)
        invoice_number VARCHAR(50) UNIQUE NOT NULL, -- ইউনিক ইনভয়েস নম্বর (যেমন: INV-2025-001)
        subscription_id BIGINT DEFAULT NULL, -- কোন সাবস্ক্রিপশনের জন্য এই ইনভয়েস (subscriptions টেবিল রেফারেন্স, যদি থাকে)
        total_amount DECIMAL(10, 2) NOT NULL CHECK (total_amount >= 0), -- মোট পরিমাণ (টাকা)
        discount_amount DECIMAL(10, 2) DEFAULT 0.00 CHECK (discount_amount >= 0), -- ডিসকাউন্টের পরিমাণ
        penalty_amount DECIMAL(10, 2) DEFAULT 0.00 CHECK (penalty_amount >= 0), -- বিলম্বের পেনাল্টি (যদি থাকে)
        net_amount DECIMAL(10, 2) GENERATED ALWAYS AS (total_amount - discount_amount + penalty_amount) STORED, -- ডিসকাউন্ট/পেনাল্টি যোগ-বিয়োগ শেষে প্রকৃত প্রদেয় পরিমাণ
        currency VARCHAR(10) DEFAULT 'INR', -- মুদ্রা (যেমন: INR, USD)
        payment_method ENUM ('cash', 'card', 'upi', 'bank_transfer', 'cheque') DEFAULT 'cash', -- পেমেন্ট মাধ্যম
        payment_status ENUM ('paid', 'unpaid', 'partial', 'overdue') DEFAULT 'unpaid', -- পেমেন্ট স্ট্যাটাস
        issued_date DATE NOT NULL, -- ইনভয়েস ইস্যুর তারিখ
        due_date DATE NOT NULL, -- পেমেন্টের শেষ তারিখ
        paid_date DATE DEFAULT NULL, -- কখন পেমেন্ট করা হয়েছে (যদি করা হয়)
        recurring BOOLEAN DEFAULT FALSE, -- ইনভয়েস কি রিকারিং (মাসিক/বার্ষিক)
        notes TEXT DEFAULT NULL, -- অতিরিক্ত মন্তব্য
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- তৈরি হওয়ার সময়
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, -- আপডেট হওয়ার সময়
        -- ফরেন কী সম্পর্ক
        FOREIGN KEY (client_id) REFERENCES clients (client_id) ON DELETE CASCADE,
        FOREIGN KEY (billing_id) REFERENCES billing_info (billing_id) ON DELETE SET NULL,
        FOREIGN KEY (subscription_id) REFERENCES subscriptions (subscription_id) ON DELETE SET NULL
    ) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- দ্রুত অনুসন্ধানের জন্য ইনডেক্স
CREATE INDEX idx_invoices_client_id ON invoices (client_id);

CREATE INDEX idx_invoices_invoice_number ON invoices (invoice_number);

CREATE INDEX idx_invoices_payment_status ON invoices (payment_status);

CREATE INDEX idx_invoices_due_date ON invoices (due_date);

-- উদাহরণ: ডেটা ইনসার্ট
INSERT INTO
    invoices (
        client_id,
        billing_id,
        invoice_number,
        subscription_id,
        total_amount,
        discount_amount,
        penalty_amount,
        payment_method,
        payment_status,
        issued_date,
        due_date,
        notes
    )
VALUES
    (
        101,
        5,
        'INV-2025-001',
        12,
        3000.00,
        200.00,
        0.00,
        'upi',
        'unpaid',
        '2025-08-01',
        '2025-08-10',
        'August Monthly Membership Fee'
    );

-- উদাহরণ কুয়েরি:
-- 1) যেসব ইনভয়েসের পেমেন্ট বাকি আছে এবং ডিউ ডেট পেরিয়ে গেছে
SELECT
    invoice_id,
    client_id,
    net_amount,
    due_date
FROM
    invoices
WHERE
    payment_status != 'paid'
    AND due_date < CURDATE ()
ORDER BY
    due_date ASC;

-- 2) প্রতিমাসে মোট কালেকশন রিপোর্ট
SELECT
    DATE_FORMAT (paid_date, '%Y-%m') AS month,
    SUM(net_amount) AS total_collected
FROM
    invoices
WHERE
    payment_status = 'paid'
GROUP BY
    month
ORDER BY
    month DESC;

-- 3) নির্দিষ্ট ক্লায়েন্টের সব ইনভয়েস
SELECT
    invoice_number,
    total_amount,
    discount_amount,
    penalty_amount,
    net_amount,
    payment_status
FROM
    invoices
WHERE
    client_id = 101
ORDER BY
    issued_date DESC;

-- নোট:
-- 1) net_amount কলামটি GENERATED ব্যবহার করে ডিসকাউন্ট ও পেনাল্টি হিসাব স্বয়ংক্রিয় করে।
-- 2) recurring কলাম মাসিক বা বার্ষিক সাবস্ক্রিপশন বিলিংয়ের জন্য উপকারী।
-- 3) penalty_amount বিলম্ব ফি হিসাব করার জন্য।
-- 4) overdue স্ট্যাটাস অটোমেটিক আপডেট করতে MySQL EVENT বা অ্যাপ লজিক ব্যবহার করা যেতে পারে।