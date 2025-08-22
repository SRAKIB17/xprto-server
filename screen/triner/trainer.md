Nice — I built a **much more powerful, exhaustive, production-ready expansion** of your Trainer App flow.
Below you’ll get:

* a complete, module-by-module **screen inventory** (every screen you’ll need: add/update/edit/assign flows),
* for each screen: **purpose, UI components, required actions (CRUD)**, **backend endpoints**, **validation & edge cases**, **permissions**, and **UX notes** you can hand straight to designers & devs, and
* suggested **data-model / new-tables** and **events / notifications** to wire everything end-to-end.

I organized it so you can copy each screen into Figma, then wire interactions and APIs easily. I kept the Trainer App primary color `#001743` and mobile-first UX in mind.

---

# 1 — How to use this doc

1. Treat each bullet as one Figma screen (or drawer/modal) to design.
2. Use the API examples as dev contract (REST style). Replace with GraphQL if you prefer.
3. Each screen lists required permissions (superadmin, gym\_owner, trainer, client). Use RBAC.
4. If you want, I can now auto-generate **SVG mockups** for any subset of these screens. Tell me which screens and I’ll output Figma-ready SVGs next.

---

# 2 — Full expanded screen inventory + details

> I list modules in the same order as your flow. Under each module: screens, purpose, components, actions, sample API endpoints & payloads, validation, notes & edge cases.

---

## Module A — Authentication (complete)

**Screens**

* A1. Login (Email/Phone + Password) — states: invalid, locked, 2FA required

  * Components: inputs, show/hide, social login buttons, create account link, forgot password link, error banners, password strength hint
  * Actions: `POST /auth/login` → returns token, 2FA requirement
  * Error handling: rate limit, account locked, unverified email
  * Permissions: public
* A2. OTP Verification (6-digit)

  * Components: 6 discrete inputs, resend timer, resend button, “change number”
  * Actions: `POST /auth/verify-otp`
  * Validation: allow 6 digits, throttle resend (60s), show resend countdown
* A3. Forgot Password — Step flow (enter email/phone → send OTP → verify → set new password)

  * Screens: FP-Step1 (enter email/phone), FP-Step2 (OTP), FP-Step3 (set password)
  * Actions: `POST /auth/forgot` → `POST /auth/verify-otp` → `POST /auth/reset-password`
  * Validation: password rules, password reuse check
* A4. Change Password (settings)

  * Components: old/new/confirm, validate old password on submit
  * Action: `PUT /auth/change-password`
  * Notes: invalidate other sessions on password change (option)
* A5. Account Creation (if allowed)

  * Full onboarding form (basic profile + ID upload optional)
  * Actions: `POST /auth/register`
  * Email/mobile verification flows

---
Got it ✅ — I’ll break **Module C — Attendance & Shift** into **clear screen-by-screen UI flows**, so you can directly design/implement each.
This will cover trainer + admin contexts (since shifts often involve assignment + approvals).

---

## Module B — Trainer Home Dashboard (your #2)

**Screens**

* B1. Home (summary)

  * Components: today’s sessions list (card per session), earnings summary (today/month), attendance badge, notifications feed, quick action buttons
  * Actions: open session → Session Detail; quick actions call endpoints below
  * APIs: `GET /trainer/dashboard` returns sessions, earnings, notifications, attendanceState
* B2. Notifications Center (full)

  * Filter by type; mark read/unread; bulk actions
  * `GET /notifications?scope=trainer`
  * `POST /notifications/mark-read`
* B3. Quick Action Flows

  * “Mark Attendance” → opens Attendance module flow
  * “View Clients” → Clients list
  * “View Earnings” → Earnings dashboard (Module H)

**UX Notes**

* Real-time updates via WebSocket for incoming bookings and live check-in state.
* Show skeleton loaders for network-dependent widgets.

---

# **Attendance & Shift — Full Screens**

---

## **C1. GPS Live Status Screen**

* **Top Card (always visible in dashboard)**

  * Status: ✅ Inside Gym / ❌ Outside Gym
  * Distance: “You are 125m away from gym”
  * Battery % + GPS Permission toggle
  * Timestamp of last sync

* **Expanded View**

  * Map view with trainer pin + gym radius
  * Live WebSocket status → Auto-updates without refresh
  * Error states:

    * "GPS disabled, enable location to continue"
    * "Weak GPS signal"

---

## **C2. Auto Check-in / Check-out Flow**

* **UI Behavior:**

  * Floating toast card → “✅ Auto checked-in at 10:02am”
  * Badge changes on top status bar: *“You’re Checked In”*
  * Exit → “⏹ Checked out at 6:01pm”

* **Logs Section (in same screen):**

  * Last 3 auto check-ins/out with timestamps
  * API fallback if WebSocket lost

---

## **C3. Manual Check-in Modal**

* **Modal Fields:**

  * Dropdown → Reason for manual check-in (GPS Off, Outside Gym, Device Issue)
  * Upload photo (optional)
  * PIN field (if gym requires extra auth)
  * Submit button

* **Validation States:**

  * If outside radius → Reason becomes **mandatory**
  * Error toast: “Please provide a reason before submitting”

* **Success State:**

  * “Manual Check-in requested. Pending admin approval.”

---

## **C4. Shift Schedule Calendar**

* **Views:**

  * **Day / Week / Month toggle**
  * Calendar grid with shifts as colored blocks
  * Trainers’ initials/photos in assigned slot

* **Actions:**

  * **Drag & Drop shifts**
  * **+ Add Shift Button** → Create Shift Modal

    * Title: Morning / Evening / Night
    * Time: Start–End
    * Assign Trainers (multi-select)
  * Edit/Delete shift → via long press / right-click

* **UX Enhancements:**

  * Color coding:

    * Morning = yellow
    * Evening = blue
    * Night = purple
  * Recurrence editor: repeat daily, weekly

---

## **C5. Attendance History Screen**

* **Filters:**

  * Date range picker
  * Status filter → Qualified / Not-qualified / Manual override
  * Export → CSV / PDF

* **List View (mobile friendly):**

  * Row → Date | Entry | Exit | Duration | Status badge
  * Badge → ✅ Qualified / ⚠ Not Qualified / 📝 Corrected

* **Calendar View:**

  * Days highlighted by attendance status
  * Tap → detail modal

---

## **C6. Attendance Detail Screen (per day/session)**

* **Header:** Date (20 Aug, Tue) + Status Badge

* **Sections:**

  * Entry Time → Exit Time
  * Total Hours worked (with qualified % rule applied)
  * Map snapshot → GPS route/heatmap
  * Device Metadata → IP, Device ID, OS
  * Notes: Manual override log

* **Actions:**

  * “➕ Add Note”
  * “Request Correction” → triggers workflow to admin

---

## **C7. Shift Editor (Full-Screen Advanced Tool)**

* **Grid View:**

  * Trainers on Y-axis, Time on X-axis
  * Shifts = draggable blocks
  * Resize by dragging ends

* **Shift Rules Section:**

  * Min hours (e.g. 4h)
  * Grace period (e.g. 10 mins late ok)
  * Auto-mark absent if < X minutes

* **Bulk Tools:**

  * Apply template → (Morning 6–12 for all trainers this week)
  * Copy shifts from last week
  * Delete multiple shifts

---

## Module D — Client Management (your #4) — expanded

**Screens**

* D1. Assigned Clients List (table + cards)

  * Search, advanced filter (age, gender, progress, last visit), bulk message
  * APIs: `GET /trainer/{id}/clients`
* D2. Client Profile (tabbed)

  * Tabs: Overview, Health Stats, Plans, Attendance, Sessions, Payments, Notes, Documents
  * Actions: Edit profile, assign/unassign trainer, export PDF
  * APIs: `GET /clients/{id}`, `PUT /clients/{id}`
* D3. Health Stats & Measurements (charts)

  * Weight log, BMI, body parts (arms/waist/leg), skeletal muscle/fat (from your tables)
  * Actions: add measurement, edit, import CSV
  * APIs: `GET /clients/{id}/metrics`, `POST /clients/{id}/metrics`
* D4. Assign/Modify Plans (Workout & Diet)

  * Choose template or build custom; schedule start/end; assign trainer(s)
  * APIs: `POST /clients/{id}/plans`, `PUT /plans/{planId}`, `DELETE /plans/{planId}`
* D5. Progress Tracking (step-by-step)

  * Components: checkboxes for completed workouts, adherence %, notes, photos
  * Actions: update progress → triggers badges & notifications
  * APIs: `POST /clients/{id}/progress`
* D6. Client Notes (private)

  * Add/edit/delete notes (private to trainer + optional share to owner)
  * API: `POST /clients/{id}/notes`
* D7. Client Documents

  * Upload/preview ID, medical certificates, ECGs etc.
  * API: `POST /clients/{id}/documents`

**UX**

* Show earliest/target goals and completion % on profile header.
* Allow export client package (profile + plans + progress) for handover.

---

## Module E — Workout & Diet Plans (your #5) — expanded plan-builder

**Screens**

* E1. Plan Library (templates)

  * Browse pre-made templates, search by goal (mass, cut, rehab), preview
  * API: `GET /plans/templates`
* E2. Plan Builder (full-screen, drag & drop)

  * Day-grid on left, exercise palette on right
  * Exercise card: name, sets, reps, tempo, rest, notes, video link, equipment
  * Save as template / assign to client
  * API: `POST /plans` with nested Day -> Exercises JSON
* E3. Macro/Diet Builder

  * Per day: meals (breakfast/lunch/etc.), calories, macros, recipe link, portion sizes
  * Food DB search & add (optional external food DB integration)
  * APIs: `GET /fooddb?query=`, `POST /clients/{id}/diet-plans`
* E4. Assign Plan Confirmation

  * Schedule, trainer note, reminders, auto-check progress
  * API: `POST /clients/{id}/plans/assign`
* E5. Client Plan View (client-facing)

  * Day-by-day checklists, video demo, mark as done, skip, provide feedback
  * API: `GET /clients/{id}/plans/current`, `POST /clients/{id}/plans/{id}/complete-day`
* E6. Plan History & Analytics

  * Completion %, adherence, changes log, trend charts

**Data payload example (Plan create)**:

```json
{
  "client_id": 123,
  "title": "Hypertrophy 8-week",
  "start_date": "2025-09-01",
  "end_date": "2025-10-26",
  "days": [
    { "day": "Mon", "exercises":[{"name":"Bench Press","sets":4,"reps":"8-10","rest":90}] },
    ...
  ]
}
```

**Validation**

* Avoid overlapping plan assignments, validate daily calories <= some limit (optional).

---

## Module F — Schedule Management (your #6)

**Screens**

* F1. Calendar (Day/Week/Month) — all classes & PT bookings

  * Toggle views: personal trainer bookings vs group classes
  * Bulk actions: cancel, reschedule, notify clients
* F2. Booking Requests (inbox)

  * Approve/Reject with reason; set status; propose alternate slots
  * API: `GET /bookings/requests`, `POST /bookings/{id}/approve`
* F3. Confirmed Sessions List

  * Past / upcoming, quick actions (message client, view client profile)
* F4. Booking Flow (client-facing)

  * Request screen includes trainer availability, required payments, notes
  * Payment integration: link to subscriptions/payments endpoints
* F5. Session Reminder Settings

  * Auto notifications toggle (e.g., 30m/60m prior), SMS/Push/Email options

**Edge cases**

* Double-booking detection: warn or block.
* No-show handling & auto penalties (configurable).

---

## Module G — Performance & Ratings (your #7)

**Screens**

* G1. My Ratings (summary)

  * KPI: avg score, positive/negative counts, recent reviews
* G2. Ratings Trend (graph)

  * Weekly / monthly drilldown, filter by class/client
* G3. Feedback List

  * View, reply to client, escalate to owner
  * API: `GET /feedback?trainerId=`
* G4. Reply Drawer / Feedback Detail

  * Reply + optional template responses; publish updates shown in client app
* G5. Alerts & Thresholds (settings)

  * Create rules: if avg < 3.5 => notify owner; negative reviews > X in 7 days => alert HR

**Data**

* Store feedback with anonymization option.
* Provide sentiment classification (future enhancement).

---

## Module H — Earnings & Payroll (your #8) — trainer view + owner interactions

**Screens**

* H1. Earnings Dashboard (trainer)

  * Graph: monthly earnings, filters, export
  * Breakdown: salary, commissions, product sales
  * API: `GET /trainer/{id}/earnings?range=`
* H2. Commission Details

  * Per client commission calculation, percentage splits, product commissions
  * API: `GET /commissions?trainerId=`
* H3. Payout History

  * Transactions list with status, bank details masked, export
  * API: `GET /payouts?trainerId=`
* H4. Salary / Slip (download)

  * PDF generator: `GET /payouts/{id}/pdf`
* H5. Request Payout (trainer)

  * Manual request: `POST /payouts/withdraw`
  * Admin approves via owner dashboard

**Important**

* Always mask sensitive banking data and use 2FA for payout approvals.
* Support currency localization & taxes (TDS etc).

---

## Module I — Leave & Requests (your #9) — trainer flows + HR tie-in

**Screens**

* I1. Apply Leave (form)

  * Inputs: from/to, type, reason, attach docs, paid/unpaid toggle
  * API: `POST /leaves`
* I2. Leave Status (list)

  * See approved/pending/rejected, comments from admin
  * API: `GET /leaves?trainerId=`
* I3. Leave History (profile)

  * Integrated with payroll: show adjustments & salary impact
* I4. Manager Inbox (owner)

  * Approve/Reject, mark paid/unpaid, add admin note
  * API: `PUT /leaves/{id}/approve` with payroll flag

**Edge cases**

* Retroactive leaves require audit reason & attachment.
* Overlapping leaves validation.

---

## Module J — Communication & Support (your #10)

**Screens**

* J1. 1:1 Chat (trainer <> client <> owner)

  * Features: text, images, attachments, read receipts, typing indicator
  * API/WebSocket: `/ws/chat` and `POST /messages`
* J2. Group Chat (class-based)

  * Roles: owner/moderator, ability to mute/kick
* J3. Support Center (trainer)

  * Raise Ticket: category, priority, attachments
  * Track status: Open / In Progress / Resolved
  * API: `POST /tickets`, `GET /tickets/{id}`
* J4. Chat Message Moderation (owner)

  * Flag messages, export transcripts, attach to tickets

**Security**

* Rate limiting, file scan (virus), content moderation (profane words).

---

## Module K — Notifications (your #11)

**Screens**

* K1. Notifications List (trainer)

  * Filter by sessions/earnings/clients/support
  * Bulk mark read, settings link
* K2. Notification Settings

  * Toggle push/sms/email per event type; quiet hours
* Server side:

  * Events: attendance, booking, payment, feedback => push/email/sms
  * API endpoints: `POST /notifications/send`, `GET /notifications`, `PUT /notifications/{id}/read`

---

## Module L — Settings & Preferences (your #12)

**Screens**

* L1. App Preferences

  * Theme: dark mode toggle (persist)
  * Font size / accessibility
* L2. Privacy

  * Location sharing: ON only when checked (explain battery/GPS usage)
  * Profile visibility: public/private
* L3. Security

  * 2FA enable/disable (SMS/Authenticator)
  * Active sessions (logout all)
* L4. Integrations

  * Payment methods, food DB, analytics toggles
* L5. Logout confirmation modal

---

## Module M — Extra advanced modules (recommended — powerful upgrades)

These are the “powerful” screens you asked for — extras that make the product enterprise-grade.

* M1. **Payroll Admin Console** (owner)

  * Full payroll generator, slip templates, bulk pays, export CSV/PDF, bank integration, reconciliations.
  * Screens: Payroll Rules, Generate Payroll, Pending Approvals, Audit Log.
* M2. **Inventory & POS** (owner)

  * Product catalog, stock, sales ledger, invoice generator, product commission rules.
  * Screens: Product list, Add/Edit product, Sales receipts, Stock adjustments.
* M3. **Analytics & BI** (owner)

  * Cohort analysis, retention, revenue per client/trainer, churn predictions.
  * Dashboards: Live KPIs, exportable charts, CSV raw data.
* M4. **Compliance & Documents Vault**

  * Document store for trainer licenses, background checks, expiry alerts.
  * Screens: upload, approve, expiry calendar.
* M5. **Role & Permission Manager**

  * Create roles, granular permission toggles, admin audit logs.
* M6. **Mobile-first Offline Mode**

  * Local caching for attendance when no connectivity; offline sync, conflict resolution screen.

---

# 3 — Suggested new/updated database tables (high-level)

You already have many. Add/extend:

* `trainers` (if separate from gym\_owners)
* `attendance_logs` (detailed with geo json, device\_id, method\:auto/manual, confidence)
* `shifts` + `shift_templates`
* `leaves` (with payroll flags)
* `plans` + `plan_days` + `plan_exercises`
* `diet_plans` + `diet_items`
* `progress_logs` (measurements, photos)
* `payouts` + `commissions` + `transactions`
* `messages` + `conversations` + `attachments`
* `tickets` (support)
* `products` + `inventory_movements` + `sales`
* `audit_logs` (who changed what, when, reason)
* `notifications` (you already have)

---

# 4 — API best practices & sample endpoints

* Use JWT access tokens, refresh tokens. HTTPS only.
* Strong input validation & rate limiting.
* WebSockets (or server-sent events) for live updates: `/ws/attendance`, `/ws/chat`, `/ws/notifications`.

**Examples**

* `POST /auth/login {identifier, password}` → `{access_token, refresh_token, 2fa_required}`
* `GET /trainer/dashboard` → dashboard payload (sessions, earnings, attendance)
* `POST /attendance/auto {trainer_id, lat, lng, timestamp, signature}` → store auto check-in
* `POST /plans` → create plan
* `POST /clients/{id}/plans/assign` → assign plan to client
* `POST /tickets` → create support ticket

---

# 5 — UX / Design & Accessibility notes (important)

* Mobile-first, thumb-friendly control sizes (44–48px tap targets).
* Contrast: primary `#001743` on white; ensure WCAG AA contrast for buttons/text.
* Use progressive disclosure: show complex options in drawers/modals.
* Offline/poor connection flows: show cached content + sync status.
* Accessibility: ARIA labels, screen-reader friendly states, large text mode.

---

# 6 — Security & Compliance checklist

* Enforce password strength, 2FA for payouts & admin actions.
* Signed location payloads for attendance (prevent spoofing). Geo-fencing server-side verification.
* Audit trails for manual adjustments and payroll changes.
* Data retention & export policy; GDPR/Local privacy compliance as required.

---

# 7 — Notifications & Events (what to send & when)

* Attendance: auto check-in/out confirmation (trainer), daily attendance summary (owner).
* Booking: booking request, approval, reminder (30m/24h).
* Payments: payment received, payout processed.
* Leave: leave requested/approved/rejected.
* Feedback: new negative feedback alert → notify owner.
* Documents: expiring certificate alert 30/14/7 days prior.

---

# 8 — Prioritized screen design list (suggested sprint order)

1. Auth + Onboarding (A1–A5)
2. Home Dashboard (B1) + Notifications (B2)
3. Attendance core (C1–C6) — critical (GPS auto-checkin)
4. Clients & Profile (D1–D3)
5. Plan Builder (E2) + Assign (E4) + Client plan view (E5)
6. Bookings & Schedule (F1–F3)
7. Earnings & Payouts (H1–H4)
8. Leave Manager (I1–I4)
9. Chat & Support (J1–J3)
10. Ratings & Alerts (G1–G4)
11. Admin modules (Payroll, Inventory, Analytics)

---

# 9 — Deliverables I can produce next (pick any)

* generate **Figma-ready SVG screens** for any 5 screens you pick (I’ll output SVGs you can paste into Figma), or
* produce **detailed API spec** (OpenAPI/Swagger) for the chosen modules, or
* create **clickable user flows** (step-by-step screens for trainer onboarding or attendance correction).
