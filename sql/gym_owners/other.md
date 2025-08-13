ঠিক আছে — এখন আমি আপনার জন্য **জিম রেটিং এবং অন্যান্য সম্পূর্ণ সম্পর্কিত টেবিল স্কিমা** তৈরি করছি, যাতে জিম মালিক, ক্লায়েন্ট, মেম্বারশিপ, সাবস্ক্রিপশন, বিলিং, হেলথ ডেটা, ফিডব্যাক সবকিছু relational ভাবে সম্পূর্ণ থাকে।

---

## **1. Gym Ratings Table**

```sql
-- টেবিল: gym_ratings
-- উদ্দেশ্য: ক্লায়েন্টরা জিম এবং ট্রেইনারদের রেটিং ও ফিডব্যাক দিতে পারে
CREATE TABLE gym_ratings (
    rating_id BIGINT AUTO_INCREMENT PRIMARY KEY, -- ইউনিক রেটিং আইডি
    gym_owner_id BIGINT NOT NULL, -- কোন জিমের জন্য রেটিং
    client_id BIGINT NOT NULL, -- কোন ক্লায়েন্ট রেটিং দিলো
    rating INT NOT NULL CHECK (rating BETWEEN 1 AND 5), -- রেটিং (1-5)
    feedback TEXT DEFAULT NULL, -- ফিডব্যাক কমেন্ট
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- রেটিং দেওয়ার সময়
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, -- সর্বশেষ আপডেট সময়
    
    -- ফরেন কি
    FOREIGN KEY (gym_owner_id) REFERENCES gym_owners(gym_owner_id) ON DELETE CASCADE,
    FOREIGN KEY (client_id) REFERENCES clients(client_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ইনডেক্স
CREATE INDEX idx_gym_ratings_gym ON gym_ratings (gym_owner_id);
CREATE INDEX idx_gym_ratings_client ON gym_ratings (client_id);
```

---

## **2. Trainer Table (Optional, if gyms have trainers)**

```sql
CREATE TABLE trainers (
    trainer_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    gym_owner_id BIGINT NOT NULL, -- কোন জিমে কাজ করছে
    fullname VARCHAR(100) NOT NULL,
    email VARCHAR(100) DEFAULT NULL,
    mobile_number VARCHAR(20) DEFAULT NULL,
    specialization VARCHAR(100) DEFAULT NULL, -- যেমন: weight training, yoga
    experience_years INT DEFAULT 0,
    status ENUM('active', 'inactive', 'suspended') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (gym_owner_id) REFERENCES gym_owners(gym_owner_id) ON DELETE CASCADE
);
```

---

## **3. Client Attendance Table**

```sql
CREATE TABLE client_attendance (
    attendance_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    client_id BIGINT NOT NULL,
    gym_owner_id BIGINT NOT NULL,
    attendance_date DATE NOT NULL,
    check_in_time TIME DEFAULT NULL,
    check_out_time TIME DEFAULT NULL,
    notes TEXT DEFAULT NULL,
    
    FOREIGN KEY (client_id) REFERENCES clients(client_id) ON DELETE CASCADE,
    FOREIGN KEY (gym_owner_id) REFERENCES gym_owners(gym_owner_id) ON DELETE CASCADE
);

CREATE INDEX idx_attendance_client ON client_attendance(client_id);
CREATE INDEX idx_attendance_gym ON client_attendance(gym_owner_id);
CREATE INDEX idx_attendance_date ON client_attendance(attendance_date);
```

---

## **4. Supplement/Products Table (Optional)**

```sql
CREATE TABLE supplements (
    supplement_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    gym_owner_id BIGINT NOT NULL,
    name VARCHAR(100) NOT NULL,
    type ENUM('protein', 'vitamin', 'pre-workout', 'other') DEFAULT 'other',
    price DECIMAL(10,2) NOT NULL,
    stock INT DEFAULT 0,
    description TEXT DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (gym_owner_id) REFERENCES gym_owners(gym_owner_id) ON DELETE CASCADE
);
```

---

## **5. Gym Events / Classes Table (Optional)**

```sql
CREATE TABLE gym_events (
    event_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    gym_owner_id BIGINT NOT NULL,
    title VARCHAR(100) NOT NULL,
    description TEXT DEFAULT NULL,
    start_datetime DATETIME NOT NULL,
    end_datetime DATETIME NOT NULL,
    max_participants INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (gym_owner_id) REFERENCES gym_owners(gym_owner_id) ON DELETE CASCADE
);
```

---

## **6. ERD সম্পর্কের সংক্ষিপ্ত সংযোগ**

* **gym\_owners** — মূল টেবিল, প্রতিটি জিম মালিক।
* **clients** — gym\_owner\_id রেফারেন্স।
* **memberships** — client\_id রেফারেন্স, billing\_info বা subscriptions এর সাথে joinable।
* **billing\_info** — client\_id রেফারেন্স।
* **subscriptions** — client\_id রেফারেন্স।
* **skeletal\_muscles**, **subcutaneous\_fat**, **health\_data** — client\_id রেফারেন্স।
* **gym\_ratings** — client\_id + gym\_owner\_id রেফারেন্স।
* **trainers** — gym\_owner\_id রেফারেন্স।
* **client\_attendance** — client\_id + gym\_owner\_id রেফারেন্স।
* **supplements** — gym\_owner\_id রেফারেন্স।
* **gym\_events** — gym\_owner\_id রেফারেন্স।

---

💡 **সম্পূর্ণ সিস্টেম ফিচার আইডিয়া:**

1. **Gym Ratings:** রেটিং ও ফিডব্যাক ট্র্যাক করে Average rating বের করা যাবে।
2. **Client Attendance:** Check-in/check-out ট্র্যাক করে মাসিক রিপোর্ট।
3. **Trainers & Events:** Gym activity ও ক্লাস ম্যানেজমেন্ট।
4. **Supplements & Billing:** ইনভয়েস, পেমেন্ট, ও প্রোডাক্ট সেল ট্র্যাক।
5. **Health Data Integration:** Subcutaneous fat, skeletal muscles, bmi ইত্যাদি সম্পূর্ণ ক্লায়েন্ট হেলথ ডেটা।

---

আমি চাইলে এখনই **এই সমস্ত টেবিলের জন্য এক সম্পূর্ণ relational ERD + JOIN কুয়েরি উদাহরণ** বানাতে পারি, যা দিয়ে জিম ম্যানেজমেন্ট সিস্টেম enterprise-ready হবে।

আপনি কি সেটা দেখতে চান?
