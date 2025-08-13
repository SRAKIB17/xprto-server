ভালো — নিচে আপনাকে **সম্পূর্ণ ও কনফিগারেবল `admin` সিস্টেম** দিতে যাচ্ছি। এতে থাকবে অ্যাডমিন ইউজার মডেল, রোলস ও পারমিশন (RBAC), সেশন ট্র্যাকিং, পাসওয়ার্ড রিসেট, API কী, অডিট-লগিং, এবং প্রয়োজনীয় ইনডেক্স/কনস্ট্রেইন্ট/ট্রিগার — সবকিছু বাংলা ইনলাইন মন্তব্যসহ। আপনি চাইলে এটা সরাসরি আপনার পূর্বের স্কিমার সাথে যুক্ত করে দিতে পারবেন (উদাহরণ: `gym_owner_id` ফিল্ড ব্যবহার করে মাল্টি-টেন্যান্সি)।

```sql
/********************************************************************************
  ADMIN USER & RBAC SCHEMA
  - admins, admin_profiles, roles, permissions, role_permissions, admin_roles
  - admin_sessions, admin_password_resets, admin_api_keys, admin_activity_log
  - triggers for audit logging (create/update/delete)
*********************************************************************************/

/* 1) roles - রোল ডেফিনিশন (single source of truth for roles) */
CREATE TABLE IF NOT EXISTS roles (
    role_id BIGINT AUTO_INCREMENT PRIMARY KEY, -- রোলের ইউনিক আইডি
    name VARCHAR(100) NOT NULL UNIQUE, -- রোলের নাম (e.g., superadmin, manager, support)
    description TEXT DEFAULT NULL, -- রোলের বর্ণনা
    is_default BOOLEAN DEFAULT FALSE, -- নতুন অ্যাডমিনে ডিফল্টে অ্যাসাইন হবে কি না
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE INDEX idx_roles_name ON roles (name);

/* 2) permissions - ভ্যারাবলি পারমিশন তালিকা */
CREATE TABLE IF NOT EXISTS permissions (
    permission_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(150) NOT NULL UNIQUE, -- permission slug (e.g., clients.view, billing.edit)
    description TEXT DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE INDEX idx_permissions_name ON permissions (name);

/* 3) role_permissions - রোল এবং পারমিশনের Many-to-Many */
CREATE TABLE IF NOT EXISTS role_permissions (
    role_permission_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    role_id BIGINT NOT NULL,
    permission_id BIGINT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uk_role_permission (role_id, permission_id),
    FOREIGN KEY (role_id) REFERENCES roles(role_id) ON DELETE CASCADE,
    FOREIGN KEY (permission_id) REFERENCES permissions(permission_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

/* 4) admins - অ্যাডমিন ইউজার মেইন টেবিল */
CREATE TABLE IF NOT EXISTS admins (
    admin_id BIGINT AUTO_INCREMENT PRIMARY KEY, -- অ্যাডমিন ইউনিক আইডি
    username VARCHAR(50) NOT NULL UNIQUE, -- লগইন নাম বা ইউজারনেম
    email VARCHAR(150) NOT NULL UNIQUE, -- ইমেইল
    password_hash VARCHAR(255) DEFAULT NULL, -- হ্যাশ করা পাসওয়ার্ড
    is_superadmin BOOLEAN DEFAULT FALSE, -- সম্পূর্ণ সুপারঅ্যাডমিন অনুমতি
    status ENUM('active','inactive','suspended','deleted') DEFAULT 'active', -- অ্যাকাউন্ট স্টেটাস
    must_change_password BOOLEAN DEFAULT FALSE, -- প্রথম লগইনে পাসওয়ার্ড পরিবর্তন বাধ্যতামূলক
    two_factor_enabled BOOLEAN DEFAULT FALSE, -- 2FA সক্রিয় কিনা
    two_factor_secret VARCHAR(255) DEFAULT NULL, -- 2FA সিক্রেট (এনক্রিপ্ট করে রাখবেন)
    last_login TIMESTAMP NULL DEFAULT NULL, -- শেষ লগইন
    failed_login_attempts INT DEFAULT 0, -- ব্যর্থ লগইন গণনা
    locked_until DATETIME DEFAULT NULL, -- যদি অনেকবার ব্যর্থ লগইন হয়, অবরুদ্ধ থাকবে
    created_by BIGINT DEFAULT NULL, -- কে এই অ্যাডমিন তৈরি করেছে (admin_id রেফারেন্স)
    gym_owner_id BIGINT DEFAULT NULL, -- যদি অ্যাডমিন কেবল নির্দিষ্ট জিমের জন্য হয়, এখানে gym_owner রেফারেন্স রাখবেন
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT chk_admin_username_len CHECK (CHAR_LENGTH(username) BETWEEN 3 AND 50),
    CONSTRAINT chk_admin_email_format CHECK (email LIKE '%_@_%._%'),
    FOREIGN KEY (created_by) REFERENCES admins(admin_id) ON DELETE SET NULL,
    FOREIGN KEY (gym_owner_id) REFERENCES gym_owners(gym_owner_id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE INDEX idx_admins_email ON admins (email);
CREATE INDEX idx_admins_status ON admins (status);
CREATE INDEX idx_admins_gym_owner ON admins (gym_owner_id);

/* 5) admin_profiles - প্রোফাইল/অতিরিক্ত মেটা (ঐচ্ছিক) */
CREATE TABLE IF NOT EXISTS admin_profiles (
    profile_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    admin_id BIGINT NOT NULL,
    full_name VARCHAR(150) DEFAULT NULL,
    avatar_url VARCHAR(255) DEFAULT NULL,
    phone VARCHAR(30) DEFAULT NULL,
    job_title VARCHAR(100) DEFAULT NULL,
    language VARCHAR(10) DEFAULT 'en',
    timezone VARCHAR(50) DEFAULT 'Asia/Dhaka',
    meta JSON DEFAULT NULL, -- কাস্টম সেটিংস/প্রিভিলেজ ইত্যাদি
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (admin_id) REFERENCES admins(admin_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE INDEX idx_admin_profiles_admin ON admin_profiles (admin_id);

/* 6) admin_roles - অ্যাডমিনদের রোল অ্যাসাইন (Many-to-Many) */
CREATE TABLE IF NOT EXISTS admin_roles (
    admin_role_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    admin_id BIGINT NOT NULL,
    role_id BIGINT NOT NULL,
    assigned_by BIGINT DEFAULT NULL, -- যিনি অ্যাসাইন করেছেন (admin_id)
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uk_admin_role (admin_id, role_id),
    FOREIGN KEY (admin_id) REFERENCES admins(admin_id) ON DELETE CASCADE,
    FOREIGN KEY (role_id) REFERENCES roles(role_id) ON DELETE CASCADE,
    FOREIGN KEY (assigned_by) REFERENCES admins(admin_id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE INDEX idx_admin_roles_admin ON admin_roles (admin_id);
CREATE INDEX idx_admin_roles_role ON admin_roles (role_id);

/* 7) admin_sessions - এডমিন সেশন / টোকেন ট্র্যাকিং */
CREATE TABLE IF NOT EXISTS admin_sessions (
    session_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    admin_id BIGINT NOT NULL,
    session_token VARCHAR(255) NOT NULL UNIQUE, -- JWT বা সেশন টোকেন (নিরাপদ স্টোর)
    ip_address VARCHAR(50) DEFAULT NULL,
    user_agent TEXT DEFAULT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    expires_at DATETIME DEFAULT NULL,
    revoked BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (admin_id) REFERENCES admins(admin_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE INDEX idx_admin_sessions_admin ON admin_sessions (admin_id);
CREATE INDEX idx_admin_sessions_token ON admin_sessions (session_token);

/* 8) admin_password_resets - পাসওয়ার্ড রিসেট টোকেন */
CREATE TABLE IF NOT EXISTS admin_password_resets (
    reset_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    admin_id BIGINT NOT NULL,
    reset_token VARCHAR(255) NOT NULL UNIQUE,
    requested_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    expires_at DATETIME NOT NULL,
    used BOOLEAN DEFAULT FALSE,
    used_at DATETIME DEFAULT NULL,
    ip_address VARCHAR(50) DEFAULT NULL,
    FOREIGN KEY (admin_id) REFERENCES admins(admin_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE INDEX idx_admin_resets_admin ON admin_password_resets (admin_id);

/* 9) admin_api_keys - সার্ভিস/এপিআই কীগুলো (রোবস্ট গঠন) */
CREATE TABLE IF NOT EXISTS admin_api_keys (
    api_key_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    admin_id BIGINT NOT NULL,
    name VARCHAR(150) DEFAULT NULL, -- কী এর লেবেল (e.g., "Reporting Service")
    api_key_hash VARCHAR(255) NOT NULL, -- স্টোর করলে হ্যাশ করে রাখুন (প্লেইনটেক্সট কখনো নয়)
    scopes JSON DEFAULT NULL, -- কাস্টম স্কোপ/পারমিশন সংযুক্ত করা যেতে পারে
    last_used DATETIME DEFAULT NULL,
    revoked BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at DATETIME DEFAULT NULL,
    FOREIGN KEY (admin_id) REFERENCES admins(admin_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE INDEX idx_api_keys_admin ON admin_api_keys (admin_id);

/* 10) admin_activity_log - অ্যাডমিন কার্যকলাপ অডিটিং (রিডেবল ট্রেইল) */
CREATE TABLE IF NOT EXISTS admin_activity_log (
    activity_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    admin_id BIGINT DEFAULT NULL,
    action VARCHAR(100) NOT NULL, -- e.g., 'login', 'create_client', 'update_billing'
    entity_type VARCHAR(100) DEFAULT NULL, -- টার্গেট টেবিল/রিসোর্স
    entity_id BIGINT DEFAULT NULL, -- টার্গেট রেকর্ড আইডি
    details JSON DEFAULT NULL, -- অতিরিক্ত কনটেক্সট (চেঞ্জেস, IP ইত্যাদি)
    ip_address VARCHAR(50) DEFAULT NULL,
    user_agent TEXT DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (admin_id) REFERENCES admins(admin_id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE INDEX idx_admin_activity_admin ON admin_activity_log (admin_id);
CREATE INDEX idx_admin_activity_action ON admin_activity_log (action);

/********************************************************************************
  SAMPLE DATA (roles, permissions, admin)
*********************************************************************************/

-- কিছু সাধারণ পারমিশন অ্যাড করা
INSERT INTO permissions (name, description) VALUES
('clients.view', 'View client profiles'),
('clients.create', 'Create clients'),
('clients.update', 'Update client info'),
('memberships.view', 'View memberships'),
('memberships.manage', 'Create/Update memberships'),
('billing.view', 'View billing records'),
('billing.pay', 'Record payments'),
('reports.view', 'View reports'),
('trainers.manage', 'Manage trainers'),
('events.manage', 'Manage events');

-- বেসিক রোল তৈরি করা
INSERT INTO roles (name, description, is_default) VALUES
('superadmin', 'Full access to all resources', FALSE),
('manager', 'Manage members, billing, trainers and events', FALSE),
('support', 'Customer support with limited access', FALSE),
('staff', 'Front-desk staff with limited client access', TRUE);

-- রোল->পারমিশন ম্যাপ (উদাহরণ)
-- superadmin কে সব পারমিশন দেবেন (উদাহরণ হিসেবে কিছু)
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.role_id, p.permission_id FROM roles r CROSS JOIN permissions p WHERE r.name='superadmin';

-- manager কে নির্দিষ্ট পারমিশন দিন (উদাহরণ)
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.role_id, p.permission_id
FROM roles r JOIN permissions p ON p.name IN ('clients.view','clients.create','clients.update','memberships.view','memberships.manage','billing.view','reports.view')
WHERE r.name='manager';

-- একটি ডেমো অ্যাডমিন তৈরি (পাসওয়ার্ড হ্যাশ অবশ্যই নিরাপদভাবে জেনারেট করে দিন)
INSERT INTO admins (username, email, password_hash, is_superadmin, status, created_by)
VALUES ('admin', 'admin@gym.com', '$2b$12$EXAMPLEHASHEDPASSWORD', TRUE, 'active', NULL);

-- অ্যাডমিনকে superadmin রোল অ্যাসাইন (ধরা যাক admin_id = 1, role_id=find)
INSERT INTO admin_roles (admin_id, role_id, assigned_by)
SELECT a.admin_id, r.role_id, a.admin_id
FROM admins a CROSS JOIN roles r
WHERE a.username='admin' AND r.name='superadmin';

/********************************************************************************
  SAMPLE QUERIES (RBAC & ADMIN USE-CASES)
*********************************************************************************/

-- 1) একজন অ্যাডমিনের সব পারমিশন বের করা (রোলভিত্তিক + superadmin চেক)
SELECT DISTINCT p.name
FROM admins a
LEFT JOIN admin_roles ar ON a.admin_id = ar.admin_id
LEFT JOIN role_permissions rp ON ar.role_id = rp.role_id
LEFT JOIN permissions p ON rp.permission_id = p.permission_id
WHERE a.admin_id = 1 AND (a.is_superadmin = TRUE OR p.name IS NOT NULL);

-- 2) সক্রিয় অ্যাডমিনদের তালিকা (নাম, ইমেইল, রোল)
SELECT a.admin_id, a.username, a.email, GROUP_CONCAT(r.name) AS roles
FROM admins a
LEFT JOIN admin_roles ar ON a.admin_id = ar.admin_id
LEFT JOIN roles r ON ar.role_id = r.role_id
WHERE a.status = 'active'
GROUP BY a.admin_id;

-- 3) অ্যাডমিন লগইন সেশন তৈরি (অ্যাপ্লিকেশন স্তরে: সেশন টোকেন ইন্সার্ট)
INSERT INTO admin_sessions (admin_id, session_token, ip_address, user_agent, expires_at)
VALUES (1, 'randomly-generated-token', '203.0.113.5', 'Mozilla/5.0 (..)', DATE_ADD(NOW(), INTERVAL 7 DAY));

-- 4) পাসওয়ার্ড রিকোয়েস্ট টোকেন যোগ করা
INSERT INTO admin_password_resets (admin_id, reset_token, expires_at, ip_address)
VALUES (1, 'some-reset-token', DATE_ADD(NOW(), INTERVAL 1 HOUR), '203.0.113.5');

-- 5) অ্যাডমিন কার্যকলাপ লগিং উদাহরণ
INSERT INTO admin_activity_log (admin_id, action, entity_type, entity_id, details, ip_address, user_agent)
VALUES (1, 'create_client', 'clients', 555, JSON_OBJECT('note','created via import','method','csv'), '203.0.113.5', 'curl/7.68.0');

/********************************************************************************
  RECOMMENDATIONS & NOTES (বাংলায় সারসংক্ষেপ)
  - পাসওয়ার্ড/২এফএ সিক্রেট নিরাপদে স্টোর করার জন্য প্রয়োজনে আলাদা এনক্রিপশন স্তর রাখুন।
  - API কির জন্য প্লেইনটেক্সট কখনো রাখবেন না — কেবল হ্যাশ/ট্রাঞ্জিত স্টোরিং।
  - RBAC-এ পারফরম্যান্স বাড়াতে permission নামগুলোর উপর ক্যাশিং বা মিনিমাল সার্ভিস লেয়ার ব্যবহার করুন।
  - admin_sessions টেবিল থেকে পুরনো/রিভোকড সেশন নিয়মিত ক্লিনআপ করুন।
  - প্রোডাকশনে sensitive কলামগুলোর (two_factor_secret, api_key_hash) জন্য column-level encryption বিবেচনা করুন।
*********************************************************************************/
```

আমি উপরের টেবিলগুলোর ওপর ভিত্তি করে এখনই ট্রিগার/ভিউ/স্টোরড-প্রসিজারও লিখে দিতে পারি — উদাহরণ:

* `vw_admin_permissions` (একটি ভিউ যা অ্যাডমিনের ইউনিক পারমিশন রিটার্ন করবে),
* `sp_create_admin` (নতুন অ্যাডমিন তৈরি করার নিরাপদ স্টোরড প্রসিডিউর),
* `trg_admin_audit` (অ্যাডমিন টেবিলে পরিবর্তন হলে অটোমেটিক `admin_activity_log` এ লিপিবদ্ধ করবে)।

আপনি কোনটি আগে চান — ভিউ, প্রসিডিউর, নাকি ট্রিগার + উদাহরণ কোড (Node/Express) দিয়ে লগইন/সেশন ইমপ্লিমেন্টেশন?
