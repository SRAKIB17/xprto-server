CREATE TABLE
    trainer_services (
        service_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        trainer_id BIGINT UNSIGNED NOT NULL,
        -- Basic Info
        title VARCHAR(255) NOT NULL,
        description TEXT,
        -- Pricing & Package
        package_name VARCHAR(255) NULL, -- e.g., "Starter Plan", "Premium Plan"
        package_features JSON NULL, -- list of features/benefits included
        price DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
        discount DECIMAL(5, 2) DEFAULT 0.00, -- percentage discount
        currency VARCHAR(3) NOT NULL DEFAULT 'INR',
        per_unit ENUM ('session', 'day', 'week', 'month', 'yearly') NOT NULL DEFAULT 'session',
        recurrence_type ENUM ('None', 'Daily', 'Custom') DEFAULT 'None',
        recurrence_days JSON DEFAULT NULL,
        time_from TIME NOT NULL, -- FIXED: was DATE
        duration_minutes INT UNSIGNED DEFAULT 60,
        -- Service Delivery
        delivery_mode ENUM ('online', 'doorstep', 'hybrid') NOT NULL DEFAULT 'online',
        requirements TEXT NULL, -- prerequisites (equipment, internet, etc.)
        -- Media & Content
        video VARCHAR(512) NULL,
        images JSON NULL, -- array of image URLs,
        attachments JSON NULL,
        faqs JSON NULL, -- frequently asked questions
        -- Status
        status ENUM ('active', 'draft', 'suspended', 'archived') NOT NULL DEFAULT 'active',
        verify_status ENUM ('pending', 'approved', 'rejected') NOT NULL DEFAULT 'pending',
        -- Metadata
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (trainer_id) REFERENCES trainers (trainer_id) ON DELETE CASCADE,
        INDEX (trainer_id),
        INDEX (delivery_mode),
        INDEX (price),
        INDEX (status),
        INDEX (verify_status),
        FULLTEXT INDEX (title, description) -- for search
    ) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4;

```
INSERT INTO trainer_services
(trainer_id, title, description, details, package_name, package_features, price, discount, currency, duration_minutes, delivery_mode, requirements, video, images, faqs, status, verify_status, created_at, updated_at)
VALUES
(1, '8-Week Weightloss Program', 'Lose weight and build stamina with personalized workouts.', 'This 8-week program includes weekly workout plans, diet charts, and weekly video check-ins.', 'Starter Plan', '["Weekly workouts", "Diet plan", "Access to community"]', 4000.00, 10.00, 'INR', 60, 'online', 'Yoga mat, Dumbbells, Internet connection', 'https://www.w3schools.com/html/mov_bbb.mp4', '["https://i.pravatar.cc/150?img=47","https://i.pravatar.cc/150?img=48"]', '[{"question":"Start date?","answer":"18 Aug"},{"question":"Refund?","answer":"7-day full refund"}]', 'active', 'approved', NOW(), NOW()),
(1, 'Personal Strength Training', 'Build muscle and improve strength with guided sessions.', 'Customized strength training program for all levels.', 'Premium Plan', '["Daily workouts","Nutrition guide","Video sessions"]', 6000.00, 5.00, 'INR', 90, 'doorstep', 'Access to gym equipment', NULL, '["https://i.pravatar.cc/150?img=49"]', '[{"question":"Duration?","answer":"12 weeks"}]', 'draft', 'pending', NOW(), NOW()),
(1, 'Yoga & Flexibility', 'Improve flexibility and mental clarity through yoga.', NULL, 'Standard Plan', '["Yoga sessions","Meditation guide"]', 3500.00, 0.00, 'INR', 60, 'online', 'Yoga mat', 'https://www.w3schools.com/html/mov_bbb.mp4', '[]', NULL, 'active', 'rejected', NOW(), NOW()),
(1, 'HIIT Bootcamp', 'High-intensity interval training to burn calories fast.', '30-min sessions, 3x per week, with diet recommendations.', 'Bootcamp Plan', '["3x weekly sessions","Diet chart","Progress tracking"]', 4500.00, 15.00, 'INR', 30, 'hybrid', 'Minimal equipment', NULL, '["https://i.pravatar.cc/150?img=47"]', '[{"question":"Level?","answer":"Beginner to advanced"}]', 'active', 'approved', NOW(), NOW()),
(1, 'Core Strength Program', 'Strengthen your core and improve posture.', 'Focused 6-week program for core and back muscles.', NULL, NULL, 3000.00, 0.00, 'INR', 45, 'doorstep', 'Yoga mat', NULL, '[]', NULL, 'draft', 'pending', NOW(), NOW()),
(1, 'Functional Training', 'Train for daily life movements and overall fitness.', 'Includes compound exercises and mobility routines.', 'Functional Plan', '["Full body workouts","Mobility drills"]', 5000.00, 10.00, 'INR', 60, 'online', 'Resistance bands', 'https://www.w3schools.com/html/mov_bbb.mp4', '["https://i.pravatar.cc/150?img=48"]', '[{"question":"Equipment needed?","answer":"Resistance bands"}]', 'active', 'approved', NOW(), NOW()),
(1, 'Cardio Blast', 'Boost endurance and burn fat with cardio sessions.', NULL, 'Cardio Plan', '["High intensity cardio","Weekly progress check"]', 3800.00, 5.00, 'INR', 50, 'hybrid', 'Open space', NULL, '[]', NULL, 'active', 'rejected', NOW(), NOW()),
(1, 'Strength & Conditioning', 'Build strength and improve athletic performance.', '6-week structured program for all fitness levels.', 'Athlete Plan', '["Strength workouts","Conditioning drills","Weekly video check-ins"]', 7000.00, 20.00, 'INR', 75, 'doorstep', 'Gym access', NULL, '["https://i.pravatar.cc/150?img=49"]', '[{"question":"Who is this for?","answer":"Intermediate to advanced"}]', 'draft', 'pending', NOW(), NOW()),
(1, 'Mind & Body Wellness', 'Yoga and meditation for mental clarity and relaxation.', NULL, 'Wellness Plan', '["Yoga sessions","Meditation guide","Breathing exercises"]', 4200.00, 0.00, 'INR', 60, 'online', 'Quiet space', 'https://www.w3schools.com/html/mov_bbb.mp4', '[]', NULL, 'active', 'approved', NOW(), NOW()),
(1, 'Personalized Nutrition Plan', 'Custom diet plans based on your goals and body type.', 'Includes meal plans, calorie tracking, and weekly consultations.', NULL, NULL, 2500.00, 0.00, 'INR', 30, 'online', 'Access to kitchen', NULL, '[]', NULL, 'draft', 'pending', NOW(), NOW());

```