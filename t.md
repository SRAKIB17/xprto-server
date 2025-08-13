-- XPRTO ERP + Marketplace Schema (MySQL 8.0)
-- Engine: InnoDB, Charset: utf8mb4, Collation: utf8mb4_0900_ai_ci
-- Safe to run on a clean database. Adjust INT/BIGINT sizes as needed for your scale.

SET NAMES utf8mb4 COLLATE utf8mb4_0900_ai_ci;
SET FOREIGN_KEY_CHECKS = 0;

-- =========================================================
-- 0. Utility: enumerations via lookup tables (keeps flexible)
-- =========================================================
CREATE TABLE IF NOT EXISTS roles (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(64) NOT NULL UNIQUE,
  description VARCHAR(255) NULL
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS permissions (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  code VARCHAR(100) NOT NULL UNIQUE,
  description VARCHAR(255) NULL
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS role_permissions (
  role_id BIGINT UNSIGNED NOT NULL,
  permission_id BIGINT UNSIGNED NOT NULL,
  PRIMARY KEY (role_id, permission_id),
  CONSTRAINT fk_rp_role FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
  CONSTRAINT fk_rp_perm FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- =========================================================
-- 1. Auth & Users
-- =========================================================
CREATE TABLE IF NOT EXISTS users (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  role_id BIGINT UNSIGNED NOT NULL,
  full_name VARCHAR(120) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  phone VARCHAR(30) NULL,
  password_hash VARCHAR(255) NOT NULL,
  profile_photo VARCHAR(255) NULL,
  status ENUM('active','suspended','deleted') NOT NULL DEFAULT 'active',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_users_role FOREIGN KEY (role_id) REFERENCES roles(id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS user_profiles (
  user_id BIGINT UNSIGNED PRIMARY KEY,
  date_of_birth DATE NULL,
  gender ENUM('male','female','other') NULL,
  bio TEXT NULL,
  address_line1 VARCHAR(150) NULL,
  address_line2 VARCHAR(150) NULL,
  city VARCHAR(80) NULL,
  state VARCHAR(80) NULL,
  postal_code VARCHAR(20) NULL,
  country VARCHAR(80) NULL,
  latitude DECIMAL(9,6) NULL,
  longitude DECIMAL(9,6) NULL,
  emergency_contact_name VARCHAR(120) NULL,
  emergency_contact_phone VARCHAR(30) NULL,
  -- Trainer/Health Pro extra fields
  expertise JSON NULL, -- array of strings
  certifications JSON NULL, -- list of objects {title, issuer, year, file_url}
  experience_years TINYINT UNSIGNED NULL,
  portfolio_links JSON NULL, -- array of urls
  languages JSON NULL, -- array of strings
  CONSTRAINT fk_up_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- KYC + Verification + Badges
CREATE TABLE IF NOT EXISTS kyc_documents (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  doc_type VARCHAR(60) NOT NULL, -- e.g., 'national_id','police_clearance','certification'
  doc_number VARCHAR(100) NULL,
  file_url VARCHAR(255) NOT NULL,
  issued_by VARCHAR(120) NULL,
  issued_at DATE NULL,
  expires_at DATE NULL,
  status ENUM('submitted','verified','rejected') NOT NULL DEFAULT 'submitted',
  remarks VARCHAR(255) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_kyc_user FOREIGN KEY (user_id) REFERENCES users(id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS verification_badges (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  code ENUM('verified','fully_verified','non_verified','suspicious') NOT NULL,
  label VARCHAR(60) NOT NULL,
  description VARCHAR(255) NULL
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS user_verification (
  user_id BIGINT UNSIGNED PRIMARY KEY,
  badge_id BIGINT UNSIGNED NOT NULL,
  verified_at TIMESTAMP NULL,
  verified_by BIGINT UNSIGNED NULL, -- admin id
  notes VARCHAR(255) NULL,
  CONSTRAINT fk_uv_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_uv_badge FOREIGN KEY (badge_id) REFERENCES verification_badges(id),
  CONSTRAINT fk_uv_admin FOREIGN KEY (verified_by) REFERENCES users(id)
) ENGINE=InnoDB;

-- Strikes / Penalties
CREATE TABLE IF NOT EXISTS user_penalties (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  type ENUM('abuse','scam','guideline_violation','other') NOT NULL,
  points TINYINT UNSIGNED NOT NULL DEFAULT 1,
  reason TEXT NOT NULL,
  reported_by BIGINT UNSIGNED NULL, -- admin or user who reported
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_upn_user FOREIGN KEY (user_id) REFERENCES users(id),
  CONSTRAINT fk_upn_reporter FOREIGN KEY (reported_by) REFERENCES users(id)
) ENGINE=InnoDB;

-- =========================================================
-- 2. Gyms & Branches (ERP)
-- =========================================================
CREATE TABLE IF NOT EXISTS gyms (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  owner_id BIGINT UNSIGNED NOT NULL,
  name VARCHAR(150) NOT NULL,
  legal_name VARCHAR(200) NULL,
  email VARCHAR(150) NULL,
  phone VARCHAR(30) NULL,
  website VARCHAR(200) NULL,
  description TEXT NULL,
  logo_url VARCHAR(255) NULL,
  verification_status ENUM('non_verified','verified','fully_verified','suspicious') NOT NULL DEFAULT 'non_verified',
  rating DECIMAL(3,2) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_gyms_owner FOREIGN KEY (owner_id) REFERENCES users(id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS gym_branches (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  gym_id BIGINT UNSIGNED NOT NULL,
  name VARCHAR(150) NOT NULL,
  address_line1 VARCHAR(150) NOT NULL,
  address_line2 VARCHAR(150) NULL,
  city VARCHAR(80) NOT NULL,
  state VARCHAR(80) NOT NULL,
  postal_code VARCHAR(20) NOT NULL,
  country VARCHAR(80) NOT NULL,
  latitude DECIMAL(9,6) NULL,
  longitude DECIMAL(9,6) NULL,
  opening_hours JSON NULL, -- {"mon":[["07:00","22:00"]], ...}
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  CONSTRAINT fk_branch_gym FOREIGN KEY (gym_id) REFERENCES gyms(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Staff (Registered Trainers working at a gym) & Members (registered gym members)
CREATE TABLE IF NOT EXISTS gym_staff (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  gym_id BIGINT UNSIGNED NOT NULL,
  branch_id BIGINT UNSIGNED NULL,
  user_id BIGINT UNSIGNED NOT NULL, -- must have role 'Regd Gym Trainer' or similar
  designation VARCHAR(120) NULL,
  employment_type ENUM('full_time','part_time','contract') NULL,
  salary DECIMAL(12,2) NULL,
  commission_rate DECIMAL(5,2) NULL, -- %
  joined_on DATE NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  CONSTRAINT fk_staff_gym FOREIGN KEY (gym_id) REFERENCES gyms(id),
  CONSTRAINT fk_staff_branch FOREIGN KEY (branch_id) REFERENCES gym_branches(id),
  CONSTRAINT fk_staff_user FOREIGN KEY (user_id) REFERENCES users(id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS gym_members (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  gym_id BIGINT UNSIGNED NOT NULL,
  branch_id BIGINT UNSIGNED NULL,
  user_id BIGINT UNSIGNED NOT NULL, -- must have role 'Regd Gym Member'
  joined_on DATE NULL,
  status ENUM('active','inactive','banned') NOT NULL DEFAULT 'active',
  notes VARCHAR(255) NULL,
  CONSTRAINT fk_members_gym FOREIGN KEY (gym_id) REFERENCES gyms(id),
  CONSTRAINT fk_members_branch FOREIGN KEY (branch_id) REFERENCES gym_branches(id),
  CONSTRAINT fk_members_user FOREIGN KEY (user_id) REFERENCES users(id)
) ENGINE=InnoDB;

-- Membership Plans & Subscriptions (ERP-side)
CREATE TABLE IF NOT EXISTS membership_plans (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  gym_id BIGINT UNSIGNED NOT NULL,
  name VARCHAR(120) NOT NULL,
  description TEXT NULL,
  duration_days INT NOT NULL,
  price DECIMAL(12,2) NOT NULL,
  benefits JSON NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  CONSTRAINT fk_mplan_gym FOREIGN KEY (gym_id) REFERENCES gyms(id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS memberships (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  member_id BIGINT UNSIGNED NOT NULL, -- gym_members.id
  plan_id BIGINT UNSIGNED NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status ENUM('active','expired','cancelled','suspended') NOT NULL DEFAULT 'active',
  auto_renew TINYINT(1) NOT NULL DEFAULT 0,
  CONSTRAINT fk_mem_member FOREIGN KEY (member_id) REFERENCES gym_members(id),
  CONSTRAINT fk_mem_plan FOREIGN KEY (plan_id) REFERENCES membership_plans(id)
) ENGINE=InnoDB;

-- Attendance / Check-ins
CREATE TABLE IF NOT EXISTS attendance (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  gym_id BIGINT UNSIGNED NULL,
  branch_id BIGINT UNSIGNED NULL,
  date DATE NOT NULL,
  check_in_time DATETIME NULL,
  check_out_time DATETIME NULL,
  status ENUM('present','absent','late') NULL,
  device_id VARCHAR(120) NULL, -- turnstile/scanner id
  CONSTRAINT fk_att_user FOREIGN KEY (user_id) REFERENCES users(id),
  CONSTRAINT fk_att_gym FOREIGN KEY (gym_id) REFERENCES gyms(id),
  CONSTRAINT fk_att_branch FOREIGN KEY (branch_id) REFERENCES gym_branches(id),
  UNIQUE KEY uq_attendance (user_id, date, IFNULL(gym_id,0), IFNULL(branch_id,0))
) ENGINE=InnoDB;

-- Trials (Gym membership trials & PT trials)
CREATE TABLE IF NOT EXISTS trials (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  gym_id BIGINT UNSIGNED NULL,
  branch_id BIGINT UNSIGNED NULL,
  trainer_user_id BIGINT UNSIGNED NULL,
  client_user_id BIGINT UNSIGNED NOT NULL,
  type ENUM('gym_trial','pt_trial') NOT NULL,
  scheduled_at DATETIME NOT NULL,
  status ENUM('pending','completed','cancelled','no_show') NOT NULL DEFAULT 'pending',
  outcome VARCHAR(255) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_tr_gym FOREIGN KEY (gym_id) REFERENCES gyms(id),
  CONSTRAINT fk_tr_branch FOREIGN KEY (branch_id) REFERENCES gym_branches(id),
  CONSTRAINT fk_tr_trainer FOREIGN KEY (trainer_user_id) REFERENCES users(id),
  CONSTRAINT fk_tr_client FOREIGN KEY (client_user_id) REFERENCES users(id)
) ENGINE=InnoDB;

-- =========================================================
-- 3. Inventory & Sales (Supplements, accessories, etc.)
-- =========================================================
CREATE TABLE IF NOT EXISTS vendors (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  gym_id BIGINT UNSIGNED NOT NULL,
  name VARCHAR(150) NOT NULL,
  contact_name VARCHAR(120) NULL,
  phone VARCHAR(30) NULL,
  email VARCHAR(150) NULL,
  address VARCHAR(255) NULL,
  notes VARCHAR(255) NULL,
  CONSTRAINT fk_vend_gym FOREIGN KEY (gym_id) REFERENCES gyms(id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS products (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  gym_id BIGINT UNSIGNED NOT NULL,
  sku VARCHAR(60) NOT NULL,
  name VARCHAR(150) NOT NULL,
  category VARCHAR(100) NULL, -- 'supplement','accessory','apparel','service'
  brand VARCHAR(120) NULL,
  unit VARCHAR(20) NULL, -- 'pc','bottle','kg'
  tax_rate DECIMAL(5,2) NULL,
  mrp DECIMAL(12,2) NULL,
  sale_price DECIMAL(12,2) NULL,
  description TEXT NULL,
  image_url VARCHAR(255) NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  UNIQUE KEY uq_prod (gym_id, sku),
  CONSTRAINT fk_prod_gym FOREIGN KEY (gym_id) REFERENCES gyms(id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS purchase_orders (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  gym_id BIGINT UNSIGNED NOT NULL,
  vendor_id BIGINT UNSIGNED NOT NULL,
  po_number VARCHAR(50) NOT NULL,
  status ENUM('draft','placed','received','cancelled') NOT NULL DEFAULT 'draft',
  ordered_at DATETIME NULL,
  received_at DATETIME NULL,
  notes VARCHAR(255) NULL,
  UNIQUE KEY uq_po (gym_id, po_number),
  CONSTRAINT fk_po_gym FOREIGN KEY (gym_id) REFERENCES gyms(id),
  CONSTRAINT fk_po_vendor FOREIGN KEY (vendor_id) REFERENCES vendors(id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS purchase_order_items (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  purchase_order_id BIGINT UNSIGNED NOT NULL,
  product_id BIGINT UNSIGNED NOT NULL,
  qty INT NOT NULL,
  unit_cost DECIMAL(12,2) NOT NULL,
  CONSTRAINT fk_poi_po FOREIGN KEY (purchase_order_id) REFERENCES purchase_orders(id) ON DELETE CASCADE,
  CONSTRAINT fk_poi_prod FOREIGN KEY (product_id) REFERENCES products(id)
) ENGINE=InnoDB;

-- Stock management
CREATE TABLE IF NOT EXISTS stock_lots (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  product_id BIGINT UNSIGNED NOT NULL,
  purchase_order_id BIGINT UNSIGNED NULL,
  lot_code VARCHAR(60) NULL,
  expiry_date DATE NULL,
  qty_received INT NOT NULL,
  qty_available INT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_lot_prod FOREIGN KEY (product_id) REFERENCES products(id),
  CONSTRAINT fk_lot_po FOREIGN KEY (purchase_order_id) REFERENCES purchase_orders(id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS stock_movements (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  product_id BIGINT UNSIGNED NOT NULL,
  lot_id BIGINT UNSIGNED NULL,
  ref_type ENUM('purchase','sale','adjustment','transfer') NOT NULL,
  ref_id BIGINT UNSIGNED NULL,
  qty INT NOT NULL,
  direction ENUM('in','out') NOT NULL,
  reason VARCHAR(150) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_sm_prod FOREIGN KEY (product_id) REFERENCES products(id),
  CONSTRAINT fk_sm_lot FOREIGN KEY (lot_id) REFERENCES stock_lots(id)
) ENGINE=InnoDB;

-- Sales
CREATE TABLE IF NOT EXISTS sales_orders (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  gym_id BIGINT UNSIGNED NOT NULL,
  member_id BIGINT UNSIGNED NULL, -- if buyer is a gym member
  counter_user_id BIGINT UNSIGNED NULL, -- who sold it
  so_number VARCHAR(50) NOT NULL,
  status ENUM('draft','confirmed','paid','cancelled','refunded') NOT NULL DEFAULT 'draft',
  ordered_at DATETIME NULL,
  notes VARCHAR(255) NULL,
  UNIQUE KEY uq_so (gym_id, so_number),
  CONSTRAINT fk_so_gym FOREIGN KEY (gym_id) REFERENCES gyms(id),
  CONSTRAINT fk_so_member FOREIGN KEY (member_id) REFERENCES gym_members(id),
  CONSTRAINT fk_so_counter FOREIGN KEY (counter_user_id) REFERENCES users(id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS sales_order_items (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  sales_order_id BIGINT UNSIGNED NOT NULL,
  product_id BIGINT UNSIGNED NOT NULL,
  lot_id BIGINT UNSIGNED NULL,
  qty INT NOT NULL,
  unit_price DECIMAL(12,2) NOT NULL,
  tax_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  discount_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  CONSTRAINT fk_soi_so FOREIGN KEY (sales_order_id) REFERENCES sales_orders(id) ON DELETE CASCADE,
  CONSTRAINT fk_soi_prod FOREIGN KEY (product_id) REFERENCES products(id),
  CONSTRAINT fk_soi_lot FOREIGN KEY (lot_id) REFERENCES stock_lots(id)
) ENGINE=InnoDB;

-- Invoicing & Payments (PG: Razorpay/Google Pay-like flows)
CREATE TABLE IF NOT EXISTS invoices (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  gym_id BIGINT UNSIGNED NULL, -- null for marketplace invoices
  user_id BIGINT UNSIGNED NOT NULL, -- billed to
  invoice_number VARCHAR(60) NOT NULL,
  status ENUM('draft','issued','paid','cancelled','overdue') NOT NULL DEFAULT 'issued',
  currency CHAR(3) NOT NULL DEFAULT 'INR',
  subtotal DECIMAL(12,2) NOT NULL DEFAULT 0,
  tax_total DECIMAL(12,2) NOT NULL DEFAULT 0,
  discount_total DECIMAL(12,2) NOT NULL DEFAULT 0,
  grand_total DECIMAL(12,2) NOT NULL DEFAULT 0,
  issued_at DATETIME NOT NULL,
  due_at DATETIME NULL,
  notes VARCHAR(255) NULL,
  UNIQUE KEY uq_invoice (invoice_number),
  CONSTRAINT fk_inv_gym FOREIGN KEY (gym_id) REFERENCES gyms(id),
  CONSTRAINT fk_inv_user FOREIGN KEY (user_id) REFERENCES users(id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS invoice_items (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  invoice_id BIGINT UNSIGNED NOT NULL,
  ref_type ENUM('membership','product','service','session','other') NOT NULL,
  ref_id BIGINT UNSIGNED NULL,
  description VARCHAR(255) NOT NULL,
  qty INT NOT NULL DEFAULT 1,
  unit_price DECIMAL(12,2) NOT NULL,
  tax_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  discount_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  line_total DECIMAL(12,2) NOT NULL,
  CONSTRAINT fk_invi_inv FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS payment_intents (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  invoice_id BIGINT UNSIGNED NOT NULL,
  provider ENUM('razorpay','gpay','cash','card','bank') NOT NULL,
  provider_ref VARCHAR(120) NULL, -- e.g., Razorpay order_id
  amount DECIMAL(12,2) NOT NULL,
  currency CHAR(3) NOT NULL DEFAULT 'INR',
  status ENUM('created','requires_action','succeeded','failed','cancelled') NOT NULL DEFAULT 'created',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_pi_invoice FOREIGN KEY (invoice_id) REFERENCES invoices(id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS payments (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  invoice_id BIGINT UNSIGNED NOT NULL,
  intent_id BIGINT UNSIGNED NULL,
  amount DECIMAL(12,2) NOT NULL,
  currency CHAR(3) NOT NULL DEFAULT 'INR',
  method ENUM('razorpay','gpay','cash','card','bank') NOT NULL,
  transaction_id VARCHAR(120) NULL,
  status ENUM('pending','succeeded','failed','refunded','partially_refunded') NOT NULL DEFAULT 'succeeded',
  paid_at DATETIME NULL,
  CONSTRAINT fk_pay_invoice FOREIGN KEY (invoice_id) REFERENCES invoices(id),
  CONSTRAINT fk_pay_intent FOREIGN KEY (intent_id) REFERENCES payment_intents(id)
) ENGINE=InnoDB;

-- Coupons & Campaigns
CREATE TABLE IF NOT EXISTS coupons (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  code VARCHAR(40) NOT NULL UNIQUE,
  description VARCHAR(255) NULL,
  discount_type ENUM('flat','percent') NOT NULL,
  discount_value DECIMAL(12,2) NOT NULL,
  max_uses INT NULL,
  used_count INT NOT NULL DEFAULT 0,
  valid_from DATETIME NULL,
  valid_to DATETIME NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS coupon_redemptions (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  coupon_id BIGINT UNSIGNED NOT NULL,
  user_id BIGINT UNSIGNED NOT NULL,
  invoice_id BIGINT UNSIGNED NULL,
  redeemed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_cr_coupon FOREIGN KEY (coupon_id) REFERENCES coupons(id),
  CONSTRAINT fk_cr_user FOREIGN KEY (user_id) REFERENCES users(id),
  CONSTRAINT fk_cr_invoice FOREIGN KEY (invoice_id) REFERENCES invoices(id)
) ENGINE=InnoDB;

-- =========================================================
-- 4. Coaching: Programs, Sessions, Workouts, Diets, Health Data
-- =========================================================
CREATE TABLE IF NOT EXISTS sessions (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  trainer_user_id BIGINT UNSIGNED NOT NULL,
  client_user_id BIGINT UNSIGNED NOT NULL,
  gym_id BIGINT UNSIGNED NULL,
  branch_id BIGINT UNSIGNED NULL,
  mode ENUM('gym','home','online') NOT NULL,
  scheduled_start DATETIME NOT NULL,
  scheduled_end DATETIME NOT NULL,
  status ENUM('scheduled','completed','cancelled','no_show') NOT NULL DEFAULT 'scheduled',
  notes TEXT NULL,
  CONSTRAINT fk_s_trainer FOREIGN KEY (trainer_user_id) REFERENCES users(id),
  CONSTRAINT fk_s_client FOREIGN KEY (client_user_id) REFERENCES users(id),
  CONSTRAINT fk_s_gym FOREIGN KEY (gym_id) REFERENCES gyms(id),
  CONSTRAINT fk_s_branch FOREIGN KEY (branch_id) REFERENCES gym_branches(id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS exercises (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(150) NOT NULL,
  category VARCHAR(80) NULL, -- 'strength','cardio','mobility'
  equipment VARCHAR(150) NULL,
  primary_muscles JSON NULL, -- array of strings
  instructions TEXT NULL,
  media_url VARCHAR(255) NULL
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS programs (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  owner_user_id BIGINT UNSIGNED NOT NULL,
  name VARCHAR(150) NOT NULL,
  goal VARCHAR(120) NULL, -- 'weight_loss','hypertrophy','rehab', etc.
  duration_weeks INT NULL,
  visibility ENUM('private','shared','public') NOT NULL DEFAULT 'private',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_prog_owner FOREIGN KEY (owner_user_id) REFERENCES users(id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS program_workouts (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  program_id BIGINT UNSIGNED NOT NULL,
  day_index TINYINT UNSIGNED NOT NULL, -- 1..7 or sequence
  name VARCHAR(120) NOT NULL,
  notes TEXT NULL,
  CONSTRAINT fk_pw_prog FOREIGN KEY (program_id) REFERENCES programs(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS workout_exercises (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  program_workout_id BIGINT UNSIGNED NOT NULL,
  exercise_id BIGINT UNSIGNED NOT NULL,
  sequence TINYINT UNSIGNED NOT NULL,
  sets TINYINT UNSIGNED NULL,
  reps VARCHAR(50) NULL, -- e.g., '8-12', 'AMRAP'
  rest_seconds SMALLINT UNSIGNED NULL,
  tempo VARCHAR(20) NULL,
  load_kg DECIMAL(6,2) NULL,
  CONSTRAINT fk_we_pw FOREIGN KEY (program_workout_id) REFERENCES program_workouts(id) ON DELETE CASCADE,
  CONSTRAINT fk_we_ex FOREIGN KEY (exercise_id) REFERENCES exercises(id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS diet_plans (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  owner_user_id BIGINT UNSIGNED NOT NULL,
  name VARCHAR(150) NOT NULL,
  target_calories INT NULL,
  macros JSON NULL, -- {protein_g, carbs_g, fat_g}
  visibility ENUM('private','shared','public') NOT NULL DEFAULT 'private',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_dp_owner FOREIGN KEY (owner_user_id) REFERENCES users(id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS diet_meals (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  diet_plan_id BIGINT UNSIGNED NOT NULL,
  day_index TINYINT UNSIGNED NOT NULL,
  meal_label VARCHAR(60) NOT NULL, -- 'breakfast','lunch'
  items JSON NULL, -- array of {food, qty, unit, kcal, protein, carb, fat}
  notes TEXT NULL,
  CONSTRAINT fk_dm_dp FOREIGN KEY (diet_plan_id) REFERENCES diet_plans(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS health_metrics (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  recorded_at DATETIME NOT NULL,
  height_cm DECIMAL(5,2) NULL,
  weight_kg DECIMAL(5,2) NULL,
  bmi DECIMAL(5,2) NULL,
  body_fat_pct DECIMAL(5,2) NULL,
  waist_cm DECIMAL(5,2) NULL,
  hip_cm DECIMAL(5,2) NULL,
  systolic_bp SMALLINT NULL,
  diastolic_bp SMALLINT NULL,
  resting_hr SMALLINT NULL,
  steps INT NULL,
  notes VARCHAR(255) NULL,
  UNIQUE KEY uq_hm (user_id, recorded_at),
  CONSTRAINT fk_hm_user FOREIGN KEY (user_id) REFERENCES users(id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS transformation_records (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  before_photo_url VARCHAR(255) NULL,
  after_photo_url VARCHAR(255) NULL,
  start_date DATE NULL,
  end_date DATE NULL,
  description TEXT NULL,
  CONSTRAINT fk_tr_user FOREIGN KEY (user_id) REFERENCES users(id)
) ENGINE=InnoDB;

-- =========================================================
-- 5. Marketplace (Independent Trainers / Nutritionists / Health Coaches)
-- =========================================================
CREATE TABLE IF NOT EXISTS pro_profiles (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL, -- must be independent trainer/nutritionist
  headline VARCHAR(150) NULL,
  about TEXT NULL,
  skills JSON NULL, -- array of strings
  services JSON NULL, -- array of strings
  hourly_rate DECIMAL(12,2) NULL,
  min_package_price DECIMAL(12,2) NULL,
  city VARCHAR(80) NULL,
  state VARCHAR(80) NULL,
  country VARCHAR(80) NULL,
  rating DECIMAL(3,2) NULL,
  views INT NOT NULL DEFAULT 0,
  is_visible TINYINT(1) NOT NULL DEFAULT 1,
  CONSTRAINT fk_pp_user FOREIGN KEY (user_id) REFERENCES users(id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS pro_portfolio_items (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  pro_profile_id BIGINT UNSIGNED NOT NULL,
  title VARCHAR(150) NOT NULL,
  media_url VARCHAR(255) NULL,
  description TEXT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_ppi_pp FOREIGN KEY (pro_profile_id) REFERENCES pro_profiles(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS pro_service_packages (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  pro_profile_id BIGINT UNSIGNED NOT NULL,
  name VARCHAR(150) NOT NULL,
  description TEXT NULL,
  duration_weeks INT NULL,
  price DECIMAL(12,2) NOT NULL,
  deliverables JSON NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  CONSTRAINT fk_psp_pp FOREIGN KEY (pro_profile_id) REFERENCES pro_profiles(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS pro_bookings (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  package_id BIGINT UNSIGNED NOT NULL,
  client_user_id BIGINT UNSIGNED NOT NULL,
  status ENUM('requested','accepted','in_progress','completed','cancelled') NOT NULL DEFAULT 'requested',
  requested_at DATETIME NOT NULL,
  accepted_at DATETIME NULL,
  completed_at DATETIME NULL,
  notes TEXT NULL,
  CONSTRAINT fk_pb_pack FOREIGN KEY (package_id) REFERENCES pro_service_packages(id),
  CONSTRAINT fk_pb_client FOREIGN KEY (client_user_id) REFERENCES users(id)
) ENGINE=InnoDB;

-- Matching / Search Preferences
CREATE TABLE IF NOT EXISTS user_goals (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  goal VARCHAR(120) NOT NULL,
  priority TINYINT UNSIGNED NOT NULL DEFAULT 1,
  details JSON NULL,
  CONSTRAINT fk_ug_user FOREIGN KEY (user_id) REFERENCES users(id)
) ENGINE=InnoDB;

-- Reviews & Ratings
CREATE TABLE IF NOT EXISTS reviews (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  author_user_id BIGINT UNSIGNED NOT NULL,
  target_user_id BIGINT UNSIGNED NOT NULL,
  rating TINYINT UNSIGNED NOT NULL CHECK (rating BETWEEN 1 AND 5),
  title VARCHAR(120) NULL,
  body TEXT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_rev_author FOREIGN KEY (author_user_id) REFERENCES users(id),
  CONSTRAINT fk_rev_target FOREIGN KEY (target_user_id) REFERENCES users(id)
) ENGINE=InnoDB;

-- =========================================================
-- 6. Communications, Support & Abuse Control
-- =========================================================
CREATE TABLE IF NOT EXISTS conversations (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS conversation_participants (
  conversation_id BIGINT UNSIGNED NOT NULL,
  user_id BIGINT UNSIGNED NOT NULL,
  role ENUM('client','trainer','owner','admin','support','other') NULL,
  last_read_at DATETIME NULL,
  PRIMARY KEY (conversation_id, user_id),
  CONSTRAINT fk_cp_conv FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE,
  CONSTRAINT fk_cp_user FOREIGN KEY (user_id) REFERENCES users(id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS messages (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  conversation_id BIGINT UNSIGNED NOT NULL,
  sender_user_id BIGINT UNSIGNED NOT NULL,
  body TEXT NULL,
  media_url VARCHAR(255) NULL,
  sent_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_msg_conv FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE,
  CONSTRAINT fk_msg_sender FOREIGN KEY (sender_user_id) REFERENCES users(id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS notifications (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  type VARCHAR(60) NOT NULL, -- 'payment','verification','trial','booking','system'
  title VARCHAR(150) NOT NULL,
  message TEXT NOT NULL,
  is_read TINYINT(1) NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_notif_user FOREIGN KEY (user_id) REFERENCES users(id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS abuse_reports (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  reported_user_id BIGINT UNSIGNED NOT NULL,
  reporter_user_id BIGINT UNSIGNED NOT NULL,
  category ENUM('harassment','fraud','spam','unsafe','other') NOT NULL,
  details TEXT NOT NULL,
  evidence_url VARCHAR(255) NULL,
  status ENUM('pending','reviewed','resolved','suspended') NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  resolved_by BIGINT UNSIGNED NULL,
  resolved_at DATETIME NULL,
  resolution_notes TEXT NULL,
  CONSTRAINT fk_ar_reported FOREIGN KEY (reported_user_id) REFERENCES users(id),
  CONSTRAINT fk_ar_reporter FOREIGN KEY (reporter_user_id) REFERENCES users(id),
  CONSTRAINT fk_ar_resolver FOREIGN KEY (resolved_by) REFERENCES users(id)
) ENGINE=InnoDB;

-- =========================================================
-- 7. Admin: Licenses, Pricing, Audit
-- =========================================================
CREATE TABLE IF NOT EXISTS licenses (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  license_key VARCHAR(64) NOT NULL UNIQUE,
  assigned_gym_id BIGINT UNSIGNED NULL,
  assigned_user_id BIGINT UNSIGNED NULL,
  status ENUM('active','expired','revoked') NOT NULL DEFAULT 'active',
  issued_at DATETIME NOT NULL,
  expires_at DATETIME NULL,
  notes VARCHAR(255) NULL,
  CONSTRAINT fk_lic_gym FOREIGN KEY (assigned_gym_id) REFERENCES gyms(id),
  CONSTRAINT fk_lic_user FOREIGN KEY (assigned_user_id) REFERENCES users(id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS price_catalog (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  audience ENUM('gym_owner','regd_trainer','ind_trainer','premium_member','free_member') NOT NULL,
  name VARCHAR(120) NOT NULL,
  monthly_price DECIMAL(12,2) NULL,
  annual_price DECIMAL(12,2) NULL,
  features JSON NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS subscriptions (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  price_catalog_id BIGINT UNSIGNED NOT NULL,
  status ENUM('active','past_due','cancelled','expired') NOT NULL DEFAULT 'active',
  current_period_start DATETIME NOT NULL,
  current_period_end DATETIME NOT NULL,
  cancel_at_period_end TINYINT(1) NOT NULL DEFAULT 0,
  CONSTRAINT fk_sub_user FOREIGN KEY (user_id) REFERENCES users(id),
  CONSTRAINT fk_sub_price FOREIGN KEY (price_catalog_id) REFERENCES price_catalog(id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS audit_logs (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  actor_user_id BIGINT UNSIGNED NULL,
  action VARCHAR(120) NOT NULL,
  target_table VARCHAR(120) NULL,
  target_id BIGINT UNSIGNED NULL,
  metadata JSON NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_audit_actor (actor_user_id, created_at DESC),
  INDEX idx_audit_target (target_table, target_id),
  CONSTRAINT fk_audit_actor FOREIGN KEY (actor_user_id) REFERENCES users(id)
) ENGINE=InnoDB;

-- =========================================================
-- 8. Files & Media
-- =========================================================
CREATE TABLE IF NOT EXISTS media_files (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  owner_user_id BIGINT UNSIGNED NULL,
  gym_id BIGINT UNSIGNED NULL,
  url VARCHAR(255) NOT NULL,
  mime_type VARCHAR(80) NULL,
  size_bytes BIGINT UNSIGNED NULL,
  uploaded_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_mf_owner FOREIGN KEY (owner_user_id) REFERENCES users(id),
  CONSTRAINT fk_mf_gym FOREIGN KEY (gym_id) REFERENCES gyms(id)
) ENGINE=InnoDB;

-- Helpful indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role_id);
CREATE INDEX idx_gyms_owner ON gyms(owner_id);
CREATE INDEX idx_members_user ON gym_members(user_id);
CREATE INDEX idx_staff_user ON gym_staff(user_id);
CREATE INDEX idx_att_user_date ON attendance(user_id, date);
CREATE INDEX idx_sessions_trainer_date ON sessions(trainer_user_id, scheduled_start);
CREATE INDEX idx_sessions_client_date ON sessions(client_user_id, scheduled_start);
CREATE INDEX idx_health_user_time ON health_metrics(user_id, recorded_at);
CREATE INDEX idx_pro_views ON pro_profiles(views);
CREATE INDEX idx_invoices_user ON invoices(user_id, issued_at);
CREATE INDEX idx_payments_invoice ON payments(invoice_id);
CREATE INDEX idx_reviews_target ON reviews(target_user_id, created_at);

SET FOREIGN_KEY_CHECKS = 1;
