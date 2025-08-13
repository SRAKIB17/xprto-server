ঠিক আছে — এখন আমি আপনার `billing_info` টেবিলকে আরও **পূর্ণাঙ্গ ও প্রফেশনাল লেভেলের জিম বিলিং সিস্টেম** বানিয়ে দেবো,
যেখানে বিলিং, পেমেন্ট, ট্যাক্স, লেট ফি, ইনভয়েস, রিনিউয়াল, হিস্টোরি এবং অডিট সব কভার থাকবে।

---

## **1. মেইন `billing_info` টেবিল (ফুল ফিচার্ড)**

```sql
-- টেবিল: billing_info
-- উদ্দেশ্য: জিম ক্লায়েন্টদের বিলিং ও সাবস্ক্রিপশন ডেটা সংরক্ষণ
CREATE TABLE billing_info (
    billing_id BIGINT AUTO_INCREMENT PRIMARY KEY, -- ইউনিক বিলিং আইডি
    client_id BIGINT NOT NULL, -- ক্লায়েন্ট আইডি (clients টেবিল রেফারেন্স)
    
    subscription_type ENUM('monthly', 'quarterly', 'half-yearly', 'yearly', 'custom') NOT NULL, -- সাবস্ক্রিপশনের ধরন
    subscription_start DATE NOT NULL, -- শুরুর তারিখ
    subscription_end DATE NOT NULL, -- শেষ হওয়ার তারিখ
    renewal_date DATE DEFAULT NULL, -- রিনিউয়াল তারিখ
    
    monthly_fee DECIMAL(10, 2) DEFAULT 0.00, -- মাসিক ফি
    trainer_fee DECIMAL(10, 2) DEFAULT 0.00, -- ট্রেইনার ফি
    supplement_fee DECIMAL(10, 2) DEFAULT 0.00, -- সাপ্লিমেন্ট/প্রোডাক্ট ফি
    tax_percent DECIMAL(5,2) DEFAULT 0.00, -- ট্যাক্স শতাংশ (যেমন: 5.00 মানে ৫%)
    late_fee DECIMAL(10, 2) DEFAULT 0.00, -- লেট পেমেন্ট ফি
    discount_amount DECIMAL(10, 2) DEFAULT 0.00, -- ডিসকাউন্ট পরিমাণ
    
    -- মোট টাকা ক্যালকুলেশন (ট্যাক্স ও লেট ফি সহ)
    total_amount DECIMAL(10, 2) GENERATED ALWAYS AS (
        ((monthly_fee + trainer_fee + supplement_fee + late_fee) 
         - discount_amount) 
        + (((monthly_fee + trainer_fee + supplement_fee + late_fee) - discount_amount) * (tax_percent / 100))
    ) STORED,
    
    payment_status ENUM('paid', 'unpaid', 'partial', 'overdue', 'refunded') DEFAULT 'unpaid', -- পেমেন্ট স্ট্যাটাস
    payment_method ENUM('cash', 'card', 'bank_transfer', 'upi', 'wallet', 'cheque') DEFAULT NULL, -- পেমেন্ট মাধ্যম
    transaction_id VARCHAR(255) DEFAULT NULL, -- ডিজিটাল পেমেন্ট হলে ট্রানজেকশন আইডি
    invoice_url VARCHAR(255) DEFAULT NULL, -- ইনভয়েস পিডিএফ বা লিঙ্ক
    
    next_payment_date DATE DEFAULT NULL, -- পরবর্তী পেমেন্ট তারিখ
    last_payment_date DATE DEFAULT NULL, -- সর্বশেষ পেমেন্ট তারিখ
    auto_renew BOOLEAN DEFAULT FALSE, -- অটো রিনিউ হবে কি না
    reminder_sent BOOLEAN DEFAULT FALSE, -- রিমাইন্ডার পাঠানো হয়েছে কি না
    
    notes TEXT DEFAULT NULL, -- বিশেষ নোট
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- তৈরি হওয়ার সময়
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, -- আপডেট হওয়ার সময়
    
    -- ডেটা ভ্যালিডেশন
    CONSTRAINT chk_fees_non_negative CHECK (
        monthly_fee >= 0 AND trainer_fee >= 0 AND supplement_fee >= 0 AND discount_amount >= 0 AND late_fee >= 0
    ),
    CONSTRAINT chk_valid_dates CHECK (subscription_end >= subscription_start),
    
    FOREIGN KEY (client_id) REFERENCES clients (client_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- পারফরম্যান্স ইনডেক্স
CREATE INDEX idx_billing_client_id ON billing_info (client_id);
CREATE INDEX idx_billing_payment_status ON billing_info (payment_status);
CREATE INDEX idx_billing_dates ON billing_info (subscription_start, subscription_end);
```

---

## **2. `billing_payments` টেবিল (পেমেন্ট হিস্টোরি)**

```sql
-- প্রতিটি বিলিং-এর জন্য একাধিক পেমেন্ট রেকর্ড ট্র্যাক করা
CREATE TABLE billing_payments (
    payment_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    billing_id BIGINT NOT NULL, -- billing_info রেফারেন্স
    payment_date DATE NOT NULL, -- পেমেন্ট তারিখ
    amount_paid DECIMAL(10, 2) NOT NULL, -- কত টাকা পরিশোধ হয়েছে
    method ENUM('cash', 'card', 'bank_transfer', 'upi', 'wallet', 'cheque') NOT NULL, -- পেমেন্ট মাধ্যম
    transaction_id VARCHAR(255) DEFAULT NULL, -- ডিজিটাল ট্রানজেকশন আইডি
    receipt_url VARCHAR(255) DEFAULT NULL, -- রিসিপ্ট লিঙ্ক
    notes TEXT DEFAULT NULL, -- নোট
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (billing_id) REFERENCES billing_info (billing_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE INDEX idx_payment_billing_id ON billing_payments (billing_id);
```

---

## **3. উদাহরণ ডেটা ইনসার্ট**

```sql
-- বিলিং ইনসার্ট
INSERT INTO billing_info (
    client_id, subscription_type, subscription_start, subscription_end, renewal_date,
    monthly_fee, trainer_fee, supplement_fee, tax_percent, late_fee, discount_amount,
    payment_status, payment_method, transaction_id, invoice_url,
    next_payment_date, last_payment_date, auto_renew, notes
) VALUES (
    101, 'monthly', '2025-08-01', '2025-08-31', '2025-09-01',
    2000.00, 500.00, 800.00, 5.00, 0.00, 300.00,
    'paid', 'upi', 'TXN987654321', 'https://gym.com/invoices/invoice101.pdf',
    '2025-09-01', '2025-08-01', TRUE, 'Includes protein supplements & VIP locker access'
);

-- পেমেন্ট হিস্টোরি ইনসার্ট
INSERT INTO billing_payments (
    billing_id, payment_date, amount_paid, method, transaction_id, receipt_url, notes
) VALUES (
    1, '2025-08-01', 3000.00, 'upi', 'TXN987654321', 'https://gym.com/receipts/receipt101.pdf', 'Full payment for August'
);
```

---

## **4. উদাহরণ কুয়েরি**

```sql
-- 1) আগামী ৭ দিনের মধ্যে যাদের পেমেন্ট বাকি
SELECT b.client_id, c.name, b.total_amount, b.next_payment_date
FROM billing_info b
JOIN clients c ON b.client_id = c.client_id
WHERE b.payment_status IN ('unpaid', 'partial')
  AND b.next_payment_date BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 7 DAY);

-- 2) মাসিক মোট আয় (ট্যাক্স সহ)
SELECT DATE_FORMAT(last_payment_date, '%Y-%m') AS month, SUM(total_amount) AS monthly_revenue
FROM billing_info
WHERE payment_status = 'paid'
GROUP BY month
ORDER BY month DESC;

-- 3) ওভারডিউ ক্লায়েন্টদের তালিকা
SELECT c.name, b.total_amount, b.payment_status, b.subscription_end
FROM billing_info b
JOIN clients c ON b.client_id = c.client_id
WHERE b.payment_status = 'overdue'
ORDER BY b.subscription_end ASC;
```

---

💡 **অতিরিক্ত উন্নয়ন আইডিয়া**

1. **Late Fee Auto Update** — যদি `next_payment_date` পেরিয়ে যায় তবে `late_fee` অটোমেটিক যোগ করতে ট্রিগার বানানো।
2. **Auto Reminder System** — ক্রন জব বা ইভেন্ট স্কেজুলার দিয়ে `reminder_sent` আপডেট করা।
3. **GST/VAT Breakdown Table** — আলাদা ট্যাক্স ক্যালকুলেশন লগ রাখা।
4. **Multi-Currency Support** — বিদেশি ক্লায়েন্টদের জন্য `currency` কলাম যোগ করা।

---

যদি চান আমি এই বিলিং সিস্টেমের জন্য **অটো লেট ফি ক্যালকুলেশন ট্রিগার** ও **রিমাইন্ডার সিস্টেম SQL**ও লিখে দিতে পারি।
তাহলে বিলিং একদম ফুল-অটোমেটিক হয়ে যাবে।

আপনি কি চান আমি সেটা করে দিই?
