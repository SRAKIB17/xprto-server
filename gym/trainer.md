
# সারসংক্ষেপ

* **মডিউলগুলো:** Payments & Invoices, Commission Engine, Payouts & Withdrawals, Earnings Dashboard, KYC, Payout History, Shift & Attendance (QR/NFC/Geo), Shift Editor, Leaves & Payroll, Alerts & Rules, Reports/Exports.
* প্রতিটি মডিউলের জন্য: UI স্ক্রীন/কম্পোনেন্ট, সাব-ফাংশনালিটি, প্রস্তাবিত API, প্রয়োজনীয় DB ফিল্ড, রোল-ভিত্তিক পার্মিশন / নোটস।

---

# 1 — Payments & Invoices

**UI screens / components**

* Transactions Table (filter: status, date range, client/trainer/gym, method)
* Invoice Detail Modal / Page (Download PDF, Retry Payment, Refund)
* Quick Action Buttons: Mark Paid, Resend Invoice, Create Invoice
* Small stat cards: Total Revenue, Pending, Failed, Refunded

**Submodules / features**

* Create / Issue Invoice (auto-generate from booking)
* Payment gateway integrations (Razorpay / UPI / Card / Netbanking)
* Refund / Partial refund flow
* Retry failed payments (with reason)
* Taxes & Discounts handling

**API examples**

* `GET /payments?status=completed&from=2025-07-01&to=2025-07-31`
* `GET /invoices/{invoiceId}`
* `POST /invoices` (payload: clientId, items\[], tax, dueDate)
* `POST /payments/{paymentId}/refund` (body: amount, reason)

**DB (core fields)**

* payments: `id, invoice_id, client_id, gym_id, amount, currency, method, status, txn_id, gateway_response, created_at`
* invoices: `id, client_id, issued_at, due_at, total, tax, discount, status, pdf_url`

**Permissions**

* GymOwner: view/pay/issue for own-gym invoices
* SuperAdmin: full access

---

# 2 — Commission Engine

**UI**

* Commission Settings Page (global & gym-level) — set % split per service type
* Commission Rate History log (who changed when)
* Commission preview on transaction modal

**Submodules**

* Global platform fee (e.g., 20%)
* Per-gym override (e.g., gym keeps 60% or trainer 50/50)
* Per-service overrides (doorstep vs online)
* Commission on cancellations/refunds (rules: full/partial/none)

**API**

* `GET /commissions?gymId=`
* `PUT /commissions/{id}`

**DB**

* commission\_rates: `id, entity_type (platform/gym/trainer), entity_id, service_type, percentage, effective_from, effective_to, created_by`

**Notes**

* Compute net payout as: `net = amount - platform_fee - tax - other_fees`. Keep line-items in invoice.

---

# 3 — Payouts & Withdrawals (Payout History)

**UI**

* Payout Requests List (status: pending, processing, completed, failed)
* Payout Detail Modal (bank details, fees, gateway ref, retry)
* Request Payout form (amount, method: Razorpay/Bank/Wallet)
* Recent Payouts chart / table

**Submodules**

* Create payout request
* Auto-batch payouts (daily/nightly) to Gateway
* Retry failed payouts + manual override
* Minimum withdraw amount, fee display

**API**

* `POST /payouts` (trainerId, amount, method, bankDetails)
* `GET /payouts?trainerId=&status=`
* `PUT /payouts/{id}/confirm` (admin)

**DB**

* payouts: `id, recipient_id, recipient_type (trainer/gym), amount, fee, net_amount, method, status, gateway_ref, requested_at, processed_at, processed_by, failure_reason`

**Permissions**

* Trainer: request, view own
* GymOwner: view own-gym trainers’ payouts (optional)
* Finance / SuperAdmin: approve/process

---

# 4 — Earnings Dashboard

**UI**

* Stat cards: Total Earnings, Pending Payouts, Completed, Available Balance
* Revenue Trend chart (month/week/day)
* Revenue Breakdown by source (subscriptions, sessions, products)
* Recent Transactions list

**Components**

* Chart component (line for trend, donut for breakdown)
* Filters: date range, source, gym/trainer

**API**

* `GET /earnings/summary?trainerId=&from=&to=`
* `GET /earnings/trend?period=monthly`

**DB**

* earnings\_ledger: `id, owner_id, type(income/payout/commission/refund), amount, balance_after, txn_id, created_at, meta`

**Notes**

* Keep ledger for audit; do not compute balance from transactions on the fly to avoid discrepancies.

---

# 5 — Shift Editor (Drag & Drop)

**UI**

* Calendar Grid (week/day view) with draggable slots
* Left panel: Templates / Rules / Existing shifts
* Right-click menu: Duplicate, Bulk-assign, Apply Template
* Bulk actions: Apply leave, Block slot, Set capacity

**Interactions**

* Drag to move shift; drag edges to resize.
* Multi-select shifts and bulk-apply rules.
* Modal for shift details (name, trainers\[], min\_hours, grace\_period, auto-mark rule, capacity, location, online flag)

**API**

* `GET /shifts?gymId=&from=&to=`
* `POST /shifts` (bulk allowed)
* `PUT /shifts/{id}` (move/resize)
* `DELETE /shifts/{id}`

**DB**

* shifts: `id, gym_id, title, start_at, end_at, trainers[], min_hours, grace_seconds, auto_mark_after_seconds, capacity, recurrence, created_by`

**Frontend tips**

* Use drag-drop lib (eg. FullCalendar / react-big-calendar) with custom drag handles.
* Persist optimistic updates, validate conflicts server-side.

---

# 6 — Attendance (QR / NFC / Geo / Manual)

**UI**

* Live Attendance Feed (last scans)
* Check-in modal with method selection (QR/NFC/Geo/Manual)
* Attendance detail page (map heatmap, device metadata, duration)
* Dispute modal for clients

**Flow & Security**

* Signed payload for auto-checkin: `{clientId, gymId, timestamp, deviceId, lat, lng, signature}` — server validates JWT + signature + timestamp window to prevent spoofing.
* Auto-checkout rules: auto-close after X mins of inactivity.

**API**

* `POST /attendance/scan` (signed)
* `POST /attendance/manual` (staff)
* `PUT /attendance/{id}` (edit)
* `POST /attendance/{id}/dispute`

**DB**

* attendance: `id, client_id, gym_id, method, checkin_at, checkout_at, duration_minutes, device_meta(json), gps_points(json), verified_by, verified_at, status`
* attendance\_evidence: `id, attendance_id, file_url, type`

**Rules**

* Auto-mark rule example: `min_minutes_in_radius = shift_length * 0.75`
* Grace window config per gym.

---

# 7 — Leaves, Payroll & Shift Rules

**UI**

* Leave requests list (approve/reject)
* Payroll adjustments modal (retro pay, unpaid days)
* Rule Engine UI: create rule (conditions + actions)

**Rule Examples**

* If `avg_rating < 3.5` for 7 days -> Notify Owner + Escalate to HR
* If `negative reviews > 5` in 7 days -> Flag account

**API**

* `POST /leaves`
* `PUT /leaves/{id}/approve` (payload: payroll\_flag, admin\_note)
* `GET /payroll?trainerId=&month=`

**DB**

* leaves: `id, trainer_id, from_date, to_date, type, attachments[], status, payroll_flag, admin_note`
* payroll\_lines: `id, trainer_id, month, earnings, deductions, net, status`

---

# 8 — KYC & Verification

**UI**

* KYC Wizard: upload front/back government ID, selfie, bank proof
* KYC status badges: Pending / Verified / Rejected
* Retry flow with reason

**API**

* `POST /kyc/{userId}` (multipart)
* `GET /kyc/{userId}`

**DB**

* kyc: `id, user_id, id_type, id_front_url, id_back_url, selfie_url, status, verifier_id, verified_at, reason`

**Notes**

* Integrate document OCR & third-party ID verification if available.
* KYC status affects payout (disallow withdraw if KYC\_rejected).

---

# 9 — Alerts, Thresholds & Automation

**UI**

* Alerts configuration (create rule, choose action channels)
* Notifications center with filter by channel (email, SMS, in-app)

**Actions**

* Notify owner, Notify HR, Auto-suspend, Auto-escalate, Webhook

**API**

* `POST /alerts`
* `GET /alerts`
* `POST /alerts/trigger` (internal/webhook)

**DB**

* alerts: `id, name, condition_json, actions_json, created_by, is_active`

---

# 10 — Reports & Exports

**UI**

* Export panel: choose report (payouts, attendance, revenue, KYC), format (CSV/XLS/PDF), schedule
* Downloadable statements per trainer/gym

**API**

* `POST /reports/generate` (payload: reportType, filters, format)
* `GET /reports/{id}/download`

**DB**

* reports: `id, report_type, filters_json, status, file_url, requested_by, created_at`

---

# Frontend Component Library (recommended)

* `StatCard` (title, value, delta, icon)
* `DataTable` with server-side pagination, sorting, multi-filters
* `Modal` (confirm + form)
* `ShiftCalendar` (wraps FullCalendar)
* `QRScanner` (mobile/native wrapper)
* `FileUploader` (chunked, progress, allowed types)
* `Chart` (line / donut, controlled via API)
* `Toast` / `Snackbar` for success/errors
* `KYCWizard` (stepper)
* `PayoutForm` (validation, bank details masked)
* `AuditTrail` viewer

---

# UX Patterns / Edge Cases (important)

* **Soft delete & audit:** never hard-delete payments or KYC docs; archive with `archived_by` & `archived_at`.
* **Idempotency:** make payment / payout endpoints idempotent (client-generated idempotency key).
* **Race conditions:** batch payout processing must lock recipient to prevent double-pay.
* **Dispute windows:** set 72-hour window for attendance disputes for fast-tracking.
* **Retry & fees:** when retrying a failed payout, show fee impact.
* **Security:** signed payloads for geo checks, store GPS accuracy, device meta, mask sensitive data in UI.
* **Data retention & compliance:** keep financial records for required years, KYC storage rules.

---

# Quick Priority roadmap (for dev sprints)

1. Payments + Invoices CRUD + Payment gateway hookup + ledger.
2. Commission Engine basic (platform % + gym override).
3. Payout request flow + admin approval + payout history.
4. Earnings Dashboard + ledger reconciliation.
5. Shift Editor + Attendance signed-scan endpoints.
6. Leaves & Payroll integration.
7. KYC flow + payouts gating.
8. Alerts/Rules/Reports.

---

# Example: Minimal API contract (compact)

```json
GET /payouts?recipientId=TRN-1021&status=pending
POST /payouts
{
  "recipientId":"TRN-1021",
  "amount":2400,
  "method":"bank",
  "bankDetails":{ "ifsc":"HDFC0001","acc":"****1234","name":"Jane Doe" },
  "idempotencyKey":"req_20250820_01"
}
PUT /payouts/{id}/process { "action":"approve","processedBy":"admin_1" }
```

---
