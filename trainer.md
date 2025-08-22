
# **XPRTO APP – Trainer / Health Professional Full Flow**

---

## **1. Onboarding & Authentication**

**Screens:**

1. Splash Screen → Branding + Logo
2. Welcome Screen → Login / Signup
3. Signup → Email / Phone / OTP Verification
4. Profile Setup → Personal info (Name, Contact, Experience, Specialization)
5. Verification Step → Upload Certifications, Govt ID, KYC documents
6. Badge Allocation → Display of Verified / Fully Verified / Non-Verified / Suspicious (controlled by Superadmin)

**Key Elements:**

* Progress bar for onboarding
* Profile completion tracker (influences visibility in searches)
* Alerts for pending KYC / documents

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
✅ দারুণ, তুমি যেটা লিখেছো সেটা আসলে পুরো **Client Management Module** (Trainer App-এর জন্য) ভালোভাবে ভেঙে লেখা হয়েছে। আমি এটাকে আরেকটু **পলিশড ফরম্যাটে** সাজিয়ে দিলাম যেনো UI/UX ও API স্পেসিফিকেশন অনুযায়ী আলাদা screen গুলো স্পষ্ট বোঝা যায়:

---

# **Module D — Client Management**

---

### **D1. Assigned Clients List**

**View:**

* Table + Card View toggle
* Columns: Name, Goals, Badge (Gold/Silver/Beginner), Status (Active / Paused / Completed)
* Filters: Age, Gender, Progress %, Last Visit
* Actions: Bulk message, Assign new client

**APIs:**

* `GET /trainer/{id}/clients` → returns client list
* `POST /clients/assign`

---
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

## **E1 — Plan Library (Templates)**

**View:**

* Header: "Workout Plans Library" + search bar
* Filters: Goal (Mass / Cut / Rehab), Duration (4w / 8w / 12w)
* List of templates: card view

  * Card: Title, Goal, Duration, Preview button, Assign button

**Interactions:**

* Search & filter dynamically updates list
* Preview opens modal with plan summary
* Assign opens **E4 — Assign Plan Confirmation**

**APIs:**

* `GET /plans/templates` → Returns list of plan templates

  ```json
  [
    { "id": 1, "title": "Hypertrophy 8-week", "goal": "Mass", "duration_weeks": 8 },
    { "id": 2, "title": "Cutting 6-week", "goal": "Cut", "duration_weeks": 6 }
  ]
  ```

**Screen structure:**

* Header + Search bar
* Filter chips row
* Scrollable cards (template preview)
* Footer: Pagination (if many templates)

---

## **E2 — Plan Builder (Full-screen, drag & drop)**

**View:**

* Left: **Day-grid** (Mon → Sun)
* Right: **Exercise palette**: drag exercises to days
* Exercise Card:

  * Name, sets, reps, tempo, rest, notes, video link, equipment
* Actions:

  * Save plan
  * Save as template
  * Assign to client

**Interactions:**

* Drag & drop exercises into day slots
* Click exercise card → edit details (modal)
* Reorder exercises within a day
* Duplicate / remove exercise
* Undo/redo actions

**APIs:**

* `POST /plans` → Payload nested JSON `{day -> exercises}`
* `PUT /plans/{id}` → Update plan
* `DELETE /plans/{id}` → Delete plan

**Data payload example:**

```json
{
  "title": "Hypertrophy 8-week",
  "days": [
    { "day": "Mon", "exercises":[{"name":"Bench Press","sets":4,"reps":"8-10","rest":90}] },
    { "day": "Tue", "exercises":[{"name":"Squats","sets":4,"reps":"8-10","rest":90}] }
  ]
}
```

---

## **E3 — Macro / Diet Builder**

**View:**

* Per day (Mon → Sun)
* Meal slots: Breakfast / Lunch / Dinner / Snack
* Each meal: list of foods

  * Food card: Name, portion, calories, macros, recipe link
* Actions:

  * Add food (search in DB)
  * Edit portion / calories
  * Remove food
* Nutrition summary: total calories/macros per day

**APIs:**

* `GET /fooddb?query=` → search food database
* `POST /clients/{id}/diet-plans` → save diet plan
* Optional: integrate external DB for common foods

**Interactions:**

* Drag food into meal slot
* Click food card → edit portion or link recipe
* Auto-calculation of daily macros

---

## **E4 — Assign Plan Confirmation**

**View:**

* Selected plan summary: title, days, total duration
* Assign to: client(s) dropdown
* Schedule start / end date
* Trainer notes
* Reminders (optional auto notifications)
* Action buttons: **Assign**, **Cancel**

**APIs:**

* `POST /clients/{id}/plans/assign` → payload includes plan\_id, start\_date, end\_date, trainer\_note

**Payload example:**

```json
{
  "plan_id": 1,
  "start_date": "2025-09-01",
  "end_date": "2025-10-26",
  "trainer_note": "Focus on hypertrophy, add progressive overload weekly"
}
```

**Interactions:**

* Confirm assignment triggers auto notification to client
* Optional “Auto check progress” toggle

---

## **E5 — Client Plan View (Client-facing)**

**View:**

* Day-by-day checklist
* Exercise cards per day:

  * Name, sets, reps, notes, video demo, equipment
* Actions per day:

  * Mark as Done
  * Skip
  * Provide feedback / comment
* Progress summary: % completed, streaks, milestones

**APIs:**

* `GET /clients/{id}/plans/current` → Returns active plan
* `POST /clients/{id}/plans/{id}/complete-day` → Mark day completed
* Optional: feedback log → `POST /clients/{id}/plans/{id}/feedback`

**Interactions:**

* Swipe left/right for day navigation
* Tap exercise → view video demo / notes
* Feedback triggers trainer notification

---

## **E6 — Plan History & Analytics**

**View:**

* Table / Calendar of past plans
* Completion %, adherence, missed days
* Trend charts: weekly adherence, average sets/reps completed
* Changes log: edits to plan, assigned trainers, completion history

**APIs:**

* `GET /clients/{id}/plans/history` → Returns list of past plans
* `GET /clients/{id}/plans/{id}/analytics` → Adherence chart, logs

**Interactions:**

* Filter by date range / goal
* Export PDF / CSV
* Drill-down per plan → view daily completion, exercises completed

---

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

### **D2. Client Profile (Tabbed View)**

**Tabs:**

1. **Overview** → Photo, Goals, Milestones, Badge
2. **Health Stats** → BMI, Weight chart, Body Fat, Muscle
3. **Plans** → Current Workout & Diet
4. **Attendance** → Calendar + % adherence
5. **Sessions** → Upcoming & Past sessions
6. **Payments** → Subscription, Commission, Pending dues
7. **Notes** → Private trainer notes
8. **Documents** → Medicals, IDs, Reports

**Actions:**

* Edit Profile
* Assign/Unassign Trainer
* Export Profile as PDF

**APIs:**

* `GET /clients/{id}`
* `PUT /clients/{id}`

---

### **D3. Health Stats & Measurements**

**Features:**

* Charts for → Weight, BMI, Skeletal Muscle, Fat %
* Body parts → Arm / Waist / Leg measurements log
* Import CSV → bulk update
* Add measurement manually

**APIs:**

* `GET /clients/{id}/metrics`
* `POST /clients/{id}/metrics`

---

### **D4. Assign / Modify Plans**

**Options:**

* Select from **Workout Templates** or build custom
* Add **Diet Plan** with macros + meals
* Set **Start / End Dates**
* Assign trainer(s)

**APIs:**

* `POST /clients/{id}/plans`
* `PUT /plans/{planId}`
* `DELETE /plans/{planId}`

---

### **D5. Progress Tracking**

**Components:**

* Daily workout checkboxes ✅
* Adherence % (auto-calculated)
* Add notes + photos (progress selfies)
* Badge unlock → milestone achievement

**APIs:**

* `POST /clients/{id}/progress`

---

### **D6. Client Notes (Private)**

**Features:**

* Add/Edit/Delete notes
* Option: mark as **trainer-only** or **share with client**

**APIs:**

* `POST /clients/{id}/notes`
* `DELETE /clients/{id}/notes/{noteId}`

---

### **D7. Client Documents**

**Features:**

* Upload ID, Medical Certificates, ECG, Lab reports
* Preview PDF/Image
* Secure storage

**APIs:**

* `POST /clients/{id}/documents`
* `GET /clients/{id}/documents`

---

### **UX Notes**

* Profile Header → Show Goal % Completed + Target Date
* Alerts → Auto reminder if client misses >2 sessions/week
* Export Full Client Package (Profile + Plans + Progress + Payments)

---

## **4. Session Management**

**Screens:**

1. Upcoming Sessions → Daily / Weekly / Monthly view
2. Online / Gym / Home Sessions → Location and type
3. Accept / Decline client requests
4. Session Notes → Add workout instructions, reminders, diet suggestions

**Key Elements:**

* Calendar integration
* Push notifications for session reminders
* Quick session status update (completed / cancelled / rescheduled)

---

## **5. Health Professional Profile Management**

**Screens:**

1. Profile Overview → Name, Expertise, Certifications, Ratings
2. Edit Profile → Update skills, services, availability
3. Portfolio → Transformation photos, testimonials, achievements
4. Badge Display → Verification Level (Green, Gold, Red, Suspicious)
5. Optimization Tips → Suggestions to improve profile visibility in searches

**Key Elements:**

* Profile completion percentage
* Highlighted badges and verification status
* Portfolio photos/videos gallery

---

## **6. Communication / Messaging**

**Screens:**

1. Messages → Client / Superadmin / Support
2. Notifications → New requests, payments, alerts
3. Call / Chat Interface → Easy, clean, and secure communication
4. Message History → For all clients

**Key Elements:**

* Chat interface similar to Uber/Ola style
* Read/unread indicators
* Quick call button

---

## **7. Payments & Earnings**

**Screens:**

1. Earnings Dashboard → Total, Pending, Completed
2. Withdraw / Transfer → RazorPay / Bank Integration
3. pending show.. process step
4. Transaction History → Filter by date, client, session
5. Subscription Earnings → From premium clients or app commissions

**Key Elements:**

* Revenue visualization (charts)
* Alerts for failed or pending payments
* Exportable statements

---

## **8. Reports & Analytics**

**Screens:**

1. Client Progress Reports → Attendance, session completion, health goals
2. Session Reports → Total sessions, cancelled sessions, success rate
3. Revenue Reports → Daily / Weekly / Monthly earnings
4. Profile Performance → Views, search rank, optimization score

**Key Elements:**

* Charts & graphs for visual representation
* Exportable PDF / CSV reports
* Notifications for milestones (e.g., 100 sessions completed)

---

## **9. Admin-Controlled Features**

**Superadmin / Co-Admin Controls:**

* Badge allocation (Verified / Fully Verified / Non-Verified / Suspicious)
* Abuse / Complaint Management → Track reported clients / trainers
* Verification Resubmission → Requests for incomplete or rejected profiles
* Profile suspension or penalty management

**Key Elements:**

* Alerts for reported abuse / scam cases
* Profile status management visible in trainer dashboard

---

## **10. Key UI / UX Notes for Figma**

* **Color palette:** Primary: #001743, Secondary: #FFDC5C
* **Badges:** Use SVG icons for verification levels
* **Components:** Reusable templates for session cards, client cards, and messages
* **Responsive:** Mobile-first design, adaptable to tablet and desktop
* **Micro-interactions:** Hover, click, session completed animations

---

✅ **Developer Implications / Notes:**

1. Profile verification workflow is **controlled by Superadmin / KYC Team**.
2. Client matching algorithm is **critical for suggested clients**.
3. Attendance & session tracking must integrate with **notifications and health logs**.
4. Communication system must be **secure, fast, and intuitive**.
5. Payments module must handle **RazorPay / Google Pay** for earnings and subscriptions.
6. Reports & analytics are **real-time** and exportable.

---
