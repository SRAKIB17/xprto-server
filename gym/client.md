# Overview (short)

* Two main roles you mentioned:

  1. **XPRTO Client** — marketplace-level user (can browse gyms, buy XPRTO subscription, book sessions). May belong to multiple gyms.
  2. **XPRTO Gym Client** — client that is enrolled/registered under a particular gym (membership).
* **Gym Owner**: sees and manages **only their gym’s clients** (XPRTO gym clients). **Should NOT** see unrelated XPRTO clients from other gyms or marketplace-only users, unless explicitly linked/invited.
* **Super Admin**: full visibility across platform (all gyms, all XPRTO clients and gym clients), system settings, billing, audit logs.

---

# Module list (for Client Management) — high level

1. **Client Directory / Listing**
2. **Client Profile (full)**
3. **Attendance & Check-in**
4. **Attendance Edit / Dispute**
5. **Health Records & Conditions**
6. **Measurements & Body Composition**
7. **Workout Plans**
8. **Nutrition Plans**
9. **Subscriptions & Plans (which subscription kon niyeche)**
10. **Payments & Billing / Invoices**
11. **Messaging / Chat**
12. **Notifications (system & push)**
13. **Reviews & Ratings**
14. **Files & Attachments (pdf, videos, images)**
15. **Reports & Analytics / Export**
16. **Access Control & Audit Log**
17. **Action Confirmations / Soft-delete / Archival**

---

# For each module — features, UI screens, key actions, sample API endpoints, DB fields

### 1) Client Directory / Listing

**UI:** Search, filter (active/inactive, membership status, subscription, trainer assigned, last check-in, health flags), paginated list, quick actions (message, view profile, add measurement).
**Actions:** View, quick message, assign trainer, enable/disable, export CSV.
**API examples:** `GET /gyms/{gymId}/clients?filter=active&search=rakib`
**DB (client table) key fields:** `id, name, email, mobile, dob, gender, address, gym_id, is_active, joined_at, subscription_id, assigned_trainer_id, last_checkin_at, privacy_optouts`

---

### 2) Client Profile (full)

**UI:** Tabs — Overview, Attendance, Health, Plans & Billing, Workouts, Nutrition, Messages, Files, Notes, Audit history.
**Actions:** Edit profile, upload docs, verify ID, mark VIP, deactivate.
**API:** `GET /clients/{clientId}`, `PUT /clients/{clientId}`, `POST /clients/{clientId}/verify`
**DB fields:** extend `client` with `bio, allergies, emergency_contact, medical_notes, verified_by, verified_at`

---

### 3) Attendance & Check-in

**UI:** Calendar view, daily check-in stream, verified flag, geofence/gps method, QR scan result, manual add.
**Actions:** Auto-checkin, manual add/edit, staff verify, mark absent, export.
**API:** `POST /gyms/{gymId}/attendance` (scan), `PUT /attendance/{id}` (edit)
**DB fields:** `attendance.id, client_id, gym_id, method(QR/GPS/manual), checkin_at, checkout_at, duration, verified_by, verified_at, verification_method, evidence_files[]`

---

### 4) Attendance Edit / Dispute

**UI:** Dispute modal with reason, upload evidence, status (pending/under-review/resolved), internal notes.
**Actions:** Submit dispute (client), staff review, approve/reject, notify client.
**API:** `POST /attendance/{id}/dispute`, `PUT /disputes/{id}/resolve`
**DB fields:** `dispute.id, attendance_id, submitted_by, status, evidence_files, resolved_by, resolved_at, resolution_note`

---

### 5) Health Records & Conditions (critical)

**UI:** Conditions list (chronic/temporary), measurements timeline, verification badge, recommended precautions.
**Actions:** Add condition, edit, verify, delete/soft-delete, note “under treatment”.
**Important:** Prefer **soft-delete / archive** instead of hard delete — keep audit log. Show delete confirmation and reason.
**API:** `POST /clients/{id}/conditions`, `PUT /conditions/{condId}`, `DELETE /conditions/{condId}`
**DB fields:** `condition.id, client_id, name, diagnosed_on, severity(mild/mod/sev), status(under_treatment/recovered), medications, notes, added_by, verified, verified_by, archived, archived_at`

**Sample confirm modal text (you asked):**

* Primary (as you pasted):
  **Are you sure you want to delete Diabetes Type II for client #CL0987 ? This action cannot be undone.**
* Safer alternative (recommended):
  **Archive Condition — Confirm**
  *Are you sure you want to archive “Diabetes Type II” for client #CL0987? Archived conditions are hidden from the client’s active health list but kept for audit. This action can be reversed.*
  Buttons: `[Cancel] [Archive]` (and a small checkbox: `Also notify client`)

---

### 6) Measurements & Body Composition

**UI:** Graphs (weight, BMI, body fat, muscle), measurement cards, method (caliper/ultrasound/device), attachments, trend arrow.
**Actions:** Add measurement, edit, mark verified, export.
**DB fields:** `measurement.id, client_id, type(weight/bmi/bodyfat), value, unit, method, recorded_by, recorded_at, verified`

---

### 7) Workout Plans

**UI:** Program builder (weeks, days), templates, attach demo videos, progress tracking, session history.
**Actions:** Create template, assign to client, duplicate, allow client feedback, request changes.
**API:** `POST /clients/{id}/workout-plans`, `GET /clients/{id}/workout-plans`
**DB fields:** `plan.id, client_id, template_id, name, start_date, end_date, status, exercises[] (reps/sets/tempo/notes), assigned_by`

---

### 8) Nutrition Plans

**UI:** Daily meal plan, macros, calories, meal history, attach files (pdf/pics), trainer notes.
**Actions:** Assign plan, edit, client can mark completed / request changes.
**API:** `POST /clients/{id}/nutrition-plans`
**DB fields:** `nutrition.id, client_id, daily_target{cal,protein,carb,fat}, meals[], start_date, notes`

---

### 9) Subscriptions & Plans (kon subscription niyeche)

**UI:** Show active subscriptions, expiry, auto-renew, next billing date, plan benefits, trials.
**Actions:** Activate, cancel, refund request, change plan, view invoice.
**API:** `GET /clients/{id}/subscriptions`, `POST /subscriptions/{id}/cancel`
**DB fields:** `subscription.id, client_id, plan_id, start_at, end_at, auto_renew, status, price, payment_method, gym_id(optional)`

---

### 10) Payments & Billing / Invoices

**UI:** Invoice list, download PDF, payment method, refund status, payment due warnings.
**Actions:** Generate invoice, mark paid, refund, dispute.
**API:** `GET /clients/{id}/invoices`, `POST /invoices/{id}/refund`
**DB fields:** `invoice.id, client_id, amount, tax, discount, net_amount, issued_at, due_at, status, payment_txn_id`

---

### 11) Messaging / Chat

**UI:** Inbox per client, trainer->client threads, system announcements, attachments, read receipts.
**Actions:** Send message, pinned, templates (e.g., session reminder), block user.
**API:** `POST /conversations/{convId}/messages`, `GET /clients/{id}/conversations`
**DB fields:** `message.id, convo_id, from_id, to_id, body, attachments, read_at, delivered_at`

---

### 12) Notifications

**UI:** Notification center per user, filters (promotion, transactional, attendance), push/sms/email toggles.
**Actions:** Create announcement, schedule, per-client or broadcast, templates.
**API:** `POST /notifications/broadcast`, `POST /notifications/client/{id}`
**Sample templates:**

* Attendance: *You checked in at 06:09 AM — Great job!*
* Payment due: *Payment of ₹1,200 is due on 05 Sep, 2025.*
* Condition added: *Trainer J. Khan added “Diabetes Type II” to your health records.*

---

### 13) Reviews & Ratings

**UI:** Aggregated rating, per-session review, moderator tools (remove abuse), response by gym owner.
**Actions:** Flag, reply, remove.
**API:** `POST /sessions/{id}/review`, `GET /gyms/{id}/reviews`

---

### 14) Files & Attachments

**UI:** File manager inside client profile, tag files (medical, consent, workout demo), file size limits.
**Security:** Only authorized roles can access medical files. S3 with signed URLs recommended.
**DB fields:** `file.id, client_id, type, filename, url, uploaded_by, uploaded_at`

---

### 15) Reports & Analytics

**UI:** Attendance summary (per client), revenue by client, retention, health trends.
**Actions:** Export CSV/PDF, schedule reports.
**API:** `GET /gyms/{id}/reports/attendance?from=...`

---

### 16) Access Control & Audit Log

**UI:** Role management, permission matrix, audit log for deletes/edits (who/when/what).
**Action:** View audit, rollback soft-deletes, force export.
**DB fields:** `audit.id, entity_type, entity_id, action, performed_by, timestamp, old_value, new_value`

---

### 17) Action Confirmations / Soft-delete

**Recommendation:** For sensitive data (medical conditions), use *archive* + audit log and an admin revoke flow rather than immediate hard delete.
**Delete modal text (strong example):**

```
Delete Condition?
Are you sure you want to delete “Diabetes Type II” for client #CL0987?
This action will permanently remove the record and cannot be undone.
[Cancel] [Delete Permanently]
```

Better: replace Delete with Archive and allow restore.

---

# Roles & Permissions (RBAC) — quick mapping

* **Super Admin**

  * View/Edit/Delete: All gyms, clients, payments, subscriptions, global settings.
  * Can hard-delete (but prefer archive).
  * Can see audit logs.
* **Gym Owner / Gym Admin**

  * Access limited to `gym_id` they own.
  * CRUD on gym’s clients, health records, attendance, workouts, nutrition, invoices for their gym.
  * Cannot see marketplace-only XPRTO clients unless linked.
  * Can raise refunds / disputes for their gym clients.
* **Trainer (Gym-level)**

  * View assigned clients, add health records & workout/nutrition notes, add measurements, request verification.
  * Cannot delete verified health records (only gym admin/superadmin).
* **XPRTO Client (marketplace user)**

  * View their own profile, bookings, payments, health data (their own), request edits.
* **Support / Finance / Backoffice**

  * Limited to transactions, disputes, partial client info, but not full medical details unless authorized.

---

# Data privacy & UX notes (must-haves)

* Medical data should be marked **sensitive**: access logs + two-factor for viewing/deleting.
* Provide **consent tracking** — who gave permission to store health data.
* Soft-delete for conditions with restore window (e.g., 30 days) and audit record.
* Notifications for significant changes (e.g., condition added/archived) with opt-out.

---

# Quick implementation checklist (priority)

1. RBAC + gym scoping (Gym Owner only sees gym clients) — **first**.
2. Client profile + audit logging (create/edit/view).
3. Health records module with archive (not hard delete).
4. Attendance flow + dispute handling.
5. Subscriptions & invoice view + payment status.
6. Messaging & notification templates.
7. Reports & exports.

---

# Small extras: sample API endpoint list (compact)

* `GET /gyms/{gymId}/clients`
* `GET /clients/{clientId}`
* `PUT /clients/{clientId}`
* `POST /clients/{clientId}/conditions`
* `PUT /conditions/{id}`
* `POST /conditions/{id}/archive`
* `GET /clients/{id}/attendance`
* `POST /gyms/{gymId}/attendance`
* `POST /attendance/{id}/dispute`
* `GET /clients/{id}/subscriptions`
* `GET /clients/{id}/invoices`
* `POST /conversations/{convId}/messages`
* `POST /notifications/broadcast`

---

If you want I can:

* convert this into a detailed JSON module spec (routes + request/response schemas),
* or produce DB schemas for tables mentioned (`clients`, `conditions`, `attendance`, `subscriptions`, `invoices`, `audit_logs`),
* or make wireframe text for each UI screen (per module).

Which one do you want next?
