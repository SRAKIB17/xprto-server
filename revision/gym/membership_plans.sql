CREATE TABLE
    membership_plans (
        plan_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        gym_id BIGINT UNSIGNED NOT NULL,
        slug VARCHAR(150) NOT NULL UNIQUE,
        title VARCHAR(150) NOT NULL,
        description TEXT,
        billing_cycle ENUM (
            'daily',
            'weekly',
            'monthly',
            'quarterly',
            'half_yearly',
            'yearly',
            'one_time'
        ) NOT NULL DEFAULT 'monthly',
        duration_days INT DEFAULT NULL COMMENT 'Custom plan duration in days, overrides billing_cycle if set',
        price DECIMAL(10, 2) NOT NULL COMMENT 'Base price per billing cycle',
        discount_percent DECIMAL(5, 2) DEFAULT 0.00 COMMENT 'Optional discount percentage',
        currency VARCHAR(10) DEFAULT 'INR',
        trial_days INT DEFAULT 0 COMMENT 'Trial period before billing starts',
        has_trainer TINYINT (1) DEFAULT 0 COMMENT 'Whether trainer support is included',
        trainer_type ENUM ('none', 'general', 'personal', 'pro') DEFAULT 'none' COMMENT 'Type of trainer included',
        self_training_allowed TINYINT (1) DEFAULT 1 COMMENT 'If clients can train without trainer assistance',
        is_pro_plan TINYINT (1) DEFAULT 0 COMMENT 'Marks plan as premium/pro-level',
        facilities JSON DEFAULT NULL COMMENT 'List of included facilities (e.g., ["Sauna", "Pool", "Locker", "Diet Consultation"])',
        features JSON DEFAULT NULL COMMENT 'List of plan features (e.g., ["Progress Tracking", "Group Classes", "Personalized Diet"])',
        included_classes JSON DEFAULT NULL COMMENT 'Included fitness classes like ["Zumba", "Yoga", "HIIT"]',
        visibility ENUM ('public', 'private', 'draft') DEFAULT 'public',
        active TINYINT (1) DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY uk_gym_slug (gym_id, slug),
        FOREIGN KEY (gym_id) REFERENCES gyms (gym_id) ON DELETE CASCADE
    ) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

```
-- 1️⃣ Basic Monthly Plan
INSERT INTO membership_plans (
    gym_id, slug, title, description, billing_cycle, price, 
    trainer_type, has_trainer, self_training_allowed, is_pro_plan,
    facilities, features, included_classes
) VALUES (
    1, 'basic-monthly', 'Basic Monthly Plan', 
    'Ideal for beginners with access to gym floor and locker.',
    'monthly', 999.00,
    'none', 0, 1, 0,
    JSON_ARRAY('Locker Access', 'Drinking Water'),
    JSON_ARRAY('Self Training', 'Basic Equipment Access'),
    JSON_ARRAY('Zumba', 'Stretching')
);

-- 2️⃣ Standard Quarterly Plan
INSERT INTO membership_plans (
    gym_id, slug, title, description, billing_cycle, price, discount_percent,
    trainer_type, has_trainer, self_training_allowed, is_pro_plan, 
    facilities, features, included_classes
) VALUES (
    1, 'standard-quarterly', 'Standard 3-Month Plan', 
    'Includes full equipment access and basic trainer guidance.',
    'quarterly', 2499.00, 5.00,
    'general', 1, 1, 0,
    JSON_ARRAY('Locker', 'Filtered Water', 'Changing Room'),
    JSON_ARRAY('General Trainer Access', 'Progress Tracking', 'Diet Tips'),
    JSON_ARRAY('Zumba', 'Cardio Blast')
);

-- 3️⃣ Fitness Plus Half-Yearly Plan
INSERT INTO membership_plans (
    gym_id, slug, title, description, billing_cycle, price, discount_percent,
    trainer_type, has_trainer, self_training_allowed, is_pro_plan,
    facilities, features, included_classes
) VALUES (
    1, 'fitness-plus-half-yearly', 'Fitness Plus Half-Yearly Plan', 
    'Balanced program for consistent fitness improvement.',
    'half_yearly', 4999.00, 8.00,
    'general', 1, 1, 0,
    JSON_ARRAY('Locker', 'Sauna Access', 'Filtered Water'),
    JSON_ARRAY('Progress Report', 'Diet Consultation', 'Monthly Measurement'),
    JSON_ARRAY('Yoga', 'Cardio', 'HIIT')
);

-- 4️⃣ Premium Monthly Plan
INSERT INTO membership_plans (
    gym_id, slug, title, description, billing_cycle, price,
    trainer_type, has_trainer, self_training_allowed, is_pro_plan,
    facilities, features, included_classes
) VALUES (
    1, 'premium-monthly', 'Premium Monthly Plan', 
    'Includes personal trainer, diet plan, and sauna access.',
    'monthly', 2499.00,
    'personal', 1, 1, 1,
    JSON_ARRAY('Locker', 'Sauna', 'Diet Consultation', 'Steam Room'),
    JSON_ARRAY('Personal Trainer', 'Progress Tracking', 'Custom Diet Plan'),
    JSON_ARRAY('HIIT', 'CrossFit', 'Yoga')
);

-- 5️⃣ Pro Annual Plan
INSERT INTO membership_plans (
    gym_id, slug, title, description, billing_cycle, price, discount_percent,
    trainer_type, has_trainer, self_training_allowed, is_pro_plan,
    facilities, features, included_classes
) VALUES (
    1, 'pro-annual', 'Pro Annual Elite Plan',
    'Exclusive 12-month package with pro trainers and full facility access.',
    'yearly', 14999.00, 12.00,
    'pro', 1, 1, 1,
    JSON_ARRAY('Private Locker', 'Pool', 'Steam Room', 'Massage Room', 'Diet Lounge'),
    JSON_ARRAY('Dedicated Pro Trainer', 'Advanced Body Analysis', 'Priority Equipment Access'),
    JSON_ARRAY('CrossFit', 'Zumba', 'Pilates', 'Powerlifting')
);

-- 6️⃣ Student Monthly Plan
INSERT INTO membership_plans (
    gym_id, slug, title, description, billing_cycle, price, discount_percent,
    trainer_type, has_trainer, self_training_allowed, is_pro_plan,
    facilities, features, included_classes
) VALUES (
    1, 'student-monthly', 'Student Saver Plan',
    'Affordable plan for students with self-training mode.',
    'monthly', 699.00, 0.00,
    'none', 0, 1, 0,
    JSON_ARRAY('Locker Access', 'Water Facility'),
    JSON_ARRAY('Self Workout', 'Basic Equipment', 'Study-friendly Timings'),
    JSON_ARRAY('Zumba', 'Stretching')
);

-- 7️⃣ Corporate Wellness Plan
INSERT INTO membership_plans (
    gym_id, slug, title, description, billing_cycle, price, discount_percent,
    trainer_type, has_trainer, self_training_allowed, is_pro_plan,
    facilities, features, included_classes
) VALUES (
    1, 'corporate-wellness', 'Corporate Wellness Package',
    'Tailored for companies offering employee wellness programs.',
    'quarterly', 5999.00, 10.00,
    'personal', 1, 1, 1,
    JSON_ARRAY('Steam Room', 'Locker', 'Cafeteria', 'Corporate Lounge'),
    JSON_ARRAY('Personal Training', 'Group Class Access', 'Diet Consultation'),
    JSON_ARRAY('Yoga', 'Zumba', 'Cardio Mix')
);

-- 8️⃣ Women Fitness Plan
INSERT INTO membership_plans (
    gym_id, slug, title, description, billing_cycle, price,
    trainer_type, has_trainer, self_training_allowed, is_pro_plan,
    facilities, features, included_classes
) VALUES (
    1, 'women-fitness', 'Women Fitness Special',
    'Designed for women — includes female trainer and Zumba sessions.',
    'monthly', 1899.00,
    'personal', 1, 1, 0,
    JSON_ARRAY('Ladies Locker', 'Sauna', 'Health Cafe'),
    JSON_ARRAY('Female Trainer', 'Zumba Classes', 'Diet Chart'),
    JSON_ARRAY('Zumba', 'Yoga', 'Stretching')
);

-- 9️⃣ Couple Plan
INSERT INTO membership_plans (
    gym_id, slug, title, description, billing_cycle, price, discount_percent,
    trainer_type, has_trainer, self_training_allowed, is_pro_plan,
    facilities, features, included_classes
) VALUES (
    1, 'couple-plan', 'Couple Fitness Plan',
    'Plan for couples with shared trainer sessions and discounts.',
    'monthly', 3499.00, 15.00,
    'personal', 1, 1, 1,
    JSON_ARRAY('Couple Locker', 'Diet Lounge', 'Steam Room'),
    JSON_ARRAY('Shared Trainer', 'Progress Tracking', 'Nutrition Plan'),
    JSON_ARRAY('Zumba', 'CrossFit')
);

-- 🔟 One-Time Bootcamp Plan
INSERT INTO membership_plans (
    gym_id, slug, title, description, billing_cycle, duration_days, price,
    trainer_type, has_trainer, self_training_allowed, is_pro_plan,
    facilities, features, included_classes
) VALUES (
    1, 'bootcamp-45day', '45-Day Transformation Bootcamp',
    'Intensive transformation challenge with daily workouts and diet tracking.',
    'one_time', 45, 4999.00,
    'personal', 1, 0, 1,
    JSON_ARRAY('Locker', 'Sauna', 'Body Scan', 'Nutrition Consultation'),
    JSON_ARRAY('Daily Trainer Support', 'Progress Tracking', 'Before/After Report'),
    JSON_ARRAY('HIIT', 'CrossFit', 'Cardio')
);

``` ```



-- subscriptions (user -> plan)
CREATE TABLE
    subscriptions (
        subscription_id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
        user_id BIGINT UNSIGNED NOT NULL,
        plan_id BIGINT UNSIGNED NOT NULL,
        gym_id BIGINT UNSIGNED NOT NULL,
        status ENUM ('active', 'cancelled', 'paused', 'expired') NOT NULL DEFAULT 'active',
        start_date DATE NOT NULL,
        end_date DATE DEFAULT NULL,
        next_billing_date DATE DEFAULT NULL,
        billing_cycle ENUM ('monthly', 'quarterly', 'yearly', 'one_time') NOT NULL,
        price_paid DECIMAL(10, 2) NOT NULL,
        auto_renew TINYINT (1) DEFAULT 1,
        freeze_balance INT DEFAULT 0, -- months left if user froze
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (user_id) ON DELETE CASCADE,
        FOREIGN KEY (plan_id) REFERENCES membership_plans (plan_id) ON DELETE CASCADE,
        FOREIGN KEY (gym_id) REFERENCES gyms (gym_id) ON DELETE CASCADE
    );

-- pt sessions ledger (track included and extra PT sessions)
CREATE TABLE
    pt_sessions (
        id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
        subscription_id BIGINT UNSIGNED NOT NULL,
        used_sessions INT DEFAULT 0,
        included_sessions INT DEFAULT 0,
        purchased_extra INT DEFAULT 0,
        last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (subscription_id) REFERENCES subscriptions (subscription_id) ON DELETE CASCADE
    );

-- add-ons purchases
CREATE TABLE
    addon_purchases (
        id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
        subscription_id BIGINT UNSIGNED NOT NULL,
        addon_key VARCHAR(100) NOT NULL, -- 'extra_pt','massage','guest_pass'
        quantity INT DEFAULT 1,
        price DECIMAL(10, 2) NOT NULL,
        purchased_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (subscription_id) REFERENCES subscriptions (subscription_id) ON DELETE CASCADE
    );

-- payments
CREATE TABLE
    payments (
        payment_id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
        subscription_id BIGINT UNSIGNED,
        user_id BIGINT UNSIGNED,
        amount DECIMAL(10, 2) NOT NULL,
        currency VARCHAR(10) DEFAULT 'BDT',
        gateway VARCHAR(100),
        status ENUM ('pending', 'completed', 'failed', 'refunded') DEFAULT 'pending',
        txn_ref VARCHAR(255),
        paid_at TIMESTAMP NULL DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

-- coupons
CREATE TABLE
    coupons (
        coupon_id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
        code VARCHAR(50) UNIQUE,
        discount_type ENUM ('percentage', 'fixed'),
        discount_value DECIMAL(10, 2),
        valid_from DATE,
        valid_to DATE,
        usage_limit INT DEFAULT NULL,
        used_count INT DEFAULT 0,
        active TINYINT (1) DEFAULT 1
    );
```