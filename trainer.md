
# **GYM Trainer App — Screen List & Details (XPRTO / PG)**

---

## **Module 1 — Trainer Dashboard / Home**

**Purpose:** Overview of trainer’s daily activity, client sessions, payments, notices.

**Screens / Components:**

1. **Dashboard Home (Overview)**

   * Widgets:

     * Today’s Sessions (count)
     * Completed Sessions
     * Upcoming Client Sessions
     * Quick Access Buttons:

       * Client Workout Manager
       * Client Nutrition Manager
       * Session Management
       * Attendance
     * Pending Payments (Amount + Client)
     * Trainer Rankings
     * Gym Owner Notices (all notices & trainer-specific)
     * Feedback Summary (from clients)
   * Interactions:

     * Tap session → Session Details
     * Tap notice → Notice Details
     * Tap pending payment → Payment Info / History
   * APIs:

     * `GET /trainer/dashboard` → sessions, earnings, pending payments, notices
2. **Quick Action Panel**

   * Shortcut buttons for:

     * Assign Workout Plan
     * Assign Nutrition Plan
     * View Clients
     * Attendance / Check-in

---

## **Module 2 — Assigned Clients Management**

**Purpose:** Manage all clients assigned by Gym Owner.

**Screens / Components:**

1. **Assigned Clients List**

   * Table/Card View toggle
   * Columns: Name, Badge, Goals, Status (Active / Paused / Completed), Last Session
   * Filters: Age, Gender, Progress %, Last Visit
   * Actions: Bulk message, Assign new client
   * APIs:

     * `GET /trainer/{id}/clients`

2. **Client Profile (Tabbed)**

   * Tabs:

     * Overview → Photo, Badge, Goals, Milestones
     * Health Stats → BMI, Weight, Skeletal Muscle/Fat, Blood Pressure, etc.
     * Plans → Current Workout & Diet Plans
     * Attendance → Calendar + % adherence
     * Sessions → Upcoming & Past sessions
     * Payments → Subscription, Commission, Pending dues
     * Notes → Private trainer notes
     * Documents → Medical, ID
   * Actions:

     * Edit health stats, add notes
     * Export client profile
   * APIs:

     * `GET /clients/{id}`
     * `PUT /clients/{id}/metrics`

3. **Client Health Metrics**

   * Weight, BMI, body parts, skeletal muscle/fat %
   * Graphs / Trend Charts
   * Add / Edit / Import CSV
   * APIs: `POST /clients/{id}/metrics`

---

## **Module 3 — Session Management**

**Purpose:** Manage workout sessions, live tracking, approvals, feedback.

**Screens / Components:**

1. **Workout Session List**

   * Today’s Sessions + Upcoming Sessions
   * Columns: Client Name, Session Type, Status (Planned / Live / Completed)
   * Actions: Start Session, Edit, View Feedback
   * APIs: `GET /trainer/{id}/sessions`
2. **Session Detail / Approval**

   * Workout Overview (sent to Gym Owner)
   * Status: Pending Approval / Approved / Rejected
   * Edit Workout Plan (requires Gym Owner approval)
   * API:

     * `POST /sessions/{id}/request-approval`
3. **Live Workout Mode**

   * Start Session → Both Client & Trainer tap Start
   * Timer visible to both
   * Modify / Add / Delete exercises on-the-fly (without approval)
   * End Session → Client control only
   * Live updates to Gym Owner Dashboard
   * Metrics:

     * Duration, completed sets/reps
     * Feedback from client (visible only to Gym Owner)
     * Exercise intensity
   * APIs:

     * `POST /sessions/{id}/start`
     * `POST /sessions/{id}/update-exercise`
     * `POST /sessions/{id}/end`
4. **Session Summary**

   * Total Duration
   * Exercises Completed / Missed
   * Calories burned (if tracked)
   * Client Notes / Feedback (hidden from trainer)

---

## **Module 4 — Workout Plan Manager**

**Purpose:** Create, assign, modify weekly workout plans.

**Screens / Components:**

1. **Plan Library**

   * Browse templates
   * Filters: Goal (Mass / Cut / Rehab), Duration (4w / 8w / 12w)
   * Preview / Assign buttons
   * API: `GET /plans/templates`

2. **Plan Builder**

   * Day-grid (Mon → Sun)
   * Drag & Drop Exercises
   * Exercise Details: Sets, Reps, Rest, Equipment, Video Demo
   * Actions:

     * Save as Template
     * Assign to Client → Sent for Gym Owner Approval
   * APIs: `POST /plans`, `PUT /plans/{id}`

3. **Assign Plan Confirmation**

   * Select Client(s)
   * Set Start/End Date
   * Trainer Notes
   * Auto Progress Tracking Toggle
   * API: `POST /clients/{id}/plans/assign`

4. **Modify / Delete Plan**

   * Edit existing plan → requires Gym Owner approval
   * Delete plan → requires Gym Owner approval
   * API: `PUT /plans/{id}`, `DELETE /plans/{id}`

---

## **Module 5 — Nutrition / Diet Plan Manager**

**Purpose:** Create weekly diet plans for clients.

**Screens / Components:**

1. **Macro / Diet Builder**

   * Day-wise Meal Slots: Breakfast, Lunch, Dinner, Snack
   * Food Card → Name, Portion, Calories, Macros, Recipe link
   * Drag & Drop Food Items
   * Save / Assign → Sent for Gym Owner Approval
   * APIs: `POST /clients/{id}/diet-plans`

2. **Client View**

   * Day-by-day checklist
   * Mark meals as done
   * Optional Feedback

---

## **Module 6 — Payments & Earnings**

**Purpose:** Track trainer’s revenue, pending / upcoming payments.

**Screens / Components:**

1. **Earnings Dashboard**

   * Total Revenue, Pending, Completed
   * Charts: Bar / Pie / Line
   * Filters: By Date, Client, Session

2. **Transaction History**

   * List of payments with Status (Paid / Pending)
   * Export CSV / PDF

3. **Withdraw / Transfer**

   * Razorpay / Bank Integration
   * Request Payment → Approval from Gym Owner
   * API: `POST /trainer/withdraw`

---

## **Module 7 — Performance & Ratings**

**Purpose:** Track trainer feedback from clients.

**Screens / Components:**

1. **My Ratings**

   * Average Score
   * Positive / Negative Counts
   * KPI Cards + Pie Chart
   * API: `GET /feedback?trainerId=`

2. **Ratings Trend**

   * Line Chart → Weekly / Monthly
   * Filter by Client / Class
   * Export Option

3. **Feedback List**

   * View Client Feedback
   * Reply (limited to Gym Owner & Superadmin)
   * API: `POST /feedback/reply`

4. **Alerts & Thresholds**

   * Set rules for low average / negative feedback
   * Notify Gym Owner / Admin

---

## **Module 8 — Attendance & Shift Management**

**Purpose:** Track attendance of Trainer & Clients.

**Screens / Components:**

1. **GPS Live Status**

   * In/Out, Distance to Gym
   * Permissions status
   * WebSocket live update

2. **Manual / Auto Check-in**

   * Reason for outside radius
   * Auto check-in toast messages

3. **Shift Schedule Calendar**

   * Day / Week / Month view
   * Assign shifts, drag & drop
   * Apply Templates
   * Color-coded shifts
   * API: `GET /shifts`, `POST /shifts`, `PUT /shifts/{id}`

4. **Attendance History & Detail**

   * List of entries / exits
   * Map visualization (heatmap)
   * Export CSV / PDF

---

## **Module 9 — Leave & Requests**

**Purpose:** Trainer leave management.

**Screens / Components:**

1. **Apply Leave**

   * From / To Date
   * Type (Paid / Unpaid)
   * Reason, Attach Document
   * API: `POST /leaves`

2. **Leave Status**

   * List → Pending / Approved / Rejected
   * Admin Comments
   * API: `GET /leaves?trainerId=`

3. **Leave History**

   * Integrated with Payroll → salary adjustments

4. **Manager Inbox (Gym Owner)**

   * Approve / Reject leave
   * Mark Paid / Unpaid
   * API: `PUT /leaves/{id}/approve`

---

## **Module 10 — Feedback / Support**

**Purpose:** Client & Trainer communication, tickets.

**Screens / Components:**

1. **Support Ticket List**

   * Status: Open / In Progress / Resolved
   * API: `GET /support?trainerId=`

2. **Chat / Message Center**

   * Trainer ↔ Client / Gym Owner / XPRTO Client
   * Media attachments
   * Notifications for new messages
   * API: `POST /chat/send`, `GET /chat/thread`

3. **Feedback Management**

   * Read / View / Reply → Limited to Gym

Owner & Superadmin

* Anonymous feedback for public view
* API: `GET /feedback`, `POST /feedback/reply`

---

## **Module 11 — Settings / Profile**

**Purpose:** Trainer personal info, role, notifications.

**Screens / Components:**

1. **Profile**

   * View personal info
   * Cannot edit Name, Mobile, Email (unless XPRTO client in their own account)
   * Upload profile picture
   * API: `GET /trainer/{id}`, `PUT /trainer/{id}`

2. **Notifications**

   * Gym Owner notices, reminders
   * Enable / Disable notifications

3. **Roles & Access**

   * General / Level 2 / Level 3 Trainer
   * View permissions

---

## ✅ **Additional Considerations**

* All modifications to **Workout / Diet Plans** need **Gym Owner approval**, except during live sessions.
* **Qualified sessions** are mandatory to track PT fee & client payments.
* **Attendance & Session Tracking** integrated with GPS / Geo-fencing.
* **Sensitive client info** (mobile, address) hidden from trainer.
* **Unique AADHAR ID** required for onboarding to prevent blacklisted users.
* **Export / Analytics** throughout for reports.

---

This **list covers all screens** with **step-by-step modules**, reflecting **home overview, client management, session workflow, workout/diet plan management, payments, ratings, attendance, leave, feedback, and settings**.
