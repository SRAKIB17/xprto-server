-- Main plan
CREATE TABLE
    nutrition_plans (
        plan_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        client_id BIGINT UNSIGNED NOT NULL,
        session_id BIGINT UNSIGNED DEFAULT NULL,
        created_by BIGINT UNSIGNED DEFAULT NULL, -- trainer_id
        -- 🏷️ Basic Info
        title VARCHAR(191) NOT NULL,
        description TEXT DEFAULT NULL,
        -- 🔢 Nutritional Summary
        calories INT DEFAULT NULL,
        protein_g DECIMAL(6, 2) DEFAULT NULL,
        carbs_g DECIMAL(6, 2) DEFAULT NULL,
        fats_g DECIMAL(6, 2) DEFAULT NULL,
        -- 🖼️ Visual / Meal Metadata
        image_url VARCHAR(512) DEFAULT NULL,
        meal_time ENUM ('breakfast', 'lunch', 'dinner', 'snack', 'other') DEFAULT 'other',
        -- 🗓️ Time Window
        start_date DATE DEFAULT NULL,
        end_date DATE DEFAULT NULL,
        -- 📝 Notes & Status
        notes JSON DEFAULT NULL, -- store array of notes as JSON (better than TEXT)
        status ENUM ('active', 'expired', 'upcoming') DEFAULT 'active',
        -- 🕒 Meta
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        -- 🔗 Foreign Keys
        FOREIGN KEY (client_id) REFERENCES clients (client_id) ON DELETE CASCADE,
        FOREIGN KEY (session_id) REFERENCES gym_sessions (session_id) ON DELETE SET NULL,
        FOREIGN KEY (created_by) REFERENCES trainers (trainer_id) ON DELETE SET NULL,
        -- 📊 Indexes
        INDEX (client_id),
        INDEX (created_by),
        INDEX (status),
        INDEX (meal_time)
    ) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

```
-- === Insert into nutrition_plans ===
INSERT INTO nutrition_plans (
    client_id, session_id, created_by,
    title, description,
    calories, protein_g, carbs_g, fats_g,
    image_url, meal_time,
    start_date, end_date,
    notes, status
)
VALUES
-- Day 1
(1, 1, 1, 'Day 1 - Breakfast', 'Oats with banana and milk.', 400, 25.00, 60.00, 8.00, 'https://via.placeholder.com/120', 'breakfast', '2025-10-01', '2025-10-01', JSON_ARRAY('Include honey if under calorie target'), 'active'),
(1, 1, 1, 'Day 1 - Lunch', 'Grilled chicken with brown rice.', 650, 45.00, 70.00, 15.00, 'https://via.placeholder.com/120', 'lunch', '2025-10-01', '2025-10-01', JSON_ARRAY('Add salad with olive oil'), 'active'),
(1, 1, 1, 'Day 1 - Dinner', 'Fish curry with steamed rice.', 550, 40.00, 50.00, 18.00, 'https://via.placeholder.com/120', 'dinner', '2025-10-01', '2025-10-01', JSON_ARRAY('Avoid fried fish'), 'active'),
(1, 1, 1, 'Day 1 - Snack', 'Greek yogurt with nuts.', 200, 15.00, 10.00, 6.00, 'https://via.placeholder.com/120', 'snack', '2025-10-01', '2025-10-01', JSON_ARRAY('Use unsweetened yogurt'), 'active'),

-- Repeat pattern for 20 days
-- (Days 2–20)
(1, 1, 1, 'Day 2 - Breakfast', 'Egg white omelette with toast.', 380, 30.00, 40.00, 9.00, 'https://via.placeholder.com/120', 'breakfast', '2025-10-02', '2025-10-02', JSON_ARRAY('Add black coffee'), 'active'),
(1, 1, 1, 'Day 2 - Lunch', 'Paneer curry with roti.', 600, 35.00, 60.00, 20.00, 'https://via.placeholder.com/120', 'lunch', '2025-10-02', '2025-10-02', JSON_ARRAY('Use low-fat paneer'), 'active'),
(1, 1, 1, 'Day 2 - Dinner', 'Chicken soup with vegetables.', 480, 38.00, 35.00, 12.00, 'https://via.placeholder.com/120', 'dinner', '2025-10-02', '2025-10-02', JSON_ARRAY('Add lemon for flavor'), 'active'),
(1, 1, 1, 'Day 2 - Snack', 'Apple with peanut butter.', 220, 10.00, 20.00, 9.00, 'https://via.placeholder.com/120', 'snack', '2025-10-02', '2025-10-02', JSON_ARRAY('Use natural peanut butter'), 'active'),
-- ... repeat until Day 20

-- Example for last day
(1, 1, 1, 'Day 20 - Breakfast', 'Protein smoothie with oats.', 450, 35.00, 55.00, 12.00, 'https://via.placeholder.com/120', 'breakfast', '2025-10-20', '2025-10-20', JSON_ARRAY('Add chia seeds'), 'active'),
(1, 1, 1, 'Day 20 - Lunch', 'Grilled salmon with quinoa.', 700, 50.00, 60.00, 20.00, 'https://via.placeholder.com/120', 'lunch', '2025-10-20', '2025-10-20', JSON_ARRAY('Add steamed broccoli'), 'active'),
(1, 1, 1, 'Day 20 - Dinner', 'Vegetable stir-fry with tofu.', 520, 32.00, 55.00, 15.00, 'https://via.placeholder.com/120', 'dinner', '2025-10-20', '2025-10-20', JSON_ARRAY('Use olive oil instead of butter'), 'active'),
(1, 1, 1, 'Day 20 - Snack', 'Protein bar.', 180, 18.00, 15.00, 5.00, 'https://via.placeholder.com/120', 'snack', '2025-10-20', '2025-10-20', JSON_ARRAY('Low sugar brand preferred'), 'active');

```
---------------------------------------
CREATE TABLE
    meal_ingredients (
        ingredient_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        plan_id BIGINT UNSIGNED NOT NULL,
        -- 🍛 Ingredient Info
        name VARCHAR(191) NOT NULL,
        calories INT DEFAULT NULL,
        protein_g DECIMAL(6, 2) DEFAULT NULL,
        carbs_g DECIMAL(6, 2) DEFAULT NULL,
        fats_g DECIMAL(6, 2) DEFAULT NULL,
        -- ⚖️ Measurement
        quantity DECIMAL(10, 3) DEFAULT NULL, -- e.g., 100.000
        unit VARCHAR(32) DEFAULT NULL, -- e.g., g, kg, tbsp, cup, pcs
        -- 🗒️ Notes / Instructions
        notes VARCHAR(255) DEFAULT NULL,
        instructions TEXT DEFAULT NULL,
        -- 🕒 Meta
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        -- 🔗 Relation
        FOREIGN KEY (plan_id) REFERENCES nutrition_plans (plan_id) ON DELETE CASCADE,
        -- 📊 Indexes
        INDEX (plan_id),
        INDEX (name)
    ) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

```
    INSERT INTO meal_ingredients 
(plan_id, name, calories, protein_g, carbs_g, fats_g, quantity, unit, notes, instructions)
VALUES
-- 🍳 Breakfast
(1, 'Oats with Milk & Banana', 350, 12.5, 55.0, 8.0, 1, 'bowl', 'High-fiber start', 'Mix oats, milk & banana slices.'),
(2, 'Boiled Eggs', 140, 12.0, 1.0, 9.5, 2, 'pcs', 'Protein rich', 'Boil for 8-9 minutes.'),
(3, 'Brown Bread Toast with Peanut Butter', 280, 10.0, 30.0, 14.0, 2, 'slices', 'Good fat + carbs', 'Toast and spread peanut butter evenly.'),

-- 🍚 Lunch
(4, 'Grilled Chicken with Brown Rice', 520, 40.0, 55.0, 12.0, 1, 'plate', 'Lean protein meal', 'Grill chicken; serve with rice.'),
(5, 'Mixed Veg Curry', 180, 6.0, 20.0, 7.0, 1, 'bowl', 'Fiber-rich', 'Cook with minimal oil.'),
(6, 'Dal (Lentil Soup)', 200, 12.0, 25.0, 4.0, 1, 'bowl', 'Plant-based protein', 'Boil lentils & temper with spices.'),

-- 🍛 Dinner
(7, 'Paneer Stir Fry with Quinoa', 450, 32.0, 40.0, 14.0, 1, 'plate', 'Light dinner protein', 'Sauté paneer & vegetables in olive oil.'),
(8, 'Fish Curry with Steamed Rice', 500, 38.0, 48.0, 16.0, 1, 'plate', 'Omega-3 meal', 'Use mustard oil for authentic taste.'),
(9, 'Vegetable Soup with Whole Wheat Bread', 300, 12.0, 35.0, 8.0, 1, 'bowl', 'Low-cal evening option', 'Boil veggies, blend & season lightly.'),

-- 🍎 Snack / Other
(10, 'Greek Yogurt with Nuts', 250, 18.0, 10.0, 12.0, 1, 'cup', 'Probiotic snack', 'Mix nuts into yogurt.'),
(11, 'Apple & Peanut Butter', 200, 5.0, 25.0, 8.0, 1, 'serving', 'Quick energy snack', 'Slice apple & add peanut butter.'),
(12, 'Protein Shake', 220, 28.0, 10.0, 5.0, 1, 'glass', 'Post workout', 'Blend whey with milk & banana.');

    ```