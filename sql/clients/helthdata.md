শानदार — নিচে আমি **আরও বিস্তৃত**, **ডিটেইল্ড** অংশগুলো যোগ করলাম: `subcutaneous_fat`, `skeletal_muscles`, `body_composition_raw` (JSON), `followup_tasks`, `assessment_templates` টেবিল, আরও স্টোরড প্রসিডিউর/ট্রিগার, আর্কাইভিং ও পার্টিশনিং উদাহরণ, ও অনেক দরকারী স্যাম্পল `INSERT` / `SELECT` কুয়েরি। সবকিছু **বাংলা ইনলাইন কমেন্ট** সহ দেয়া আছে — তুমি চাইলে এগুলো সরাসরি ব্যবহার করতে পারবে বা কাস্টমাইজ করতে পারবে।

---

## ১) `subcutaneous_fat` টেবিল (বাংলা ইনলাইন কমেন্টসহ)

```sql
CREATE TABLE subcutaneous_fat (
    sub_fat_id BIGINT AUTO_INCREMENT PRIMARY KEY, -- ইউনিক আইডি
    health_id BIGINT NULL COMMENT 'যদি health_data রেকর্ড এর সাথে লিংক রাখতে চাও',
    client_id BIGINT NOT NULL COMMENT 'কোন ক্লায়েন্টের ডেটা',
    measurement_date DATE NOT NULL COMMENT 'রেকর্ডের মাপ নেওয়ার তারিখ',
    whole_body_percent DECIMAL(5,2) COMMENT 'শরীর মোট সাবকিউটেনাস ফ্যাট (%)',
    trunk_percent DECIMAL(5,2) COMMENT 'ট্রাঙ্ক সাবকিউটেনাস ফ্যাট (%)',
    arms_percent DECIMAL(5,2) COMMENT 'বাহুর সাবকিউটেনাস ফ্যাট (%)',
    legs_percent DECIMAL(5,2) COMMENT 'পায়ের সাবকিউটেনাস ফ্যাট (%)',
    notes VARCHAR(500) DEFAULT NULL COMMENT 'অতিরিক্ত নোট',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_subfat_client FOREIGN KEY (client_id) REFERENCES clients(client_id) ON DELETE CASCADE,
    CONSTRAINT fk_subfat_health FOREIGN KEY (health_id) REFERENCES health_data(health_id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='সাবকিউটেনাস ফ্যাট সেগমেন্ট ডেটা';
```

**ইনডেক্সিং:**

```sql
CREATE INDEX idx_subfat_client_date ON subcutaneous_fat (client_id, measurement_date);
```

---

## ২) `skeletal_muscles` টেবিল (বাংলা ইনলাইন কমেন্টসহ)

```sql
CREATE TABLE skeletal_muscles (
    skeletal_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    health_id BIGINT NULL COMMENT 'health_data রেকর্ড রেফার করা যেতে পারে',
    client_id BIGINT NOT NULL,
    measurement_date DATE NOT NULL,
    whole_body_percent DECIMAL(5,2) COMMENT 'মোট স্কেলেটাল মাসল (%)',
    trunk_percent DECIMAL(5,2) COMMENT 'ট্রাঙ্ক মাসল (%)',
    arms_percent DECIMAL(5,2) COMMENT 'বাহু মাসল (%)',
    legs_percent DECIMAL(5,2) COMMENT 'পা মাসল (%)',
    notes VARCHAR(500) DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_skeletal_client FOREIGN KEY (client_id) REFERENCES clients(client_id) ON DELETE CASCADE,
    CONSTRAINT fk_skeletal_health FOREIGN KEY (health_id) REFERENCES health_data(health_id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='স্কেলেটাল মাসল সেগমেন্ট ডেটা';
```

**ইনডেক্স:**

```sql
CREATE INDEX idx_skeletal_client_date ON skeletal_muscles (client_id, measurement_date);
```

---

## ৩) `body_composition_raw` (JSON রাও ডেটা রাখার জন্য `health_data`-এ এড করা ফিল্ড)

আগে দেয়া `health_data` টেবিলে একটি কলাম যোগ কর:

```sql
ALTER TABLE health_data
ADD COLUMN body_composition_raw JSON NULL COMMENT 'ডিভাইস থেকে আসা রাও JSON ডেটা, যেমন segment-wise measurements, impedance readings ইত্যাদি';
```

> JSON-এ রাও ডেটা রাখলে ভবিষ্যতে ডিভাইস ভিন্ন ধরনে ডেটা দিলেও তুমি খুজে নিতে এবং প্রক্রিয়া করতে পারবে।

**নমুনা JSON (উদাহরণ):**

```json
{
  "device":"inbody-270",
  "segments": {
    "right_arm": {"muscle_kg":3.5, "fat_percent":12.0},
    "left_arm": {"muscle_kg":3.4, "fat_percent":11.8},
    "trunk": {"muscle_kg":30.5, "fat_percent":18.2},
    "right_leg": {"muscle_kg":10.2, "fat_percent":14.0},
    "left_leg": {"muscle_kg":10.1, "fat_percent":13.9}
  },
  "impedance": {"right_arm":400, "left_arm":402}
}
```

---

## ৪) `followup_tasks` টেবিল (ট্রেনার/স্টাফদের জন্য টাস্ক ও রিমাইন্ডার)

```sql
CREATE TABLE followup_tasks (
    task_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    client_id BIGINT NOT NULL COMMENT 'যার জন্য টাস্ক',
    assigned_to_user_id BIGINT DEFAULT NULL COMMENT 'টাস্ক যে স্টাফ/ট্রেইনারকে দেয়া হয়েছে',
    task_title VARCHAR(255) NOT NULL COMMENT 'টাস্ক হেডলাইন',
    task_description TEXT COMMENT 'বিস্তারিত টাস্ক বর্ণনা',
    due_date DATE DEFAULT NULL COMMENT 'মেয়াদ',
    priority ENUM('low','medium','high') DEFAULT 'medium',
    status ENUM('pending','in_progress','completed','cancelled') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    CONSTRAINT fk_task_client FOREIGN KEY (client_id) REFERENCES clients(client_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='ক্লায়েন্ট ফলোআপ টাস্ক/রিমাইন্ডার';
```

**কিছু ইউজফুল কুয়েরি উদাহরণ:**

* আজকের ডিউ টাস্ক:

```sql
SELECT * FROM followup_tasks WHERE due_date = CURDATE() AND status <> 'completed';
```

* একটি স্টাফের ওপেন টাস্ক:

```sql
SELECT * FROM followup_tasks WHERE assigned_to_user_id = 7 AND status IN ('pending','in_progress');
```

---

## ৫) `assessment_templates` টেবিল (ভিন্ন ধরনের অ্যাসেসমেন্ট টেমপ্লেট সংরক্ষণ করার জন্য)

```sql
CREATE TABLE assessment_templates (
    template_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    gym_owner_id BIGINT DEFAULT NULL COMMENT 'গিম স্পেসিফিক টেমপ্লেট হলে লিংক করা যাবে',
    template_name VARCHAR(255) NOT NULL,
    description TEXT DEFAULT NULL,
    schema_json JSON NOT NULL COMMENT 'অ্যাসেসমেন্ট ফিল্ডস ও ভ্যালিডেশন বিবরণ (JSON)',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='অ্যাসেসমেন্ট / রিপোর্ট টেমপ্লেট সংরক্ষণ';
```

**উদাহরণ `schema_json`:**

```json
{
  "fields": [
    {"name":"weight_kg", "type":"decimal", "required":true},
    {"name":"height_cm", "type":"decimal", "required":true},
    {"name":"blood_pressure", "type":"string", "required":false},
    {"name":"notes", "type":"text", "required":false}
  ]
}
```

---

## ৬) আরও স্টোরড প্রসিডিউর — `sp_update_health_with_validation` (বিস্তৃত ভ্যালিডেশন সহ)

```sql
DELIMITER $$
CREATE PROCEDURE sp_update_health_with_validation(
    IN p_health_id BIGINT,
    IN p_weight DECIMAL(6,2),
    IN p_height DECIMAL(6,2),
    IN p_bmi DECIMAL(5,2),
    IN p_measurement_date DATE,
    IN p_recorded_by BIGINT
)
BEGIN
    DECLARE v_exists INT DEFAULT 0;
    DECLARE v_calc_bmi DECIMAL(5,2);

    SELECT COUNT(*) INTO v_exists FROM health_data WHERE health_id = p_health_id;
    IF v_exists = 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Health record not found';
    END IF;

    IF p_height IS NULL OR p_height <= 0 THEN
        SET v_calc_bmi = NULL;
    ELSE
        SET v_calc_bmi = ROUND(p_weight / POWER(p_height/100, 2), 2);
    END IF;

    -- যদি caller BMI দেয় NULL, তাহলে ক্যালকুলেট করা BMI ব্যবহার করব; অন্যথায় provided BMI ধরে নেব
    IF p_bmi IS NULL THEN
        SET p_bmi = v_calc_bmi;
    END IF;

    UPDATE health_data
    SET weight_kg = p_weight,
        height_cm = p_height,
        bmi = p_bmi,
        measurement_date = p_measurement_date,
        recorded_by_user_id = p_recorded_by,
        updated_at = CURRENT_TIMESTAMP
    WHERE health_id = p_health_id;
END$$
DELIMITER ;
```

**কলে:**

```sql
CALL sp_update_health_with_validation(10, 74.2, 176.0, NULL, '2025-08-13', 5);
```

---

## ৭) Soft-delete ও আর্কাইভ ট্রিগার উদাহরণ

**`is_active` কে false করে soft-delete করার জন্য স্টোরড প্রসিডিউর:**

```sql
DELIMITER $$
CREATE PROCEDURE sp_soft_delete_health(
    IN p_health_id BIGINT,
    IN p_deleted_by BIGINT
)
BEGIN
    UPDATE health_data SET is_active = FALSE, updated_at = CURRENT_TIMESTAMP WHERE health_id = p_health_id;

    INSERT INTO health_data_history (health_id, client_id, change_type, changed_by_user_id, old_data, new_data)
    SELECT h.health_id, h.client_id, 'delete', p_deleted_by,
        JSON_OBJECT('weight_kg', h.weight_kg, 'bmi', h.bmi, 'measurement_date', h.measurement_date),
        NULL
    FROM health_data h WHERE h.health_id = p_health_id;
END$$
DELIMITER ;
```

---

## ৮) আর্কাইভিং (auto-move old records into archive table) — উদাহরণ ট্রিগার না; বরং ব্যাচজব ব্যবহার করুন

বড় ডেটা সেটে ট্রিগার সমস্যাজনক হতে পারে; তাই মাসিক cron/ETL জব বানিয়ে পুরোনো রেকর্ড `health_data_archive` এ স্থানান্তর করা ভাল। উদাহরণ টেবিল:

```sql
CREATE TABLE health_data_archive LIKE health_data;
ALTER TABLE health_data_archive ADD COLUMN archived_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
```

**ব্য়াচ SQL (monthly job):**

```sql
INSERT INTO health_data_archive SELECT *, NULL FROM health_data WHERE measurement_date < DATE_SUB(CURDATE(), INTERVAL 3 YEAR);
DELETE FROM health_data WHERE measurement_date < DATE_SUB(CURDATE(), INTERVAL 3 YEAR);
```

---

## ৯) পার্টিশনিং উদাহরণ (বড় টেবিলের জন্য — MySQL রেঞ্জ পার্টিশন)

> নোট: MySQL পার্টিশন করার জন্য টেবিল must be `RANGE` column এবং কয়েকটি রেস্ট্রিকশন আছে। নিচে `measurement_date` অনুযায়ী পার্টিশনিং উদাহরণ:

```sql
CREATE TABLE health_data_partitioned (
    health_id BIGINT NOT NULL,
    client_id BIGINT NOT NULL,
    weight_kg DECIMAL(6,2),
    measurement_date DATE,
    -- অন্যান্য কলাম...
    PRIMARY KEY (health_id, measurement_date)
) ENGINE=InnoDB
PARTITION BY RANGE ( YEAR(measurement_date) ) (
    PARTITION p2022 VALUES LESS THAN (2023),
    PARTITION p2023 VALUES LESS THAN (2024),
    PARTITION p2024 VALUES LESS THAN (2025),
    PARTITION pmax VALUES LESS THAN (MAXVALUE)
);
```

> পার্টিশনিং পরিকল্পনা তোমার ডেটা ভলিউম, রিটেনশন পলিসি ও ব্যাকআপ স্ট্র্যাটেজির উপর নির্ভর করবে।

---

## ১০) স্যাম্পল INSERTs (ডেমো)

```sql
-- নতুন health_data ইনসার্ট (manual)
INSERT INTO health_data (client_id, weight_kg, height_cm, fat_kg, visceral_fat_percent, resting_metabolism_kcal, measurement_date, bmi, body_composition_raw, recorded_by_user_id, report_source)
VALUES (123, 72.50, 175.00, 10.50, 8.5, 1500, '2025-08-13', ROUND(72.50 / POWER(1.75,2),2),
'{"device":"inbody-270","segments":{"right_arm":{"muscle_kg":3.5}}}', 5, 'manual');

-- subcutaneous_fat উদাহরণ
INSERT INTO subcutaneous_fat (health_id, client_id, measurement_date, whole_body_percent, trunk_percent, arms_percent, legs_percent, notes)
VALUES (LAST_INSERT_ID(), 123, '2025-08-13', 18.2, 17.5, 12.0, 14.3, 'প্রাথমিক মাপ');
```

---

## ১১) আরো ইউটিলিটি SELECT কুয়েরি (প্র্যাকটিক্যাল)

* ক্লায়েন্টের সাম্প্রতিক 3 রেকর্ড:

```sql
SELECT * FROM health_data WHERE client_id = 123 ORDER BY measurement_date DESC LIMIT 3;
```

* কোনও ক্লায়েন্টের সর্বোচ্চ BMI কখন হয়েছে:

```sql
SELECT measurement_date, bmi FROM health_data WHERE client_id = 123 ORDER BY bmi DESC LIMIT 1;
```

* ট্রেনারকে আজকের ফলোআপ টাস্ক ইমেইল/নোটিফাই করার জন্য:

```sql
SELECT t.*, c.name, c.mobile_number
FROM followup_tasks t
JOIN clients c ON t.client_id = c.client_id
WHERE t.due_date = CURDATE() AND t.status <> 'completed';
```

---

## ১২) গোপনীয়তা, কমপ্লায়েন্স ও অপারেশনাল পরামর্শ (আরও ডিটেইলড)

1. **PII রেকর্ডিং নীতি** — ক্লায়েন্টের নাম, মোবাইল, ইমেইল সংরক্ষণ করলে রোল-বেইজড অ্যাক্সেস ও লগিং নিশ্চিত করো।
2. **Audit Trails** — `health_data_history` সব পরিবর্তন রাখবে; রোল-ভিত্তিক রিপোর্টিং করার ক্ষেত্রে এই ইতিহাস টেবিল লাগবে।
3. **Retention & Deletion** — স্বয়ংক্রিয় আরকাইভিং + soft-delete। কাস্টমারের রিকোয়েস্টে ডাটা প্যার্সনাল ডিলিট করতে পারো (GDPR/স্থানীয় আইন অনুসারে)।
4. **Backups** — নিয়মিত ব্যাকআপ + point-in-time recovery (PITR) কনফিগার করা উচিত।
5. **Encryption** — DB at-rest encryption, এবং API-তে TLS (in-transit) বাধ্যতামূলক।
6. **Access logging** — sensitive data read operations লেজার করা উচিত (who, when, what) — security audit এর জন্য অপরিহার্য।
7. **Rate-limiting** — ডিভাইস সাইনাল বা sync endpoint এ rate-limit বসাতে হবে যাতে মালফাংশন হলে DB overload না হয়।

---

## ১৩) পরবর্তী সুপারিশ — ER ডায়াগ্রাম, ইনডেক্স প্ল্যান ও কনসোলিডেটেড API রুটস

* আমি তোমার জন্য **ER ডায়াগ্রাম (textual বা PNG/SVG)** তৈরি করতে পারি— এটা দেখাবে কিভাবে `clients`, `health_data`, `subcutaneous_fat`, `skeletal_muscles`, `followup_tasks`, `invoices` ইত্যাদি যুক্ত থাকবে।
* এছাড়াও **প্রস্তাবিত ইনডেক্স প্ল্যান** দেব যাতে রিপোর্টিং কুয়েরি (monthly trends, cohort analysis) দ্রুত হয়।
* এবং একটি **API contract (JSON)** দেবে — যা থেকে তুমি ফ্রন্টএন্ড/মোবাইল এবং ডিভাইস-ইন্টিগ্রেশন সহজে করতে পারবে (উদাহরণ: `POST /clients/:id/health` payload schema ইত্যাদি)।

---

তুমি চাইলে আমি এখনই:

1. ER ডায়াগ্রাম (SVG/PNG) বানিয়ে দেব,
2. বা API schema (OpenAPI / Swagger) তৈরি করে দেব,
3. নাকি `health_data` + সব সম্পর্কিত টেবিলের জন্য **পূর্ণ migration SQL স্ক্রিপ্ট** (one-file) তৈরি করে দেব।

বলো কোনটা আগে করে দিতে হবে — আমি যেন তোমার জন্য তা ফুলল করে দিতে পারি।
