-- টেবিল: client_health_conditions
-- উদ্দেশ্য: প্রতিটি ক্লায়েন্টের স্বাস্থ্য সম্পর্কিত রেকর্ড (Vital Signs + Body Composition + Device Info) সংরক্ষণ করা।
CREATE TABLE
    client_health_conditions (
        title VARCHAR(255) DEFAULT NULL,
        health_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY, -- প্রাইমারি কী
        client_id BIGINT UNSIGNED NOT NULL, -- clients টেবিলের রেফারেন্স
        added_by BIGINT UNSIGNED DEFAULT NULL, -- trainer/doctor যিনি যুক্ত করেছেন
        -- শারীরিক মাপ
        height_cm DECIMAL(5, 2) DEFAULT NULL, -- উচ্চতা (সেমি)
        weight_kg DECIMAL(5, 2) DEFAULT NULL, -- ওজন (কেজি)
        bmi DECIMAL(5, 2) GENERATED ALWAYS AS (
            weight_kg / ((height_cm / 100) * (height_cm / 100))
        ) STORED, -- BMI স্বয়ংক্রিয়ভাবে হিসাব
        -- Fat & Muscle Composition
        attachment JSON DEFAULT NULL, -- Record<string, any> | null
        fat_kg DECIMAL(5, 2) DEFAULT NULL, -- মোট চর্বির পরিমাণ (কেজি)
        visceral_fat_percent DECIMAL(5, 2) DEFAULT NULL, -- ভিসেরাল ফ্যাট (%)
        subcutaneous_fat_percent DECIMAL(5, 2) DEFAULT NULL, -- সাবকিউটেনিয়াস ফ্যাট (%)
        skeletal_muscle_percent DECIMAL(5, 2) DEFAULT NULL, -- স্কেলেটাল মাসল (%)
        resting_metabolism INT DEFAULT NULL, -- বিশ্রামকালীন মেটাবলিজম (kcal)
        -- Vital Signs
        blood_pressure_systolic INT DEFAULT NULL, -- উপরের ব্লাড প্রেসার (Systolic)
        blood_pressure_diastolic INT DEFAULT NULL, -- নিচের ব্লাড প্রেসার (Diastolic)
        heart_rate INT DEFAULT NULL, -- হার্ট রেট (bpm)
        body_temperature DECIMAL(4, 1) DEFAULT NULL, -- শরীরের তাপমাত্রা (°C)
        blood_sugar_level DECIMAL(5, 2) DEFAULT NULL, -- রক্তে সুগার (mmol/L)
        oxygen_saturation DECIMAL(4, 1) DEFAULT NULL, -- অক্সিজেন স্যাচুরেশন (%)
        -- Health Conditions
        chronic_diseases TEXT DEFAULT NULL, -- দীর্ঘমেয়াদি রোগ (যেমন ডায়াবেটিস)
        medications TEXT DEFAULT NULL, -- ব্যবহৃত ওষুধ
        allergies TEXT DEFAULT NULL, -- অ্যালার্জি তথ্য
        remarks TEXT DEFAULT NULL, -- অতিরিক্ত মন্তব্য
        -- Device Info
        device_name VARCHAR(100) DEFAULT NULL, -- যেমন "InBody-270"
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX (client_id),
        FOREIGN KEY (client_id) REFERENCES clients (client_id) ON DELETE CASCADE,
        FOREIGN KEY (added_by) REFERENCES trainers (trainer_id) ON DELETE SET NULL
    ) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

```
INSERT INTO client_health_conditions 
(title, client_id, added_by, height_cm, weight_kg, fat_kg, visceral_fat_percent, subcutaneous_fat_percent, skeletal_muscle_percent, resting_metabolism, 
blood_pressure_systolic, blood_pressure_diastolic, heart_rate, body_temperature, blood_sugar_level, oxygen_saturation, chronic_diseases, medications, allergies, remarks, device_name)
VALUES
('Initial Assessment', 1, 1, 175.0, 68.0, 12.3, 8.5, 18.2, 36.0, 1600, 120, 78, 62, 36.7, 5.2, 98.0, 'None', 'Vitamin D3', 'Dust Allergy', 'Baseline checkup', 'InBody-270'),

('Week 2 Progress', 1, 1, 175.0, 67.2, 11.9, 8.2, 17.5, 36.5, 1615, 118, 76, 60, 36.6, 5.1, 98.2, 'None', 'Vitamin D3', 'Dust Allergy', 'Slight improvement', 'InBody-270'),

('Week 4 Progress', 1, 1, 175.0, 66.5, 11.5, 8.0, 17.0, 37.0, 1620, 117, 75, 59, 36.5, 5.0, 98.5, 'None', 'None', 'Dust Allergy', 'Better metabolism', 'InBody-270'),

('After Cardio Phase', 1, 1, 175.0, 65.8, 11.0, 7.8, 16.5, 37.2, 1630, 116, 74, 61, 36.6, 5.0, 98.4, 'None', NULL, 'Dust Allergy', 'Cardio results positive', 'InBody-270'),

('After Strength Phase', 1, 1, 175.0, 67.0, 11.2, 7.9, 16.8, 38.0, 1650, 118, 77, 63, 36.7, 5.3, 98.3, 'None', NULL, 'None', 'Muscle gain phase', 'InBody-270'),

('Monthly Review', 1, 1, 175.0, 67.3, 11.5, 8.0, 17.0, 38.5, 1655, 119, 77, 62, 36.6, 5.2, 98.5, 'None', NULL, 'None', 'Stable progress', 'InBody-270'),

('3-Month Check', 1, 1, 175.0, 68.2, 12.0, 8.3, 17.4, 38.8, 1660, 120, 78, 61, 36.7, 5.4, 98.3, 'None', NULL, NULL, 'Weight stable', 'InBody-270'),

('Diet Adjustment', 1, 1, 175.0, 67.8, 11.7, 8.1, 17.0, 38.9, 1658, 118, 77, 60, 36.5, 5.1, 98.4, 'None', 'Protein Supplement', NULL, 'Added more protein', 'InBody-270'),

('After Fat-Loss Plan', 1, 1, 175.0, 66.2, 10.8, 7.5, 16.3, 39.5, 1670, 115, 74, 58, 36.5, 5.0, 98.6, 'None', 'Protein Supplement', NULL, 'Lost 1.6kg fat', 'InBody-270'),

('Mid-Year Review', 1, 1, 175.0, 65.5, 10.5, 7.3, 15.9, 40.2, 1680, 114, 73, 58, 36.4, 4.9, 98.8, 'None', 'Protein Supplement', NULL, 'Improved stamina', 'InBody-270'),

('Post-Holiday Check', 1, 1, 175.0, 66.9, 11.0, 7.8, 16.7, 39.8, 1675, 118, 76, 62, 36.6, 5.3, 98.5, 'None', NULL, NULL, 'Gained 1.4kg', 'InBody-270'),

('Pre-Competition', 1, 1, 175.0, 65.2, 10.3, 7.1, 15.7, 40.8, 1690, 113, 72, 57, 36.3, 4.8, 98.9, 'None', NULL, NULL, 'Lean shape achieved', 'InBody-270'),

('Competition Day', 1, 1, 175.0, 65.0, 10.1, 7.0, 15.6, 41.0, 1695, 112, 72, 58, 36.4, 4.7, 99.0, 'None', NULL, NULL, 'Peak condition', 'InBody-270'),

('Recovery Phase', 1, 1, 175.0, 66.0, 10.9, 7.5, 16.0, 40.0, 1685, 115, 75, 60, 36.6, 5.1, 98.8, 'None', 'Multivitamin', NULL, 'Recovering post-event', 'InBody-270'),

('Routine Check', 1, 1, 175.0, 66.4, 11.2, 7.7, 16.2, 39.5, 1678, 116, 76, 61, 36.7, 5.2, 98.6, 'None', 'Multivitamin', NULL, 'Good recovery', 'InBody-270'),

('Post-Vacation', 1, 1, 175.0, 67.0, 11.6, 8.0, 17.0, 38.5, 1660, 119, 77, 63, 36.8, 5.4, 98.4, 'None', 'Multivitamin', NULL, 'Stable', 'InBody-270'),

('Quarterly Review', 1, 1, 175.0, 66.8, 11.4, 7.9, 16.8, 38.9, 1655, 118, 76, 62, 36.7, 5.3, 98.5, 'None', NULL, NULL, 'Good balance maintained', 'InBody-270'),

('Year-End Check', 1, 1, 175.0, 67.5, 11.8, 8.1, 17.3, 38.3, 1650, 119, 78, 63, 36.8, 5.5, 98.2, 'None', NULL, NULL, 'End of year report', 'InBody-270'),

('Follow-Up', 1, 1, 175.0, 67.2, 11.6, 8.0, 17.1, 38.5, 1648, 118, 77, 62, 36.7, 5.4, 98.4, 'None', NULL, NULL, 'Slight variation', 'InBody-270'),

('Annual Review', 1, 1, 175.0, 68.0, 12.1, 8.4, 17.5, 37.9, 1645, 120, 78, 63, 36.8, 5.6, 98.1, 'None', 'Multivitamin', NULL, 'Annual summary record', 'InBody-270');

```