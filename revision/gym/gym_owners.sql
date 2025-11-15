-- টেবিল: gym_owners
-- উদ্দেশ্য: জিম মালিকদের সম্পূর্ণ তথ্য, অ্যাকাউন্ট, সাবস্ক্রিপশন, পেমেন্ট, এবং অডিট ট্র্যাকিং
CREATE TABLE
    gyms (
        gym_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        fullname VARCHAR(100) NOT NULL,
        email VARCHAR(100) NOT NULL UNIQUE,
        phone VARCHAR(20) NOT NULL UNIQUE,
        gender ENUM ('male', 'female', 'other') DEFAULT NULL,
        dob DATE DEFAULT NULL,
        gym_name VARCHAR(150) NOT NULL,
        address TEXT DEFAULT NULL,
        about TEXT DEFAULT NULL,
        gym_type VARCHAR(100) DEFAULT NULL,
        postal_code VARCHAR(20) DEFAULT NULL,
        country VARCHAR(50) DEFAULT NULL,
        district VARCHAR(50) DEFAULT NULL,
        lat INT DEFAULT NULL,
        lng INT DEFAULT NULL,
        state VARCHAR(50) DEFAULT NULL,
        total_clients INT DEFAULT 0,
        plan_features JSON DEFAULT NULL,
        status ENUM (
            'active',
            'inactive',
            'paused',
            'suspended',
            'banned'
        ) DEFAULT 'active',
        verification_status ENUM (
            'non_verified',
            'verified',
            'fully_verified',
            'suspicious'
        ) NOT NULL DEFAULT 'non_verified',
        subscription_plan ENUM ('basic', 'premium', 'enterprise', 'custom') DEFAULT 'basic',
        subscription_start DATE DEFAULT NULL,
        subscription_end DATE DEFAULT NULL,
        auto_renew BOOLEAN DEFAULT FALSE,
        payment_method ENUM (
            'cash',
            'card',
            'bank_transfer',
            'upi',
            'wallet',
            'cheque'
        ) DEFAULT NULL,
        last_payment_date DATE DEFAULT NULL,
        next_payment_due DATE DEFAULT NULL,
        payment_status ENUM (
            'paid',
            'unpaid',
            'partial',
            'overdue',
            'refunded'
        ) DEFAULT 'unpaid',
        hashed VARCHAR(255) DEFAULT NULL,
        salt VARCHAR(255) DEFAULT NULL,
        two_factor_enabled BOOLEAN DEFAULT FALSE,
        last_login TIMESTAMP NULL DEFAULT NULL,
        failed_login_attempts INT DEFAULT 0,
        avatar VARCHAR(255) DEFAULT NULL,
        logo_url VARCHAR(255) DEFAULT NULL,
        -- gym trial
        trial_price DECIMAL(10, 2) DEFAULT 300,
        --
        invoice_prefix VARCHAR(20) DEFAULT 'GYM',
        --new
        tagline VARCHAR(500) DEFAULT NULL,
        description TEXT DEFAULT NULL,
        website VARCHAR(200) DEFAULT NULL,
        operating_hours JSON DEFAULT NULL, -- Example: {"mon":"9.00AM-5.00PM","tue":"9.00AM-5.00PM"}
        social_media JSON DEFAULT NULL, -- Example: {"facebook":"url","instagram":"url"}
        facilities JSON DEFAULT NULL, -- Example: ["wifi","parking","cafe"]
        --new
        notes TEXT DEFAULT NULL,
        registered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        last_visit TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        CONSTRAINT chk_mobile_length_gyms CHECK (CHAR_LENGTH(mobile_number) BETWEEN 7 AND 20),
        CONSTRAINT chk_email_format_gyms CHECK (email LIKE '%_@_%._%'),
        CONSTRAINT chk_subscription_dates_gyms CHECK (subscription_end >= subscription_start)
    ) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- Gym feedback table
CREATE TABLE
    gym_feedbacks (
        feedback_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        gym_id BIGINT UNSIGNED NOT NULL,
        client_id BIGINT UNSIGNED DEFAULT NULL, -- Client giving the feedback
        trainer_id BIGINT UNSIGNED DEFAULT NULL, -- Trainer giving the feedback
        rating TINYINT UNSIGNED NOT NULL CHECK (rating BETWEEN 1 AND 5),
        comment TEXT DEFAULT NULL,
        reply TEXT DEFAULT NULL,
        video_url VARCHAR(255) DEFAULT NULL,
        feedback_type ENUM ('client', 'trainer') NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (gym_id) REFERENCES gyms (gym_id) ON DELETE CASCADE,
        FOREIGN KEY (client_id) REFERENCES clients (client_id) ON DELETE SET NULL,
        FOREIGN KEY (trainer_id) REFERENCES trainers (trainer_id) ON DELETE SET NULL
    ) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- tagline, description, webiste, operating hours, social media(facebook, instagram, twitter/x, facilities
-- পারফরম্যান্স ইনডেক্স
CREATE INDEX idx_gym_owners_status ON gym_owners (status);

CREATE INDEX idx_gym_owners_subscription_end ON gym_owners (subscription_end);

CREATE INDEX idx_gym_owners_city ON gym_owners (city);

CREATE INDEX idx_gym_owners_plan ON gym_owners (subscription_plan);

CREATE TABLE
    gym_unavailability (
        id INT AUTO_INCREMENT PRIMARY KEY,
        gym_id BIGINT UNSIGNED NOT NULL,
        year INT NOT NULL,
        month INT NOT NULL,
        reason TEXT DEFAULT NULL,
        day INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE (gym_id, year, month, day),
        FOREIGN KEY (gym_id) REFERENCES gyms (gym_id) ON DELETE CASCADE ON UPDATE CASCADE
    );

```
INSERT INTO gym_unavailability (gym_id, year, month, day, reason)
VALUES
(1, 2025, 5, 1, 'May Day'),
(1, 2025, 5, 10, 'Floor Repair'),
(1, 2025, 6, 20, 'AC Maintenance'),
(1, 2025, 7, 4, 'Staff Training'),
(1, 2025, 12, 25, 'Christmas');

``` ```
-- 1. Client feedback - overall great gym
INSERT INTO gym_feedbacks (gym_id, client_id, rating, comment, feedback_type)
VALUES (1, 1, 5, 'Excellent facilities and clean environment!', 'client');

-- 2. Trainer feedback - good management
INSERT INTO gym_feedbacks (gym_id, trainer_id, rating, comment, feedback_type)
VALUES (1, 1, 4, 'Management is supportive and the equipment is well-maintained.', 'trainer');

-- 3. Client feedback - suggested improvement
INSERT INTO gym_feedbacks (gym_id, client_id, rating, comment, feedback_type)
VALUES (1, 1, 3, 'Good gym but needs more cardio machines during rush hours.', 'client');

-- 4. Client feedback - with video
INSERT INTO gym_feedbacks (gym_id, client_id, rating, comment, video_url, feedback_type)
VALUES (1, 1, 5, 'Sharing my progress video after 6 weeks!', '/uploads/feedbacks/client1_progress.mp4', 'client');

-- 5. Trainer feedback - mentioning hygiene
INSERT INTO gym_feedbacks (gym_id, trainer_id, rating, comment, feedback_type)
VALUES (1, 1, 4, 'Clean and well-ventilated, clients are happy with hygiene.', 'trainer');

-- 6. Client feedback - with gym reply
INSERT INTO gym_feedbacks (gym_id, client_id, rating, comment, reply, feedback_type)
VALUES (1, 1, 2, 'AC not working properly in evening sessions.', 'We have scheduled AC maintenance tomorrow. Thanks for reporting!', 'client');

-- 7. Trainer feedback - low rating (equipment issue)
INSERT INTO gym_feedbacks (gym_id, trainer_id, rating, comment, feedback_type)
VALUES (1, 1, 2, 'Some dumbbells are loose and need replacement.', 'trainer');

-- 8. Client feedback - praising trainer
INSERT INTO gym_feedbacks (gym_id, client_id, trainer_id, rating, comment, feedback_type)
VALUES (1, 1, 1, 5, 'Trainer helped me achieve my goals faster, very motivating!', 'client');

-- 9. Client feedback - general note
INSERT INTO gym_feedbacks (gym_id, client_id, rating, comment, feedback_type)
VALUES (1, 1, 4, 'Music playlist could be more energetic but overall great vibe.', 'client');

-- 10. Trainer feedback - with reply
INSERT INTO gym_feedbacks (gym_id, trainer_id, rating, comment, reply, feedback_type)
VALUES (1, 1, 5, 'Love working here. The staff and clients make it feel like home.',
        'Thank you for your dedication to our clients!', 'trainer');
```