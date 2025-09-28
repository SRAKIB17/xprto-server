idempotency_keyহ্যাঁ 👍 আপনার এই `wallets` + `wallet_transactions` schema দিয়েই gym owner (বা অন্য যেকোনো role) এর **payment flow with due/settlement** সুন্দরভাবে handle করা যাবে।

### কিভাবে handle হবে

#### 1. **Gym Owner Payment (for services)**

* ধরুন client service নিল gym থেকে → তখন client wallet থেকে টাকা deduct হবে → gym wallet এ credit হবে।
* Entry হবে দুইটা transaction এ split করে (ledger style):

**Client wallet → debit transaction**

```sql
INSERT INTO wallet_transactions 
(wallet_id, type, amount, balance_after, reference_type, reference_id, status, initiated_by, initiated_role, note)
VALUES 
(:client_wallet_id, 'payment', 500.00, :new_client_balance, 'booking', 'BK123', 'success', :client_id, 'client', 'Payment for Gym Service');
```

**Gym wallet → credit transaction**

```sql
INSERT INTO wallet_transactions 
(wallet_id, type, amount, balance_after, reference_type, reference_id, status, initiated_by, initiated_role, note)
VALUES 
(:gym_wallet_id, 'transfer_in', 500.00, :new_gym_balance, 'booking', 'BK123', 'success', :client_id, 'client', 'Received Payment from Client');
```

---

#### 2. **Due Payment (later settlement)**

কিছু ক্ষেত্রে (e.g. client এখনই টাকা দেয়নি, পরে দেবে বা EMI type) → তখন `hold` বা `pending` status ব্যবহার করবেন।

**Hold Transaction Example:**

```sql
INSERT INTO wallet_transactions 
(wallet_id, type, amount, hold_change, balance_after, reference_type, reference_id, status, initiated_by, initiated_role, note)
VALUES 
(:client_wallet_id, 'hold', 500.00, 500.00, :new_balance, 'booking', 'BK123', 'pending', :client_id, 'client', 'Hold for Gym Service');
```

👉 যখন payment confirm হবে → `release_hold` দিয়ে সেটা adjust করে actual debit করবেন।

---

#### 3. **Admin Adjustments (manual add/remove)**

Admin চাইলে সরাসরি টাকা add/remove করতে পারবে (due settlement, offer, bonus ইত্যাদি):

```sql
INSERT INTO wallet_transactions 
(wallet_id, type, amount, balance_after, reference_type, reference_id, status, initiated_by, initiated_role, note)
VALUES 
(:gym_wallet_id, 'adjustment', 1000.00, :new_balance, 'admin_action', NULL, 'success', :admin_id, 'admin', 'Manual Adjustment for Due Payment');
```

---

✅ এর মানে আপনার schema already flexible enough:

* Direct payment (immediate debit/credit)
* Due payment (hold → release later)
* Manual admin adjustments

---

চাইলে আমি এগুলো utility function আকারে লিখে দিতে পারি যেমন:

```ts
await addPayment(clientWallet, gymWallet, amount, bookingId);
await addDue(clientWallet, amount, bookingId);
await settleDue(clientWallet, gymWallet, amount, bookingId);
await adminAdjust(gymWallet, 1000, "Manual settlement");
```

চাইলে কি আমি এগুলো TypeScript utility functions সহ লিখে দিই আপনার backend-এর জন্য?
