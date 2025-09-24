# MySQL schema — Wallet + Transactions (পূর্ণ রিয়েল-ওয়ার্ল্ড প্রস্তুত)

নীচে একটি সম্পূর্ণ, প্র্যাক্টিকাল MySQL `wallets` + `wallet_transactions` schema দিলাম — audit, metadata, ব্যালান্স ট্র্যাকিং, এবং নিরাপদ (transaction-safe) আপডেট করার জন্য প্রয়োজনীয় ইনডেক্স ও কনস্ট্রেইন্ট সহ। উদাহরণে আপনি যে অবজেক্টটা দিয়েছেন (`TXN-10001`) সেটার জন্যও একটি sample insert transaction দিলাম।

> নোট: কোড কপি করে আপনার ডাটাবেসে পাবলিক/প্রাইভেট ইউজার টেবিলের নাম অনুযায়ী `users(id)` রেফারেন্স ঠিক করে নিবেন। multi-currency হলে `currency_code` ব্যবহার করে হিসাব রাখুন — `currency_symbol` মাত্র ডিসপ্লে-এর জন্য।

---

# Schema SQL

```sql
-- Optional: যদি users টেবিল না থাকে তাহলে এটাই ব্যবহার করুন (অথবা আপনার বিদ্যমান users টেবিলকে refer করুন)
CREATE TABLE IF NOT EXISTS users (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255),
  email VARCHAR(255) UNIQUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- Wallets table: এক ইউজারের এক বা একাধিক কারেন্সির জন্য ওয়ালেট ধরে রাখবে
CREATE TABLE IF NOT EXISTS wallets (
  wallet_id BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT NOT NULL,
  currency_code CHAR(3) NOT NULL DEFAULT 'INR',     -- ISO code (INR, USD...)
  currency_symbol VARCHAR(8) NOT NULL DEFAULT '₹',  -- প্রদর্শনের জন্য
  balance DECIMAL(18,2) NOT NULL DEFAULT 0.00,      -- বর্তমানে থাকা ব্যালান্স
  reserved_amount DECIMAL(18,2) NOT NULL DEFAULT 0.00, -- অসম্পন্ন (hold) পরিমাণ
  status ENUM('active','disabled','suspended','closed') NOT NULL DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uk_user_currency (user_id, currency_code),
  INDEX idx_user (user_id),
  CONSTRAINT fk_wallets_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Transaction history table: প্রতিটি টিকিট/ট্রাঞ্জ্যাকশনের রেকর্ড
CREATE TABLE IF NOT EXISTS wallet_transactions (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,               -- internal PK
  txn_id VARCHAR(64) NOT NULL UNIQUE,                 -- external txn id (e.g. TXN-10001)
  wallet_id BIGINT NOT NULL,                          -- wallets.wallet_id
  user_id BIGINT NOT NULL,                            -- repeated for quick queries
  type ENUM('deposit','withdrawal','transfer','payment','refund','adjustment') NOT NULL,
  method ENUM('card','bank','upi','wallet','cash','netbanking','cheque','other') NOT NULL,
  title VARCHAR(255) NOT NULL,                        -- display title, ex: "Top-up (Card)"
  amount DECIMAL(18,2) NOT NULL,                      -- positive amount
  currency_code CHAR(3) NOT NULL DEFAULT 'INR',
  currency_symbol VARCHAR(8) NOT NULL DEFAULT '₹',
  status ENUM('pending','processing','completed','failed','cancelled') NOT NULL DEFAULT 'completed',
  balance_before DECIMAL(18,2) NULL,                  -- optional snapshot
  balance_after DECIMAL(18,2) NULL,                   -- optional snapshot
  reference_id VARCHAR(128) NULL,                     -- gateway txn id / order id
  note TEXT NULL,                                     -- human-friendly note
  metadata JSON NULL,                                 -- gateway payload, webhooks, etc.
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  processed_at TIMESTAMP NULL,                        -- when completed/processed
  INDEX idx_user_id (user_id),
  INDEX idx_wallet_id (wallet_id),
  INDEX idx_type_status (type, status),
  CONSTRAINT fk_tx_wallet FOREIGN KEY (wallet_id) REFERENCES wallets(wallet_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Optional audit table for immutable logs (if you want separate append-only audit)
CREATE TABLE IF NOT EXISTS wallet_transaction_audit (
  audit_id BIGINT AUTO_INCREMENT PRIMARY KEY,
  txn_id VARCHAR(64) NOT NULL,
  event_type VARCHAR(64) NOT NULL,
  payload JSON NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX (txn_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

---

# কিভাবে নিরাপদভাবে (ACID) deposit বা withdrawal করবেন

নিচের SQL ব্লকটি দেখায় কিভাবে `START TRANSACTION` ব্যবহার করে balance লক করে আপডেট করে এবং transaction রেকর্ড insert করবেন — একসাথে commit/rollback করলে ডাটা consistent থাকবে।

```sql
-- Example: Safe deposit transaction (পাইথন/ব্যাকএন্ড থেকে prepared statements ব্যবহার করুন)
START TRANSACTION;

-- 1) wallet লক করে বর্তমান ব্যালান্স নিয়ে আসা
SELECT balance
FROM wallets
WHERE wallet_id = 1
FOR UPDATE;

-- suppose current balance fetched into server-side variable @bal (e.g. 2000.00)
-- 2) আপডেট ব্যালান্স
UPDATE wallets
SET balance = balance + 1500.00,
    updated_at = CURRENT_TIMESTAMP
WHERE wallet_id = 1;

-- 3) insert transaction record
INSERT INTO wallet_transactions (
  txn_id, wallet_id, user_id, type, method, title,
  amount, currency_code, currency_symbol,
  status, balance_before, balance_after, reference_id, note, metadata, processed_at
) VALUES (
  'TXN-10001', 1, 123, 'deposit', 'card', 'Top-up (Card)',
  1500.00, 'INR', '₹',
  'completed', 2000.00, 3500.00, 'GW-REF-7890', 'Card ending ••••4242', JSON_OBJECT('gateway','stripe'), NOW()
);

COMMIT;
```

> ব্যাখ্যা: উপরের ব্লকে `SELECT ... FOR UPDATE` নিশ্চিত করে যে concurrent update ঘটবে না। ব্যালান্স গণনা সার্ভার-সাইডে করা উচিত (DB-scripting or application logic)। সব সময় prepared statement ব্যবহার করুন — SQL injection থেকে বাঁচাতে।

---

# আপনার দেয়া example টির জন্য sample INSERT (assume wallet\_id=1, user\_id=123)

```sql
-- sample INSERT matching your example object
INSERT INTO wallet_transactions (
  txn_id, wallet_id, user_id, type, method, title,
  amount, currency_code, currency_symbol,
  status, balance_before, balance_after, note, metadata, processed_at
) VALUES (
  'TXN-10001',
  1,              -- wallet_id (উদাহরণ)
  123,            -- user_id (উদাহরণ)
  'deposit',
  'card',
  'Top-up (Card)',
  1500.00,
  'INR',
  '₹',
  'completed',
  0.00,           -- যদি পূর্বের ব্যালান্স জানা থাকে তা দিন
  1500.00,
  'Card ending ••••4242',
  JSON_OBJECT('raw_payload', 'পছন্দ মত তথ্য রাখা যাবে'),
  '2025-09-01 09:12:00'
);
```

---

# অতিরিক্ত সুপারিশ (best practices)

* **Currency logic:** গণনা সবসময় `currency_code` ব্যবহার করে করুন; `currency_symbol` শুধু UI-তে দেখাবেন।
* **Precision:** ছোট মুদ্রার জন্য `DECIMAL(18,2)` ভালো; কিন্তু যদি প্ল্যাটফর্মে সেন্ট/পাইসা সহ fractional precision প্রয়োজন হয়, adjust করে `DECIMAL(20,4)` ইত্যাদি ব্যবহার করুন।
* **Indexes:** `txn_id` unique রাখতে হবে, `user_id` ও `wallet_id`-এ index দিন দ্রুত কুয়েরির জন্য।
* **Idempotency:** পেমেন্ট গেটওয়ের webhook/response-পালটে idempotency token/txn\_id চেক করুন যেন duplicate ইনসার্ট না হয়।
* **Retention / GDPR:** ব্যক্তিগত metadata যদি থাকে encrypt বা redact করুন।
* **Testing:** concurrency test চালান (many parallel deposits/withdrawals) — race condition এ guard করুন (`SELECT ... FOR UPDATE` বা optimistic locking)।
* **Audit trail:** critical ফাইনান্সিয়াল সিস্টেমে append-only audit টেবিল রাখুন (journaling).

---

আপনি চাইলে আমি আপনার বিদ্যমান `users` টেবিল স্ট্রাকচার অনুযায়ী FK ঠিক করে দেব, বা একই সঙ্গে একটি stored procedure / prepared statement দিয়ে deposit/withdrawal function লিখে দিতে পারি। বললেই করে দিচ্ছি — কি চান?
