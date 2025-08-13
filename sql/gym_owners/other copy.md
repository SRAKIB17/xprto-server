ঠিক আছে — নিচে আমি পুরো **একটি জিম-ওয়ান + ট্রেইনার + ক্লায়েন্ট** কভার করে এমন সম্পূর্ণ, রিলেশনাল ও প্রফেশনাল স্কিমা দিলাম। প্রতিটি টেবিলের পাশে বাংলা ইনলাইন মন্তব্য আছে; ফরেন-কী, ইনডেক্স, চেক কন্ডিশন, কিছু ট্রিগার (উদাহরণস্বরূপ) এবং সাধারণ JOIN কুয়েরিও দেয়া আছে যাতে আপনি সিস্টেমটি সরাসরি ব্যবহার/মাইগ্রেট করতে পারেন।

> টেবিলগুলো MySQL (InnoDB) অনুসারে লেখা — আপনি প্রয়োজনমত সামঞ্জস্য করবেন (Postgres বা অন্য DB হলে টাইপ/সিনট্যাক্স সামান্য বদলাতে হবে)।

---

```sql
/********************************************************************************
  FULL GYM MANAGEMENT SCHEMA
  - Gym owners, Clients, Trainers, Memberships, Billing, Subscriptions
  - Health data (skeletal_muscles, subcutaneous_fat, health_data)
  - Attendance, Ratings, Supplements, Events, Invoices, Audit log, Notifications
*********************************************************************************/

SET SESSION sql_mode = 'STRICT_ALL_TABLES,ERROR_FOR_DIVISION_BY_ZERO,NO_ZERO_DATE,NO_ZERO_IN_DATE';

/* 1) gym_owners */
CREATE TABLE IF NOT EXISTS gym_owners (
    gym_owner_id BIGINT AUTO_INCREMENT PRIMARY KEY, -- ইউনিক জিম মালিক আইডি
    fullname VARCHAR(100) NOT NULL, -- মালিকের নাম
    gym_name VARCHAR(150) NOT NULL, -- জিমের নাম
    email VARCHAR(100) NOT NULL UNIQUE, -- ইমেইল
    mobile_number VARCHAR(20) NOT NULL UNIQUE, -- মোবাইল
    gender ENUM('male','female','other') DEFAULT 'other',
    dob DATE DEFAULT NULL,
    age INT GENERATED ALWAYS AS (IF(dob IS NOT NULL, TIMESTAMPDIFF(YEAR, dob, CURDATE()), NULL)) STORED,
    address TEXT DEFAULT NULL,
    city VARCHAR(50) DEFAULT NULL,
    state VARCHAR(50) DEFAULT NULL,
    country VARCHAR(50) DEFAULT 'Bangladesh',
    postal_code VARCHAR(20) DEFAULT NULL,
    total_clients INT DEFAULT 0, -- ক্যালকুলেটেড/ক্যাশ করা ভ্যালু
    plan_features JSON DEFAULT NULL, -- প্ল্যান ডিটেইলস (JSON)
    status ENUM('active','inactive','paused','suspended','banned') DEFAULT 'active',
    subscription_plan ENUM('basic','premium','enterprise','custom') DEFAULT 'basic',
    subscription_start DATE DEFAULT NULL,
    subscription_end DATE DEFAULT NULL,
    auto_renew BOOLEAN DEFAULT FALSE,
    payment_method ENUM('cash','card','bank_transfer','upi','wallet','cheque') DEFAULT NULL,
    last_payment_date DATE DEFAULT NULL,
    next_payment_due DATE DEFAULT NULL,
    payment_status ENUM('paid','unpaid','partial','overdue','refunded') DEFAULT 'unpaid',
    password_hash VARCHAR(255) DEFAULT NULL,
    two_factor_enabled BOOLEAN DEFAULT FALSE,
    last_login TIMESTAMP NULL DEFAULT NULL,
    failed_login_attempts INT DEFAULT 0,
    profile_photo VARCHAR(255) DEFAULT NULL,
    logo_url VARCHAR(255) DEFAULT NULL,
    invoice_prefix VARCHAR(20) DEFAULT 'GYM',
    notes TEXT DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT chk_mobile_length_gym CHECK (CHAR_LENGTH(mobile_number) BETWEEN 7 AND 20),
    CONSTRAINT chk_email_format_gym CHECK (email LIKE '%_@_%._%')
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE INDEX idx_gym_owners_status ON gym_owners (status);
CREATE INDEX idx_gym_owners_subscription_end ON gym_owners (subscription_end);
CREATE INDEX idx_gym_owners_city ON gym_owners (city);

/* 2) clients */
CREATE TABLE IF NOT EXISTS clients (
    client_id BIGINT AUTO_INCREMENT PRIMARY KEY, -- ইউনিক ক্লায়েন্ট আইডি
    gym_owner_id BIGINT NOT NULL, -- কোন জিম মালিকের ক্লায়েন্ট
    xprto_client BOOLEAN DEFAULT FALSE, -- XPRTO থেকে এসেছে কি না
    fullname VARCHAR(100) NOT NULL, -- নাম
    mobile_number VARCHAR(20) NOT NULL, -- মোবাইল
    email VARCHAR(100) DEFAULT NULL, -- ইমেইল
    dob DATE DEFAULT NULL,
    age INT GENERATED ALWAYS AS (IF(dob IS NOT NULL, TIMESTAMPDIFF(YEAR,dob,CURDATE()),NULL)) STORED,
    gender ENUM('male','female','other') DEFAULT 'other',
    membership_no VARCHAR(50) UNIQUE DEFAULT NULL, -- মেম্বারশিপ নম্বর
    health_goal TEXT DEFAULT NULL,
    address TEXT DEFAULT NULL,
    emergency_contact VARCHAR(50) DEFAULT NULL,
    medical_conditions TEXT DEFAULT NULL,
    status ENUM('active','inactive','suspended') DEFAULT 'active',
    last_visit_date DATE DEFAULT NULL,
    registered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (gym_owner_id) REFERENCES gym_owners(gym_owner_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE INDEX idx_clients_gym_owner_id ON clients (gym_owner_id);
CREATE INDEX idx_clients_mobile ON clients (mobile_number);
CREATE INDEX idx_clients_email ON clients (email);

/* 3) trainers */
CREATE TABLE IF NOT EXISTS trainers (
    trainer_id BIGINT AUTO_INCREMENT PRIMARY KEY, -- ট্রেইনারের ইউনিক আইডি
    gym_owner_id BIGINT NOT NULL, -- কোন জিমে কাজ করে
    fullname VARCHAR(100) NOT NULL,
    email VARCHAR(100) DEFAULT NULL,
    mobile_number VARCHAR(20) DEFAULT NULL,
    specialization VARCHAR(100) DEFAULT NULL, -- বিশেষত্ব (yoga, weight training...)
    experience_years INT DEFAULT 0,
    certifications JSON DEFAULT NULL, -- সার্টিফিকেট তালিকা (JSON)
    hourly_rate DECIMAL(10,2) DEFAULT 0.00, -- প্রতি ঘন্টার রেট
    status ENUM('active','inactive','suspended') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (gym_owner_id) REFERENCES gym_owners(gym_owner_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE INDEX idx_trainers_gym ON trainers (gym_owner_id);

/* 4) memberships (full) */
CREATE TABLE IF NOT EXISTS memberships (
    membership_id BIGINT AUTO_INCREMENT PRIMARY KEY, -- মেম্বারশিপ আইডি
    client_id BIGINT NOT NULL, -- কোন ক্লায়েন্টের মেম্বারশিপ
    plan_name VARCHAR(100) NOT NULL, -- প্ল্যান নাম (Basic, Premium)
    plan_type ENUM('monthly','quarterly','half-yearly','yearly','custom') NOT NULL DEFAULT 'monthly',
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    renewal_date DATE DEFAULT NULL,
    monthly_fee DECIMAL(10,2) DEFAULT 0.00,
    trainer_fee DECIMAL(10,2) DEFAULT 0.00,
    supplement_fee DECIMAL(10,2) DEFAULT 0.00,
    discount_amount DECIMAL(10,2) DEFAULT 0.00,
    total_amount DECIMAL(12,2) GENERATED ALWAYS AS ((monthly_fee + trainer_fee + supplement_fee) - discount_amount) STORED,
    tax_percent DECIMAL(5,2) DEFAULT 0.00, -- ট্যাক্স শতাংশ
    tax_amount DECIMAL(12,2) GENERATED ALWAYS AS (total_amount * (tax_percent/100)) STORED,
    grand_total DECIMAL(12,2) GENERATED ALWAYS AS (total_amount + tax_amount) STORED,
    status ENUM('active','inactive','paused','expired') DEFAULT 'active',
    auto_renew BOOLEAN DEFAULT FALSE,
    pause_start DATE DEFAULT NULL, -- হোল্ড/ফ্রিজ শুরু
    pause_end DATE DEFAULT NULL, -- হোল্ড শেষ
    notes TEXT DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT chk_membership_fees_non_negative CHECK (monthly_fee >= 0 AND trainer_fee >= 0 AND supplement_fee >= 0 AND discount_amount >= 0),
    CONSTRAINT chk_membership_dates CHECK (end_date >= start_date),
    FOREIGN KEY (client_id) REFERENCES clients(client_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE INDEX idx_memberships_client_id ON memberships (client_id);
CREATE INDEX idx_memberships_status ON memberships (status);
CREATE INDEX idx_memberships_dates ON memberships (start_date, end_date);

/* 5) billing_info (full / complex) */
CREATE TABLE IF NOT EXISTS billing_info (
    billing_id BIGINT AUTO_INCREMENT PRIMARY KEY, -- বিলিং রেকর্ড আইডি
    client_id BIGINT NOT NULL, -- কোন ক্লায়েন্টের জন্য
    membership_id BIGINT DEFAULT NULL, -- সম্পর্কিত মেম্বারশিপ (যদি থাকে)
    subscription_type ENUM('monthly','quarterly','half-yearly','yearly','custom') NOT NULL,
    subscription_start DATE NOT NULL,
    subscription_end DATE NOT NULL,
    monthly_fee DECIMAL(12,2) DEFAULT 0.00,
    trainer_fee DECIMAL(12,2) DEFAULT 0.00,
    supplement_fee DECIMAL(12,2) DEFAULT 0.00,
    discount_amount DECIMAL(12,2) DEFAULT 0.00,
    late_fee DECIMAL(12,2) DEFAULT 0.00,
    tax_percent DECIMAL(5,2) DEFAULT 0.00,
    sub_total DECIMAL(14,2) GENERATED ALWAYS AS ((monthly_fee + trainer_fee + supplement_fee + late_fee) - discount_amount) STORED,
    tax_amount DECIMAL(14,2) GENERATED ALWAYS AS (sub_total * (tax_percent/100)) STORED,
    total_amount DECIMAL(14,2) GENERATED ALWAYS AS (sub_total + tax_amount) STORED,
    currency VARCHAR(8) DEFAULT 'BDT',
    payment_status ENUM('paid','unpaid','partial','overdue','refunded') DEFAULT 'unpaid',
    payment_method ENUM('cash','card','bank_transfer','upi','wallet','cheque') DEFAULT NULL,
    transaction_id VARCHAR(255) DEFAULT NULL,
    invoice_url VARCHAR(255) DEFAULT NULL,
    next_payment_date DATE DEFAULT NULL,
    last_payment_date DATE DEFAULT NULL,
    auto_renew BOOLEAN DEFAULT FALSE,
    reminder_sent BOOLEAN DEFAULT FALSE,
    notes TEXT DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT chk_billing_non_negative CHECK (monthly_fee >= 0 AND trainer_fee >= 0 AND supplement_fee >= 0 AND discount_amount >= 0 AND late_fee >= 0),
    CONSTRAINT chk_billing_dates CHECK (subscription_end >= subscription_start),
    FOREIGN KEY (client_id) REFERENCES clients(client_id) ON DELETE CASCADE,
    FOREIGN KEY (membership_id) REFERENCES memberships(membership_id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE INDEX idx_billing_client_id ON billing_info (client_id);
CREATE INDEX idx_billing_status ON billing_info (payment_status);
CREATE INDEX idx_billing_dates ON billing_info (subscription_start, subscription_end);

/* 6) billing_payments (payment history) */
CREATE TABLE IF NOT EXISTS billing_payments (
    payment_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    billing_id BIGINT NOT NULL, -- billing_info রেফারেন্স
    payment_date DATETIME NOT NULL,
    amount_paid DECIMAL(14,2) NOT NULL,
    currency VARCHAR(8) DEFAULT 'BDT',
    method ENUM('cash','card','bank_transfer','upi','wallet','cheque') NOT NULL,
    transaction_id VARCHAR(255) DEFAULT NULL,
    receipt_url VARCHAR(255) DEFAULT NULL,
    notes TEXT DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (billing_id) REFERENCES billing_info(billing_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE INDEX idx_payments_billing_id ON billing_payments (billing_id);

/* 7) subscriptions (if separate from memberships) */
CREATE TABLE IF NOT EXISTS subscriptions (
    subscription_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    client_id BIGINT NOT NULL,
    plan_name VARCHAR(100) NOT NULL,
    plan_type ENUM('monthly','quarterly','half-yearly','yearly','custom') NOT NULL DEFAULT 'monthly',
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    monthly_fee DECIMAL(12,2) DEFAULT 0.00,
    discount_amount DECIMAL(12,2) DEFAULT 0.00,
    auto_renew BOOLEAN DEFAULT FALSE,
    status ENUM('active','cancelled','expired') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (client_id) REFERENCES clients(client_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

/* 8) health_data (general: bmi, weight, height, body_age etc.) */
CREATE TABLE IF NOT EXISTS health_data (
    health_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    client_id BIGINT NOT NULL,
    weight_kg DECIMAL(6,2) DEFAULT NULL, -- কেজি
    height_cm DECIMAL(6,2) DEFAULT NULL, -- সেন্টিমিটার
    bmi DECIMAL(5,2) GENERATED ALWAYS AS (IF(weight_kg IS NOT NULL AND height_cm IS NOT NULL AND height_cm > 0, (weight_kg / ((height_cm/100)*(height_cm/100))), NULL)) STORED,
    body_fat_percent DECIMAL(5,2) DEFAULT NULL,
    visceral_fat_percent DECIMAL(5,2) DEFAULT NULL,
    resting_metabolism_kcal DECIMAL(8,2) DEFAULT NULL,
    body_age INT DEFAULT NULL,
    measured_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    notes TEXT DEFAULT NULL,
    FOREIGN KEY (client_id) REFERENCES clients(client_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE INDEX idx_health_client_id ON health_data (client_id);
CREATE INDEX idx_health_measured_at ON health_data (measured_at);

/* 9) skeletal_muscles */
CREATE TABLE IF NOT EXISTS skeletal_muscles (
    skeletal_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    client_id BIGINT NOT NULL,
    whole_body_percent DECIMAL(5,2) NOT NULL, -- 0.00 - 100.00
    trunk_percent DECIMAL(5,2) DEFAULT NULL,
    arms_percent DECIMAL(5,2) DEFAULT NULL,
    legs_percent DECIMAL(5,2) DEFAULT NULL,
    measured_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    notes TEXT DEFAULT NULL,
    CONSTRAINT chk_sk_whole CHECK (whole_body_percent >= 0 AND whole_body_percent <= 100),
    FOREIGN KEY (client_id) REFERENCES clients(client_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE INDEX idx_skeletal_client_id ON skeletal_muscles (client_id);

/* 10) subcutaneous_fat */
CREATE TABLE IF NOT EXISTS subcutaneous_fat (
    sub_fat_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    client_id BIGINT NOT NULL,
    whole_body_percent DECIMAL(5,2) DEFAULT NULL,
    trunk_percent DECIMAL(5,2) DEFAULT NULL,
    arms_percent DECIMAL(5,2) DEFAULT NULL,
    legs_percent DECIMAL(5,2) DEFAULT NULL,
    measured_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    notes TEXT DEFAULT NULL,
    CONSTRAINT chk_sub_whole CHECK (whole_body_percent IS NULL OR (whole_body_percent >= 0 AND whole_body_percent <= 100)),
    FOREIGN KEY (client_id) REFERENCES clients(client_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE INDEX idx_subfat_client_id ON subcutaneous_fat (client_id);

/* 11) client_attendance */
CREATE TABLE IF NOT EXISTS client_attendance (
    attendance_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    client_id BIGINT NOT NULL,
    gym_owner_id BIGINT NOT NULL,
    attendance_date DATE NOT NULL,
    check_in_time DATETIME DEFAULT NULL,
    check_out_time DATETIME DEFAULT NULL,
    source ENUM('app','frontdesk','kiosk') DEFAULT 'frontdesk',
    notes TEXT DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (client_id) REFERENCES clients(client_id) ON DELETE CASCADE,
    FOREIGN KEY (gym_owner_id) REFERENCES gym_owners(gym_owner_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE INDEX idx_attendance_client ON client_attendance (client_id);
CREATE INDEX idx_attendance_date ON client_attendance (attendance_date);

/* 12) gym_ratings */
CREATE TABLE IF NOT EXISTS gym_ratings (
    rating_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    gym_owner_id BIGINT NOT NULL,
    client_id BIGINT NOT NULL,
    trainer_id BIGINT DEFAULT NULL, -- যদি ট্রেইনারকেও রেট করা হয়
    rating TINYINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
    feedback TEXT DEFAULT NULL,
    anonymous BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (gym_owner_id) REFERENCES gym_owners(gym_owner_id) ON DELETE CASCADE,
    FOREIGN KEY (client_id) REFERENCES clients(client_id) ON DELETE CASCADE,
    FOREIGN KEY (trainer_id) REFERENCES trainers(trainer_id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE INDEX idx_ratings_gym ON gym_ratings (gym_owner_id);
CREATE INDEX idx_ratings_client ON gym_ratings (client_id);

/* 13) supplements (products) */
CREATE TABLE IF NOT EXISTS supplements (
    supplement_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    gym_owner_id BIGINT NOT NULL,
    name VARCHAR(150) NOT NULL,
    sku VARCHAR(100) DEFAULT NULL,
    type ENUM('protein','vitamin','pre-workout','other') DEFAULT 'other',
    price DECIMAL(12,2) NOT NULL,
    stock INT DEFAULT 0,
    description TEXT DEFAULT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (gym_owner_id) REFERENCES gym_owners(gym_owner_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE INDEX idx_supplements_gym ON supplements (gym_owner_id);

/* 14) gym_events / classes */
CREATE TABLE IF NOT EXISTS gym_events (
    event_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    gym_owner_id BIGINT NOT NULL,
    title VARCHAR(150) NOT NULL,
    description TEXT DEFAULT NULL,
    start_datetime DATETIME NOT NULL,
    end_datetime DATETIME NOT NULL,
    max_participants INT DEFAULT NULL,
    trainer_id BIGINT DEFAULT NULL,
    price DECIMAL(12,2) DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (gym_owner_id) REFERENCES gym_owners(gym_owner_id) ON DELETE CASCADE,
    FOREIGN KEY (trainer_id) REFERENCES trainers(trainer_id) ON DELETE SET NULL,
    CONSTRAINT chk_event_dates CHECK (end_datetime >= start_datetime)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE INDEX idx_events_gym ON gym_events (gym_owner_id);
CREATE INDEX idx_events_start ON gym_events (start_datetime);

/* 15) class_participants (event attendance / booking) */
CREATE TABLE IF NOT EXISTS class_participants (
    participant_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    event_id BIGINT NOT NULL,
    client_id BIGINT NOT NULL,
    trainer_id BIGINT DEFAULT NULL,
    status ENUM('booked','attended','cancelled','no_show') DEFAULT 'booked',
    paid_amount DECIMAL(12,2) DEFAULT 0.00,
    booked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (event_id) REFERENCES gym_events(event_id) ON DELETE CASCADE,
    FOREIGN KEY (client_id) REFERENCES clients(client_id) ON DELETE CASCADE,
    FOREIGN KEY (trainer_id) REFERENCES trainers(trainer_id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE INDEX idx_class_event ON class_participants (event_id);
CREATE INDEX idx_class_client ON class_participants (client_id);

/* 16) trainer_assignments (which trainer assigned to which client) */
CREATE TABLE IF NOT EXISTS trainer_assignments (
    assignment_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    trainer_id BIGINT NOT NULL,
    client_id BIGINT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE DEFAULT NULL,
    hourly_rate DECIMAL(12,2) DEFAULT NULL,
    notes TEXT DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (trainer_id) REFERENCES trainers(trainer_id) ON DELETE CASCADE,
    FOREIGN KEY (client_id) REFERENCES clients(client_id) ON DELETE CASCADE,
    CONSTRAINT chk_assignment_dates CHECK (end_date IS NULL OR end_date >= start_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE INDEX idx_assignment_trainer ON trainer_assignments (trainer_id);
CREATE INDEX idx_assignment_client ON trainer_assignments (client_id);

/* 17) invoices (summarised invoices) */
CREATE TABLE IF NOT EXISTS invoices (
    invoice_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    billing_id BIGINT DEFAULT NULL, -- লিংক বিলিং রেকর্ডের সাথে
    client_id BIGINT NOT NULL,
    invoice_no VARCHAR(100) NOT NULL UNIQUE,
    invoice_date DATE NOT NULL,
    due_date DATE DEFAULT NULL,
    sub_total DECIMAL(14,2) DEFAULT 0.00,
    tax_amount DECIMAL(14,2) DEFAULT 0.00,
    total_amount DECIMAL(14,2) DEFAULT 0.00,
    currency VARCHAR(8) DEFAULT 'BDT',
    status ENUM('issued','paid','cancelled','refunded') DEFAULT 'issued',
    pdf_url VARCHAR(255) DEFAULT NULL,
    notes TEXT DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (billing_id) REFERENCES billing_info(billing_id) ON DELETE SET NULL,
    FOREIGN KEY (client_id) REFERENCES clients(client_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE INDEX idx_invoices_client ON invoices (client_id);
CREATE INDEX idx_invoices_invoice_no ON invoices (invoice_no);

/* 18) notifications (system reminders / push / email) */
CREATE TABLE IF NOT EXISTS notifications (
    notification_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    gym_owner_id BIGINT DEFAULT NULL,
    client_id BIGINT DEFAULT NULL,
    title VARCHAR(255) NOT NULL,
    body TEXT DEFAULT NULL,
    type ENUM('reminder','promo','system','payment') DEFAULT 'system',
    channel ENUM('email','sms','push','inapp') DEFAULT 'inapp',
    sent BOOLEAN DEFAULT FALSE,
    sent_at DATETIME DEFAULT NULL,
    meta JSON DEFAULT NULL, -- অতিরিক্ত ডেটা
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (gym_owner_id) REFERENCES gym_owners(gym_owner_id) ON DELETE CASCADE,
    FOREIGN KEY (client_id) REFERENCES clients(client_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE INDEX idx_notifications_client ON notifications (client_id);
CREATE INDEX idx_notifications_sent ON notifications (sent);

/* 19) audit_log (simple audit trail) */
CREATE TABLE IF NOT EXISTS audit_log (
    audit_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    entity_type VARCHAR(100) NOT NULL, -- টেবিল নাম বা রিসোর্স (clients, memberships, billing_info ...)
    entity_id BIGINT DEFAULT NULL, -- রেকর্ড আইডি
    action ENUM('create','update','delete','login','logout','payment') NOT NULL,
    performed_by VARCHAR(100) DEFAULT NULL, -- user/email/id
    changes JSON DEFAULT NULL, -- কী বদলেছে (JSON)
    ip_address VARCHAR(50) DEFAULT NULL,
    user_agent TEXT DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE INDEX idx_audit_entity ON audit_log (entity_type, entity_id);

/********************************************************************************
  Example triggers (optional helpers)
  - Update gym_owners.total_clients when clients added/removed
  - Insert audit log on membership changes (example)
*********************************************************************************/

/* Trigger: increment total_clients on client insert */
DROP TRIGGER IF EXISTS trg_clients_after_insert;
DELIMITER $$
CREATE TRIGGER trg_clients_after_insert
AFTER INSERT ON clients
FOR EACH ROW
BEGIN
    UPDATE gym_owners SET total_clients = total_clients + 1 WHERE gym_owner_id = NEW.gym_owner_id;
    INSERT INTO audit_log (entity_type, entity_id, action, performed_by, changes)
    VALUES ('clients', NEW.client_id, 'create', CONCAT('system:client_import'), JSON_OBJECT('fullname', NEW.fullname));
END$$
DELIMITER ;

/* Trigger: decrement total_clients on client delete */
DROP TRIGGER IF EXISTS trg_clients_after_delete;
DELIMITER $$
CREATE TRIGGER trg_clients_after_delete
AFTER DELETE ON clients
FOR EACH ROW
BEGIN
    UPDATE gym_owners SET total_clients = GREATEST(0, total_clients - 1) WHERE gym_owner_id = OLD.gym_owner_id;
    INSERT INTO audit_log (entity_type, entity_id, action, performed_by, changes)
    VALUES ('clients', OLD.client_id, 'delete', CONCAT('system:client_removed'), JSON_OBJECT('fullname', OLD.fullname));
END$$
DELIMITER ;

/* Trigger: audit membership updates */
DROP TRIGGER IF EXISTS trg_memberships_after_update;
DELIMITER $$
CREATE TRIGGER trg_memberships_after_update
AFTER UPDATE ON memberships
FOR EACH ROW
BEGIN
    INSERT INTO audit_log (entity_type, entity_id, action, performed_by, changes)
    VALUES ('memberships', NEW.membership_id, 'update', CONCAT('system:membership_update'), JSON_OBJECT('old_end', OLD.end_date, 'new_end', NEW.end_date, 'old_status', OLD.status, 'new_status', NEW.status));
END$$
DELIMITER ;

/********************************************************************************
  SAMPLE QUERIES (JOIN examples)
*********************************************************************************/

/* A) এক ক্লায়েন্টের প্রোফাইল + অ্যাক্টিভ মেম্বারশিপ + শেষ health_data */
-- client profile + active membership + last measured bmi
SELECT c.*, m.plan_name, m.status AS membership_status, h.weight_kg, h.height_cm, h.bmi, h.measured_at
FROM clients c
LEFT JOIN memberships m ON c.client_id = m.client_id AND m.status = 'active'
LEFT JOIN (
    SELECT hd.* FROM health_data hd
    WHERE hd.measured_at = (SELECT MAX(measured_at) FROM health_data WHERE client_id = hd.client_id)
) h ON c.client_id = h.client_id
WHERE c.client_id = 101;

/* B) জিম মালিকের জন্য মোট রেভিনিউ (billing_info) */
SELECT go.gym_owner_id, go.gym_name, SUM(b.total_amount) AS total_revenue
FROM gym_owners go
JOIN clients c ON c.gym_owner_id = go.gym_owner_id
JOIN billing_info b ON b.client_id = c.client_id AND b.payment_status = 'paid'
GROUP BY go.gym_owner_id, go.gym_name;

/* C) আগামী 7 দিনে রিনিউ/পেমেন্ট ডিউ তালিকা */
SELECT b.client_id, c.fullname, b.next_payment_date, b.total_amount
FROM billing_info b
JOIN clients c ON b.client_id = c.client_id
WHERE b.next_payment_date BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 7 DAY)
  AND b.payment_status IN ('unpaid','partial');

/* D) একটি ইভেন্টে বুক করা ক্লায়েন্টদের তালিকা */
SELECT e.title, cp.client_id, cl.fullname, cp.status, cp.paid_amount
FROM gym_events e
JOIN class_participants cp ON e.event_id = cp.event_id
JOIN clients cl ON cp.client_id = cl.client_id
WHERE e.event_id = 10;

/********************************************************************************
  NOTES & RECOMMENDATIONS (বাংলায় সংক্ষেপে)
  - CHECK constraints কিছু MySQL সংস্করণে সীমাবদ্ধ; প্রয়োজনে অ্যাপ লেভেলে ভ্যালিডেশন রাখুন।
  - বড় সিস্টেমে JSON ফিল্ড (plan_features, certifications) দরকারি কিন্তু সার্চের জন্য
    প্রোপার রিলেশনাল টেবিল তৈরি করা উত্তম।
  - ট্যাক্স/ক্যারেন্সি/ইনভয়েসিং-এর জন্য আলাদা সার্ভিস (or microservice) রাখলে ভালো। 
  - ব্যাকআপ, ইন্ডেক্সিং, পুর্বনির্ধারিত রিপোর্টিং (materialized views) ইত্যাদি পরিকল্পনা করুন।
*********************************************************************************/
```

---

যদি চান, আমি এখন থেকে কোনো একটি অংশে (উদাহরণ: পেমেন্ট-ওয়ার্কফ্লো, ইনভয়েস জেনারেশন, অথবা ER-ডায়াগ্রাম (PNG/SVG/ASCII)) আলাদা করে আরও ডিটেইল লিখে দেব — বা এই স্কিমার ওপর ভিত্তি করে আপনার মাইগ্রেশন (ALTER TABLE) স্ক্রিপ্ট বানিয়ে দেব। কিসের ওপর আগাতে চান?
