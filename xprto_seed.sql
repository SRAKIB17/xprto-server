-- XPRTO ERP + Marketplace Seed & Utilities (MySQL 8.0)
-- Run AFTER schema file.

SET NAMES utf8mb4 COLLATE utf8mb4_0900_ai_ci;
SET FOREIGN_KEY_CHECKS = 0;

-- ============================
-- 1) RBAC: roles & permissions
-- ============================
INSERT INTO roles (id, name, description) VALUES
  (1,'Super Admin','Full platform control'),
  (2,'Co-Admin','Ops/admin collaborator'),
  (3,'Gym Owner','ERP: gym owner'),
  (4,'Regd Gym Trainer','ERP: trainer employed by a gym'),
  (5,'Regd Gym Member','ERP: member registered under a gym'),
  (6,'Independent Trainer','Marketplace professional'),
  (7,'Premium Member','Independent premium app member'),
  (8,'Free Member','Independent free app member')
ON DUPLICATE KEY UPDATE name=VALUES(name), description=VALUES(description);

INSERT INTO permissions (id, code, description) VALUES
  (1,'manage_users','Create/ban/update users'),
  (2,'manage_gyms','Verify gyms, manage profiles'),
  (3,'manage_inventory','Create products, stock, vendors'),
  (4,'manage_sales','Invoices/Payments/Sales orders'),
  (5,'manage_memberships','Plans and memberships'),
  (6,'manage_sessions','Trainer-client sessions'),
  (7,'manage_marketplace','Pros, packages, bookings'),
  (8,'review_abuse','Handle abuse reports'),
  (9,'view_reports','View analytics & audit')
ON DUPLICATE KEY UPDATE code=VALUES(code), description=VALUES(description);

-- Map all permissions to Super Admin (1) and Co-Admin (2) a subset
INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT 1, p.id FROM permissions p
UNION ALL
SELECT 2, p.id FROM permissions p WHERE p.id IN (2,3,4,5,6,7,8,9);

-- ============================
-- 2) Verification Badges
-- ============================
INSERT INTO verification_badges (id, code, label, description) VALUES
  (1,'verified','Verified','KYC + 1:1 done, police pending'),
  (2,'fully_verified','Fully Verified','All checks incl. police'),
  (3,'non_verified','Non-Verified','Insufficient profile/kyc'),
  (4,'suspicious','Suspicious','Penalized / risk profile')
ON DUPLICATE KEY UPDATE code=VALUES(code), label=VALUES(label), description=VALUES(description);

-- ============================
-- 3) Users (Sample)
-- ============================
INSERT INTO users (id, role_id, full_name, email, phone, password_hash, status)
VALUES
 (100,1,'Alice Root','admin@xprto.app','+910000000001','$2y$10$adminhash','active'),
 (101,2,'Bob Ops','ops@xprto.app','+910000000002','$2y$10$opscohash','active'),
 (102,3,'Gym Owner One','owner1@gym.com','+910000000003','$2y$10$ownerhash','active'),
 (103,4,'Trainer Reg One','trainer1@gym.com','+910000000004','$2y$10$trainhash','active'),
 (104,5,'Member Reg One','member1@gym.com','+910000000005','$2y$10$memhash','active'),
 (105,6,'Ind Trainer Pro','indpro@xprto.app','+910000000006','$2y$10$indhash','active'),
 (106,7,'Premium User A','premium@xprto.app','+910000000007','$2y$10$premhash','active'),
 (107,8,'Free User B','free@xprto.app','+910000000008','$2y$10$freehash','active')
ON DUPLICATE KEY UPDATE role_id=VALUES(role_id), full_name=VALUES(full_name);

INSERT INTO user_profiles (user_id, city, state, country, expertise, certifications, experience_years, languages)
VALUES
 (103,'Kolkata','WB','India', JSON_ARRAY('Strength','Mobility'),
  JSON_ARRAY(JSON_OBJECT('title','ACE CPT','issuer','ACE','year',2022)),
  4, JSON_ARRAY('English','Bengali')),
 (105,'Mumbai','MH','India', JSON_ARRAY('Fat Loss','Hypertrophy'),
  JSON_ARRAY(JSON_OBJECT('title','NSCA CPT','issuer','NSCA','year',2021)),
  6, JSON_ARRAY('English','Hindi'))
ON DUPLICATE KEY UPDATE city=VALUES(city);

-- Badges
INSERT INTO user_verification (user_id, badge_id, verified_at, verified_by, notes) VALUES
 (103,1, NOW(), 100, 'KYC ok; police pending'),
 (105,2, NOW(), 100, 'All checks passed')
ON DUPLICATE KEY UPDATE badge_id=VALUES(badge_id), verified_at=VALUES(verified_at);

-- ============================
-- 4) Gyms, Branches, Staff, Members
-- ============================
INSERT INTO gyms (id, owner_id, name, legal_name, email, phone, verification_status, rating)
VALUES (200,102,'Iron Temple Fitness','Iron Temple Fitness LLP','hello@irontemple.fit','+910100200300','verified',4.6)
ON DUPLICATE KEY UPDATE name=VALUES(name);

INSERT INTO gym_branches (id, gym_id, name, address_line1, city, state, postal_code, country, opening_hours)
VALUES
 (201,200,'Main Branch','12 Lake Rd','Kolkata','WB','700029','India',
   JSON_OBJECT('mon', JSON_ARRAY(JSON_ARRAY('06:00','22:00')), 'tue', JSON_ARRAY(JSON_ARRAY('06:00','22:00'))))
ON DUPLICATE KEY UPDATE name=VALUES(name);

-- Staff (registered trainer)
INSERT INTO gym_staff (id, gym_id, branch_id, user_id, designation, employment_type, salary, commission_rate, joined_on)
VALUES (300,200,201,103,'Senior Trainer','full_time',35000,10.0,'2024-01-10')
ON DUPLICATE KEY UPDATE designation=VALUES(designation);

-- Member mapping
INSERT INTO gym_members (id, gym_id, branch_id, user_id, joined_on, status)
VALUES (400,200,201,104,'2024-03-01','active')
ON DUPLICATE KEY UPDATE status=VALUES(status);

-- Plans & Memberships
INSERT INTO membership_plans (id, gym_id, name, description, duration_days, price, benefits, is_active)
VALUES (500,200,'Gold Monthly','Unlimited access',30,1999.00, JSON_ARRAY('Locker','Steam'),1)
ON DUPLICATE KEY UPDATE price=VALUES(price);

INSERT INTO memberships (id, member_id, plan_id, start_date, end_date, status, auto_renew)
VALUES (501,400,500,'2025-08-01','2025-08-31','active',1)
ON DUPLICATE KEY UPDATE status=VALUES(status), end_date=VALUES(end_date);

-- Attendance & Trial
INSERT INTO attendance (user_id, gym_id, branch_id, date, check_in_time, check_out_time, status)
VALUES (104,200,201, CURDATE(), NOW(), DATE_ADD(NOW(), INTERVAL 1 HOUR), 'present')
ON DUPLICATE KEY UPDATE check_out_time=VALUES(check_out_time), status='present';

INSERT INTO trials (gym_id, branch_id, trainer_user_id, client_user_id, type, scheduled_at, status)
VALUES (200,201,103,107,'gym_trial', DATE_ADD(NOW(), INTERVAL 1 DAY), 'pending');

-- ============================
-- 5) Inventory & Sales
-- ============================
INSERT INTO vendors (id, gym_id, name, contact_name, phone)
VALUES (600,200,'FitSupp Dist','Ravi','+919999999999')
ON DUPLICATE KEY UPDATE name=VALUES(name);

INSERT INTO products (id, gym_id, sku, name, category, brand, unit, tax_rate, mrp, sale_price, is_active)
VALUES
 (700,200,'WHEY-1KG-CHOC','Whey Protein 1kg Choc','supplement','XPro','bottle',18.00,3499.00,2999.00,1),
 (701,200,'CREA-300G','Creatine Monohydrate 300g','supplement','XPro','jar',18.00,1299.00,1099.00,1)
ON DUPLICATE KEY UPDATE sale_price=VALUES(sale_price);

INSERT INTO purchase_orders (id, gym_id, vendor_id, po_number, status, ordered_at)
VALUES (800,200,600,'PO-0001','placed', NOW())
ON DUPLICATE KEY UPDATE status=VALUES(status);

INSERT INTO purchase_order_items (purchase_order_id, product_id, qty, unit_cost)
VALUES (800,700,20,2000.00), (800,701,30,700.00);

INSERT INTO stock_lots (id, product_id, purchase_order_id, lot_code, expiry_date, qty_received, qty_available)
VALUES
 (900,700,800,'LOT-WHEY-001','2026-12-31',20,20),
 (901,701,800,'LOT-CREA-001','2027-06-30',30,30)
ON DUPLICATE KEY UPDATE qty_available=VALUES(qty_available);

-- Sale to a gym member
INSERT INTO sales_orders (id, gym_id, member_id, counter_user_id, so_number, status, ordered_at)
VALUES (1000,200,400,103,'SO-0001','confirmed', NOW())
ON DUPLICATE KEY UPDATE status=VALUES(status);

INSERT INTO sales_order_items (sales_order_id, product_id, lot_id, qty, unit_price, tax_amount, discount_amount)
VALUES (1000,700,900,1,2999.00, (2999.00*0.18), 0.00);

-- Invoice + Payment for the sale
INSERT INTO invoices (id, gym_id, user_id, invoice_number, status, currency, subtotal, tax_total, discount_total, grand_total, issued_at)
VALUES (1100,200,104,'INV-0001','issued','INR',2999.00, (2999.00*0.18), 0.00, (2999.00*1.18), NOW())
ON DUPLICATE KEY UPDATE status=VALUES(status);

INSERT INTO invoice_items (invoice_id, ref_type, ref_id, description, qty, unit_price, tax_amount, discount_amount, line_total)
VALUES (1100,'product',700,'Whey Protein 1kg Choc',1,2999.00,(2999.00*0.18),0.00,(2999.00*1.18));

INSERT INTO payment_intents (id, invoice_id, provider, amount, currency, status, created_at)
VALUES (1200,1100,'razorpay',(2999.00*1.18),'INR','created', NOW())
ON DUPLICATE KEY UPDATE status=VALUES(status);

INSERT INTO payments (id, invoice_id, intent_id, amount, currency, method, transaction_id, status, paid_at)
VALUES (1300,1100,1200,(2999.00*1.18),'INR','razorpay','razp_test_txn_001','succeeded', NOW())
ON DUPLICATE KEY UPDATE status=VALUES(status), paid_at=VALUES(paid_at);

-- Coupon
INSERT INTO coupons (id, code, description, discount_type, discount_value, max_uses, valid_from, valid_to, is_active)
VALUES (1400,'NEW10','10% off first order','percent',10.00,100, NOW(), DATE_ADD(NOW(), INTERVAL 90 DAY), 1)
ON DUPLICATE KEY UPDATE description=VALUES(description);

-- ============================
-- 6) Coaching & Health
-- ============================
INSERT INTO exercises (id, name, category, equipment, primary_muscles)
VALUES (1500,'Barbell Squat','strength','Barbell', JSON_ARRAY('Quads','Glutes'))
ON DUPLICATE KEY UPDATE category=VALUES(category);

INSERT INTO programs (id, owner_user_id, name, goal, duration_weeks, visibility)
VALUES (1600,103,'Beginner Strength','hypertrophy',8,'shared')
ON DUPLICATE KEY UPDATE goal=VALUES(goal);

INSERT INTO program_workouts (id, program_id, day_index, name)
VALUES (1700,1600,1,'Lower Body A')
ON DUPLICATE KEY UPDATE name=VALUES(name);

INSERT INTO workout_exercises (program_workout_id, exercise_id, sequence, sets, reps, rest_seconds, tempo, load_kg)
VALUES (1700,1500,1,5,'5',180,'21X0',60.0);

INSERT INTO diet_plans (id, owner_user_id, name, target_calories, visibility)
VALUES (1800,103,'Cut 1800kcal',1800,'shared')
ON DUPLICATE KEY UPDATE target_calories=VALUES(target_calories);

INSERT INTO diet_meals (diet_plan_id, day_index, meal_label, items)
VALUES (1800,1,'breakfast', JSON_ARRAY(JSON_OBJECT('food','Oats','qty',80,'unit','g','kcal',300,'protein',10,'carb',54,'fat',6)));

INSERT INTO health_metrics (user_id, recorded_at, height_cm, weight_kg, bmi, body_fat_pct, steps)
VALUES (104, DATE_SUB(NOW(), INTERVAL 1 DAY), 170.0, 72.0, 24.9, 18.5, 8500)
ON DUPLICATE KEY UPDATE weight_kg=VALUES(weight_kg), steps=VALUES(steps);

INSERT INTO transformation_records (id, user_id, before_photo_url, after_photo_url, start_date, end_date, description)
VALUES (1900,104,'/media/before.jpg','/media/after.jpg','2025-05-01','2025-08-01','Lost 6kg, PR +20kg')
ON DUPLICATE KEY UPDATE description=VALUES(description);

-- ============================
-- 7) Marketplace
-- ============================
INSERT INTO pro_profiles (id, user_id, headline, about, skills, services, hourly_rate, min_package_price, city, state, country, rating, is_visible)
VALUES (2000,105,'Fat loss & Hypertrophy Coach','Online + Home + Gym',
  JSON_ARRAY('Fat loss','Hypertrophy'), JSON_ARRAY('1:1 Coaching','Diet Planning'), 1200.00, 4999.00,
  'Mumbai','MH','India',4.9,1)
ON DUPLICATE KEY UPDATE headline=VALUES(headline);

INSERT INTO pro_service_packages (id, pro_profile_id, name, description, duration_weeks, price, deliverables, is_active)
VALUES (2100,2000,'8-Week Body Recomp','Training + Diet + Weekly Check-ins',8,9999.00, JSON_ARRAY('Weekly call','Custom plan'),1)
ON DUPLICATE KEY UPDATE price=VALUES(price);

INSERT INTO pro_bookings (id, package_id, client_user_id, status, requested_at)
VALUES (2200,2100,106,'requested', NOW())
ON DUPLICATE KEY UPDATE status=VALUES(status);

INSERT INTO user_goals (id, user_id, goal, priority, details)
VALUES (2300,106,'Weight Loss',1, JSON_OBJECT('target','-5kg','timeline_weeks',8))
ON DUPLICATE KEY UPDATE goal=VALUES(goal);

INSERT INTO reviews (id, author_user_id, target_user_id, rating, title, body)
VALUES (2400,106,105,5,'Great coach','Very structured and responsive')
ON DUPLICATE KEY UPDATE rating=VALUES(rating);

-- ============================
-- 8) Comms, Abuse, Admin & Monetization
-- ============================
INSERT INTO conversations (id) VALUES (3000) ON DUPLICATE KEY UPDATE id=id;
INSERT INTO conversation_participants (conversation_id, user_id, role) VALUES
 (3000,106,'client'), (3000,105,'trainer')
ON DUPLICATE KEY UPDATE role=VALUES(role);
INSERT INTO messages (conversation_id, sender_user_id, body) VALUES
 (3000,106,'Hi coach! Can you help me with a plan?'),
 (3000,105,'Sure! Let’s start with your goals.');

INSERT INTO notifications (user_id, type, title, message)
VALUES (106,'booking','Booking requested','Your booking with Ind Trainer Pro is pending');

INSERT INTO abuse_reports (id, reported_user_id, reporter_user_id, category, details, status)
VALUES (3100,107,106,'spam','Random spam chat','pending')
ON DUPLICATE KEY UPDATE status=VALUES(status);

INSERT INTO licenses (id, license_key, assigned_gym_id, status, issued_at, expires_at)
VALUES (3200,'LIC-ITF-2025-0001',200,'active', NOW(), DATE_ADD(NOW(), INTERVAL 1 YEAR))
ON DUPLICATE KEY UPDATE status=VALUES(status);

INSERT INTO price_catalog (id, audience, name, monthly_price, annual_price, features, is_active)
VALUES
 (3300,'gym_owner','ERP Pro',2999.00,29999.00, JSON_ARRAY('Inventory','POS','Attendance','Reports'),1),
 (3301,'ind_trainer','Pro Coach',999.00,9999.00, JSON_ARRAY('Programs','Diet plans','Bookings','Payouts'),1),
 (3302,'premium_member','Premium',199.00,1999.00, JSON_ARRAY('Verified gyms','Advanced filters','Trainer match'),1)
ON DUPLICATE KEY UPDATE monthly_price=VALUES(monthly_price);

INSERT INTO subscriptions (id, user_id, price_catalog_id, status, current_period_start, current_period_end, cancel_at_period_end)
VALUES
 (3400,102,3300,'active', NOW(), DATE_ADD(NOW(), INTERVAL 30 DAY), 0),
 (3401,105,3301,'active', NOW(), DATE_ADD(NOW(), INTERVAL 30 DAY), 0),
 (3402,106,3302,'active', NOW(), DATE_ADD(NOW(), INTERVAL 30 DAY), 0)
ON DUPLICATE KEY UPDATE status=VALUES(status), current_period_end=VALUES(current_period_end);

INSERT INTO media_files (id, owner_user_id, gym_id, url, mime_type, size_bytes)
VALUES (3500,102,200,'/media/logos/irontemple.png','image/png', 54231)
ON DUPLICATE KEY UPDATE url=VALUES(url);

-- ============================
-- 9) Utilities: Views & Example Trigger
-- ============================

-- Attendance summary per member (last 30 days)
DROP VIEW IF EXISTS v_member_attendance_30d;
CREATE VIEW v_member_attendance_30d AS
SELECT u.id AS user_id, u.full_name, g.name AS gym_name,
       SUM(a.status='present') AS presents,
       SUM(a.status='late') AS lates,
       SUM(a.status='absent') AS absents
FROM attendance a
LEFT JOIN users u ON u.id=a.user_id
LEFT JOIN gyms g ON g.id=a.gym_id
WHERE a.date >= (CURDATE() - INTERVAL 30 DAY)
GROUP BY u.id, g.id;

-- Stock on hand per product
DROP VIEW IF EXISTS v_stock_on_hand;
CREATE VIEW v_stock_on_hand AS
SELECT p.id AS product_id, p.name, p.sku, p.gym_id,
       COALESCE(SUM(l.qty_available),0) AS qty_on_hand
FROM products p
LEFT JOIN stock_lots l ON l.product_id=p.id
GROUP BY p.id;

-- Revenue last 30 days
DROP VIEW IF EXISTS v_revenue_30d;
CREATE VIEW v_revenue_30d AS
SELECT i.gym_id, SUM(CASE WHEN p.status IN ('succeeded','partially_refunded') THEN p.amount ELSE 0 END) AS collected
FROM invoices i
JOIN payments p ON p.invoice_id=i.id
WHERE p.paid_at >= (NOW() - INTERVAL 30 DAY)
GROUP BY i.gym_id;

-- EXAMPLE TRIGGER: reduce lot qty on successful sales order item insert (simple demo)
DROP TRIGGER IF EXISTS trg_decrement_stock_after_sale;
DELIMITER //
CREATE TRIGGER trg_decrement_stock_after_sale AFTER INSERT ON sales_order_items
FOR EACH ROW
BEGIN
  IF NEW.lot_id IS NOT NULL THEN
    UPDATE stock_lots SET qty_available = GREATEST(qty_available - NEW.qty, 0)
    WHERE id = NEW.lot_id;
    INSERT INTO stock_movements (product_id, lot_id, ref_type, ref_id, qty, direction, reason)
    VALUES (NEW.product_id, NEW.lot_id, 'sale', NEW.sales_order_id, NEW.qty, 'out', 'POS sale');
  END IF;
END//
DELIMITER ;

SET FOREIGN_KEY_CHECKS = 1;