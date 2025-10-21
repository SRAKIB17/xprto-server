CREATE TABLE
    job_posts (
        job_id BIGINT AUTO_INCREMENT PRIMARY KEY,
        gym_id BIGINT UNSIGNED NOT NULL,
        posted_by BIGINT UNSIGNED NULL, -- admin id or gym_owner id
        -- Availability
        available_slots INT DEFAULT 1,
        vacancies INT DEFAULT 1,
        -- Job Info
        title VARCHAR(255) NOT NULL,
        subtitle VARCHAR(255) DEFAULT NULL,
        description TEXT DEFAULT NULL,
        requirements TEXT DEFAULT NULL, -- required skills or experience
        responsibilities TEXT DEFAULT NULL, -- trainer duties / role description
        qualifications TEXT DEFAULT NULL, -- academic or certification requirements
        experience_required VARCHAR(100) DEFAULT NULL,
        min_experience_years TINYINT DEFAULT 0,
        -- Employment & Type
        job_type ENUM (
            'full_time',
            'part_time',
            'contract',
            'freelance',
            'internship',
            'temporary'
        ) DEFAULT 'part_time',
        employment_place ENUM ('on_site', 'remote', 'hybrid') DEFAULT 'on_site',
        gender_preference ENUM ('any', 'male', 'female') DEFAULT 'any',
        -- Salary / Payment Structure
        salary_type ENUM (
            'per_session',
            'per_month',
            'commission',
            'hourly'
        ) DEFAULT 'per_session',
        salary DECIMAL(10, 2) DEFAULT 0.00,
        salary_min DECIMAL(12, 2) NULL,
        salary_max DECIMAL(12, 2) NULL,
        salary_unit ENUM (
            'per_hour',
            'per_day',
            'per_class',
            'per_month',
            'fixed',
            'negotiable'
        ) DEFAULT 'per_month',
        currency VARCHAR(10) DEFAULT 'INR',
        -- Job Duration
        start_date DATE NULL,
        end_date DATE NULL,
        -- Meta Info
        tags JSON DEFAULT NULL, -- e.g. ["fitness","personal training","yoga"]
        category VARCHAR(100) DEFAULT NULL, -- e.g. "Trainer", "Nutritionist"
        location VARCHAR(255) NULL,
        city VARCHAR(100) NULL,
        state VARCHAR(100) NULL,
        -- Visual / Media
        video VARCHAR(512) NULL, -- intro / promo / class demo
        images JSON NULL, -- array of image URLs
        attachments JSON NULL, -- e.g. documents, PDFs, schedules
        faqs JSON NULL, -- array of FAQs (question/answer pairs)
        benefits JSON NULL, -- e.g. {"free_gym_access":true,"health_insurance":true,"commission":true}
        extra JSON DEFAULT NULL, -- e.g. preferred_shifts, trial_class:true, trainer_type:"group"
        -- Visibility / Control
        visibility ENUM ('gym_only', 'public') DEFAULT 'gym_only',
        status ENUM ('draft', 'published', 'closed', 'archived') DEFAULT 'draft',
        featured BOOLEAN DEFAULT FALSE,
        priority ENUM ('low', 'medium', 'high') DEFAULT 'medium',
        -- Audit
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        -- Foreign keys
        FOREIGN KEY (gym_id) REFERENCES gyms (gym_id) ON DELETE CASCADE,
        FOREIGN KEY (posted_by) REFERENCES admin_details (admin_id) ON DELETE SET NULL,
        -- Indexes
        INDEX (gym_id),
        INDEX (status),
        INDEX (job_type),
        INDEX (title),
        INDEX (subtitle),
        INDEX (description),
        INDEX (requirements),
        INDEX (responsibilities),
        INDEX (qualifications),
        INDEX (experience_required),
        INDEX (gender_preference),
        INDEX (salary_type),
        INDEX (min_experience_years),
        INDEX (salary_amount),
        INDEX (salary_min),
        INDEX (salary_max),
        INDEX (salary_unit),
        INDEX (title),
        INDEX (city),
        INDEX (state),
        INDEX (visibility)
    ) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_general_ci;

```
INSERT INTO job_posts (
    gym_id, posted_by, title, subtitle, description, requirements, responsibilities,
    qualifications, experience_required, min_experience_years, job_type, employment_place,
    gender_preference, salary_type, salary_amount, salary_min, salary_max, salary_unit,
    currency, start_date, end_date, tags, category, location, city, state,
    video, images, attachments, faqs, benefits, extra, visibility, status, featured, priority
)
VALUES
-- 1️⃣ Full-Time Fitness Trainer
(1, null, 'Full-Time Fitness Trainer', 'Handle personal and group training sessions',
 'Looking for an energetic certified fitness trainer who can manage both personal and group training.',
 'Certified fitness trainer with knowledge of HIIT and strength training.',
 'Conduct training sessions, track member progress, maintain class discipline.',
 'ACE or ISSA Certified Trainer', '1-3 years', 1, 'full_time', 'on_site', 'any',
 'per_month', 25000.00, 20000.00, 30000.00, 'per_month', 'INR',
 '2025-10-25', '2026-04-25',
 JSON_ARRAY('fitness','strength','group'), 'Trainer', 'Dhanmondi, Dhaka', 'Dhaka', 'Dhaka Division',
 'https://cdn.example.com/videos/training_intro.mp4',
 JSON_ARRAY('https://cdn.example.com/images/gym1.jpg'),
 NULL, NULL,
 JSON_OBJECT('free_gym_access', true, 'health_insurance', true),
 JSON_OBJECT('trial_class', true, 'shift', 'morning'),
 'public', 'published', TRUE, 'high'),

-- 2️⃣ Part-Time Yoga Instructor
(1, null, 'Yoga Instructor (Morning Batch)', 'Teach yoga sessions for early morning members',
 'Certified yoga trainer for morning sessions (5AM-9AM).',
 'Minimum 1 year experience in group yoga classes.',
 'Conduct group yoga classes, maintain calm and focus.',
 'Certified Yoga Instructor', '1-2 years', 1, 'part_time', 'on_site', 'female',
 'per_class', 600.00, 500.00, 700.00, 'per_class', 'INR',
 '2025-10-28', '2026-02-28',
 JSON_ARRAY('yoga','wellness','meditation'), 'Yoga Instructor', 'Banani, Dhaka', 'Dhaka', 'Dhaka Division',
 NULL, JSON_ARRAY('https://cdn.example.com/images/yoga_class.jpg'),
 NULL, NULL,
 JSON_OBJECT('free_gym_access', true, 'commission', false),
 JSON_OBJECT('preferred_shift', 'morning'),
 'public', 'published', FALSE, 'medium'),

-- 3️⃣ Nutrition Consultant
(1, null, 'Nutrition Consultant', 'Advise clients on diet and supplements',
 'We are hiring a nutritionist to guide clients with personalized diet plans.',
 'Bachelor’s in Nutrition or Food Science.', 'Conduct diet consultations and follow-up.',
 'B.Sc. in Nutrition', '2+ years', 2, 'contract', 'on_site', 'any',
 'per_month', 18000.00, 15000.00, 25000.00, 'per_month', 'INR',
 '2025-11-01', '2026-05-01',
 JSON_ARRAY('nutrition','diet','consulting'), 'Nutritionist', 'Gulshan, Dhaka', 'Dhaka', 'Dhaka Division',
 NULL, NULL, NULL, NULL,
 JSON_OBJECT('free_meal', true), NULL,
 'gym_only', 'published', FALSE, 'medium'),

-- 4️⃣ Receptionist (Front Desk)
(1, null, 'Receptionist', 'Manage client check-ins and scheduling',
 'Looking for a polite, organized front desk receptionist with computer skills.',
 'Basic computer knowledge and communication skills.', 'Manage appointments, handle calls.',
 'HSC or equivalent', '1 year', 1, 'full_time', 'on_site', 'female',
 'per_month', 12000.00, 10000.00, 14000.00, 'per_month', 'INR',
 '2025-10-25', '2026-04-25',
 JSON_ARRAY('reception','admin','customer service'), 'Receptionist', 'Dhanmondi, Dhaka', 'Dhaka', 'Dhaka Division',
 NULL, NULL, NULL, NULL,
 JSON_OBJECT('uniform_provided', true), NULL,
 'public', 'published', FALSE, 'low'),

-- 5️⃣ Gym Maintenance Staff
(1, null, 'Maintenance Staff', 'Keep gym equipment and premises clean',
 'Need reliable maintenance worker for daily gym cleaning and equipment maintenance.',
 'Basic understanding of gym equipment care.', 'Clean and maintain hygiene standards.',
 'No formal education required', '0 years', 0, 'full_time', 'on_site', 'male',
 'per_month', 10000.00, 9000.00, 12000.00, 'per_month', 'INR',
 '2025-10-26', '2026-04-26',
 JSON_ARRAY('cleaning','maintenance','support'), 'Support Staff', 'Dhanmondi, Dhaka', 'Dhaka', 'Dhaka Division',
 NULL, NULL, NULL, NULL,
 JSON_OBJECT('free_uniform', true), NULL,
 'gym_only', 'published', FALSE, 'low'),

-- 6️⃣ Freelance Photographer
(1, null, 'Freelance Photographer', 'Capture gym activities and member transformations',
 'Looking for creative photographer for gym events and promotions.',
 'Portfolio required.', 'Take professional photos for social media and campaigns.',
 'Photography Experience', '2 years', 2, 'freelance', 'on_site', 'any',
 'per_session', 1500.00, 1000.00, 2000.00, 'per_session', 'INR',
 '2025-10-29', '2026-03-29',
 JSON_ARRAY('photography','media','promotion'), 'Photographer', 'Gulshan, Dhaka', 'Dhaka', 'Dhaka Division',
 NULL, JSON_ARRAY('https://cdn.example.com/images/event1.jpg'),
 NULL, NULL,
 JSON_OBJECT('free_gym_access', true), NULL,
 'public', 'published', FALSE, 'medium'),

-- 7️⃣ Zumba Instructor
(1, null, 'Zumba Instructor', 'Lead high-energy Zumba dance classes',
 'We need a certified Zumba instructor to teach three evening sessions per week.',
 'Zumba certification required.', 'Conduct group Zumba dance classes.',
 'Certified Zumba Trainer', '1-3 years', 1, 'part_time', 'on_site', 'female',
 'per_class', 800.00, 700.00, 900.00, 'per_class', 'INR',
 '2025-10-30', '2026-03-30',
 JSON_ARRAY('zumba','dance','aerobics'), 'Zumba Instructor', 'Uttara, Dhaka', 'Dhaka', 'Dhaka Division',
 NULL, JSON_ARRAY('https://cdn.example.com/images/zumba.jpg'),
 NULL, NULL,
 JSON_OBJECT('commission', true), JSON_OBJECT('shift', 'evening'),
 'public', 'published', TRUE, 'high'),

-- 8️⃣ Gym Manager
(1, null, 'Gym Manager', 'Oversee daily operations and staff coordination',
 'Experienced manager to lead gym staff, membership sales, and operations.',
 '3+ years experience in fitness management.', 'Manage trainers, handle membership issues.',
 'Bachelor’s degree preferred', '3-5 years', 3, 'full_time', 'on_site', 'any',
 'per_month', 40000.00, 35000.00, 50000.00, 'per_month', 'INR',
 '2025-11-01', '2026-11-01',
 JSON_ARRAY('management','sales','fitness'), 'Manager', 'Dhanmondi, Dhaka', 'Dhaka', 'Dhaka Division',
 NULL, NULL, NULL, NULL,
 JSON_OBJECT('incentive_bonus', true), NULL,
 'gym_only', 'published', TRUE, 'high'),

-- 9️⃣ Personal Trainer (VIP Clients)
(1, null, 'Personal Trainer (VIP Clients)', 'Exclusive 1-on-1 trainer for premium members',
 'We are hiring certified trainers for exclusive personal training sessions.',
 'Advanced fitness knowledge required.', 'Train VIP clients individually.',
 'Certified Personal Trainer', '2-4 years', 2, 'contract', 'on_site', 'male',
 'per_session', 2000.00, 1500.00, 2500.00, 'per_class', 'INR',
 '2025-11-05', '2026-04-05',
 JSON_ARRAY('personal training','premium','fitness'), 'Trainer', 'Banani, Dhaka', 'Dhaka', 'Dhaka Division',
 NULL, NULL, NULL, NULL,
 JSON_OBJECT('commission', true, 'exclusive_access', true), JSON_OBJECT('vip_only', true),
 'public', 'published', TRUE, 'high'),

-- 🔟 Social Media Manager
(1, null, 'Social Media Manager', 'Manage all gym social platforms',
 'Hiring social media specialist to manage gym Instagram, Facebook, and TikTok.',
 'Experience with ad campaigns and post design.', 'Create and post daily content.',
 'Bachelor in Marketing', '1-3 years', 1, 'contract', 'hybrid', 'any',
 'per_month', 25000.00, 20000.00, 30000.00, 'per_month', 'INR',
 '2025-11-10', '2026-05-10',
 JSON_ARRAY('social','marketing','ads'), 'Marketing', 'Online', 'Dhaka', 'Dhaka Division',
 NULL, NULL, NULL, NULL,
 JSON_OBJECT('remote_option', true), NULL,
 'public', 'published', FALSE, 'medium'),

-- 11️⃣ Fitness Intern
(1, null, 'Fitness Intern', 'Gain experience in fitness training',
 'Intern opportunity for freshers in gym operations and training support.',
 'Basic fitness knowledge.', 'Assist trainers and maintain gym schedule.',
 'HSC or higher', '0-1 year', 0, 'internship', 'on_site', 'any',
 'per_month', 8000.00, 7000.00, 10000.00, 'per_month', 'INR',
 '2025-11-15', '2026-02-15',
 JSON_ARRAY('intern','training','assistant'), 'Intern', 'Dhanmondi, Dhaka', 'Dhaka', 'Dhaka Division',
 NULL, NULL, NULL, NULL,
 JSON_OBJECT('certificate_provided', true), NULL,
 'public', 'published', FALSE, 'low');

```
-- Applications by trainers
CREATE TABLE
    job_applications (
        id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        job_id BIGINT UNSIGNED NOT NULL,
        trainer_id BIGINT UNSIGNED NOT NULL,
        cover_letter TEXT DEFAULT NULL,
        attachment JSON DEFAULT NULL, -- e.g. resume, portfolio
        expected_salary DECIMAL(12, 2) NULL,
        expected_salary_unit ENUM (
            'per_hour',
            'per_day',
            'per_class',
            'per_month',
            'fixed',
            'negotiable'
        ) DEFAULT NULL,
        status ENUM (
            'pending',
            'shortlisted',
            'interview',
            'offered',
            'hired',
            'rejected',
            'withdrawn'
        ) DEFAULT 'pending',
        applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        decision_by BIGINT NULL, -- who changed status (gym owner or admin)
        decision_reason TEXT DEFAULT NULL,
        decision_role ENUM ('admin', 'gym_owner') DEFAULT NULL,
        decision_at TIMESTAMP NULL,
        notes TEXT DEFAULT NULL,
        extra JSON DEFAULT NULL, -- e.g. available_days, preferred_shift, sample_videos
        UNIQUE (job_id, trainer_id),
        FOREIGN KEY (job_id) REFERENCES job_posts (job_id) ON DELETE CASCADE,
        FOREIGN KEY (trainer_id) REFERENCES trainers (trainer_id) ON DELETE CASCADE,
        INDEX (job_id),
        INDEX (trainer_id),
        INDEX (status)
    ) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_general_ci;