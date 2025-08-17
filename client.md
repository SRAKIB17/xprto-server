
# Global UI / Shell (shared components)

* **Top header**: logo, back button (where relevant), search icon, notifications badge.
* **Bottom tab bar / Nav bar** (persistent): Home, Sessions / Schedule, Workouts, Payments, Messages, Profile (and quick “Switch to My Gym Homepage” for Premium).
* **Floating CTA**: Quick Check-in / Emergency / Add Measurement (contextual).
* **Left / Right drawer** (optional): Gym quick links, policies, saved cards, settings.
* **Common UI elements**: Cards, progress bars, small charts, filters, modal, toast/snackbar, confirmation dialogs.
* **Permissions**: camera (profile/testimonial upload), location (search radius/auto-detect), push notifications, microphone (call/voice notes).

---

# 1. Auth & Onboarding

Purpose: account access, gym invite/enrollment, premium subscription upsell.

Screens / elements:

* **Welcome / Landing**

  * Short app pitch, Login / Signup, “Continue as Guest” (limited).
* **Signup / Login**

  * Methods: Email + password, Phone OTP, Social, “Login with GYM ID & password” (for Regular clients).
  * Fields: name, phone, email, DOB, gender (optional), gym code (if invited).
  * Actions: create account, forgot password.
* **Gym Invite / Enrollment**

  * Input Gym ID or scan QR from gym — `Enroll` button.
  * Show membership/package options from that gym (if owner assigned).
* **Onboarding tour**

  * Short slides: what’s the Gym homepage, how to book trainer, safety/abuse flow.
* **XPRTO Subscription Upsell**

  * Free vs Premium benefits summary, CTA to subscribe.

Create/Modify/Add/List actions:

* Create account, add gym code, add payment method (later at checkout).

---

# 2. GYM CLIENT HOMEPAGE (after login & enrolled to a gym)

Purpose: client’s daily snapshot — health analytics, sessions, announcements, payments, goals.

Widgets & content:

* **Header**: Gym name, quick gym contact, day/time.
* **Top cards (horizontal scroll)**:

  * Today’s Workout (with CTA “Start/Join”)
  * Next Session (time / trainer / join link)
  * Attendance (today: checked-in / not)
  * Payment due (amount, due date)
* **Health Snapshot**: latest weight, BMI, body fat (with last update date) + small sparkline chart (7/30 days).
* **Goal Progress**: progress bars (weight goal, strength goal, session goal).
* **Trainer Sessions**: upcoming sessions list (date/time, trainer).
* **My Programs**: active workout plan / nutrition plan (progress %, last updated).
* **Announcements / Notices** (from gym owner): pinned notices, schedule changes, holiday closures.
* **Fees Overview** (transparent):

  * Next due, balance pending, last 6 payments (summary).
  * Quick link: full payment history.
* **Attendance Insights**: monthly attendance %.
* **Quick Actions**: Check-in, Book Session, Add Measurement, Chat with Trainer (if allowed).
* **Footer**: switch to XPRTO homepage (if premium).

Create/Modify/Add/List:

* **Add measurement** (weight, chest, waist, body photo)
* **Modify goals**
* **List** of recent activities/sessions/payments.

---

# 3. XPRTO APP HOMEPAGE (for XPRTO users — before enrollment vs after enrollment)

Purpose: marketplace-style discovery for gyms/trainers (Premium has extra access).

**A. Before Enrollment (XPRTO Homepage — pre-enroll)**

* Big Search bar (Gym / Trainer) + location detect.
* Top cards: “What is XPRTO”, Offers, Top rated gyms in locality, Trial CTA.
* Filters: type (Unisex, Female only, Yoga, Sports), location, radius (5/10/25km).
* CTA: “Add these GYM for Gym Trials”

**B. After Enrollment (XPRTO Premium user who enrolled in a gym)**

* Small toggle / nav item: Switch to “My Gym Homepage”.
* Keep marketplace widgets available but show enrolled gym quick card.

Create/Modify/Add/List:

* List filters, save gyms for trials, create trial booking.

---

# 4. Gym Search / Gym List (Search Results)

Purpose: show gyms matching filters.

Elements:

* Top: active filters chips.
* Each gym card:

  * Name, rating, distance (km), basic tags (unisex/female), number of trainers, short services, “Add for Trial” button, “View Full Detail” (premium only shows full details or unlock modal).
* Map toggle (list <> map).
* Sorting: nearest, top rated, price.

Create/Modify/Add/List:

* Add gym to trial list, save gym, report gym (complaint).

---

# 5. Gym Detail (FULL) — (available for Premium or unlocked)

Purpose: full gym profile.

Content:

* Gallery (interior/exterior + video).
* Verified badge (if XPRTO verified) + certifications.
* Address + opening hours (Mon-Sun with times).
* Services & Specialization tags (Weightlifting, Zumba, Nutrition help).
* Facilities list: parking, changing room, bathroom, surveillance, accessibility.
* Trainers list (scroll) with badges.
* Testimonials (text + video).
* Classes timetable (weekly) with book buttons.
* Pricing & packages, trial option (prepaid), membership details.
* Contact & directions (map, CTA route).
* Report abuse / report listing.
* CTA: Book Trial / Enroll / View Trainers.

Create/Modify/Add/List:

* Create trial booking, add to favourites, list classes.

---

# 6. Trial Booking (Prepaid) Flow

Purpose: book prepaid trial offered by gym.

Steps & elements:

* Select package / trial slot -> select date/time -> enter client details -> **Payment checkout**
* Payment methods: card, wallet, UPI/Bank, saved card.
* Receipt & ticket generated (downloadable PDF).
* Post-booking: confirm slot in “Sessions”.

Create/Modify/Add/List:

* Create booking, modify (before cutoff), cancel (policy), list booked trials.

---

# 7. Trainer List (for a Gym or XPRTO Marketplace)

Elements:

* Search/Filter by specialization, rating, verification level.
* Each trainer card: name, photo, rating, specialization, online/offline badge, price/hour.
* CTA: View profile / Add to cart for booking.

Create/Modify/Add/List:

* Add trainer to booking, list trainer services (packages).

---

# 8. Trainer Profile (deep)

Elements:

* Photo, name, specialization, experience years, certifications (with images), badges (Lvl1/2/3), testimonials.
* **Verification & Police check** indicator.
* Abuse history: visible entries + popups (if any). If abuse exist, show warning modal when booking (see below).
* Services list: online coaching, offline doorstep, programs (with price).
* Availability calendar.
* Chat / Call buttons — **note**: Chat & Call enabled only after placing order or enrolling (per spec).
* Book session CTA (online/offline).
* Report abuse button.
* Trainer metrics: #clients helped, success stories, recent posts.

Create/Modify/Add/List:

* Create booking, create report ticket, add review, list sessions with this trainer.

---

# 9. Booking & Checkout (Trainer / Class / Session)

Flow & elements:

* Choose service (online/offline), date/time, location (for doorstep).
* Safety checks:

  * If trainer NOT verified or has abuse history → show **Undertaking modal** (legal waiver text) with two buttons: “I Understand & Continue” (then redirect to payment) or “No, Cancel” (back to trainer list).
* Payment gateway integration + promo code.
* Confirmation screen + calendar add, downloadable invoice.
* Post-booking: chat/call unlocked.

Create/Modify/Add/List:

* Create booking, modify/cancel per policy, list upcoming/past bookings.

---

# 10. Sessions / Schedule (My Sessions)

Elements:

* Tabs: Upcoming / Past / Cancelled.
* Session card: date/time, trainer, gym, location or online link, status (confirmed/pending).
* Buttons: Join (for online), Reschedule, Cancel, Add note to trainer.
* Session details: notes, trainer attachments (pdf/exercise video).
* Session feedback/rating after session.

Create/Modify/Add/List:

* Modify session (reschedule), add training notes, list all sessions.

---

# 11. Attendance & Check-in

Elements:

* Check-in options: QR scan at gym, NFC, manual check-in by staff, automatic location check.
* Attendance history calendar.
* Monthly attendance report.
* Sync to goals (sessions completed).

Create/Modify/Add/List:

* Create check-in (scan), list attendance entries, dispute attendance (request correction).

---

# 12. Health Dashboard / Analytics

Purpose: show client’s health transformation journey.

Widgets:

* Charts: weight curve, BMI, body fat, muscle mass (7/30/90 day).
* Latest metrics card with “Edit / Add measurement”.
* Progress photos (before / after).
* Program impact: sessions completed vs expected, nutrition adherence.
* Export report (PDF) — monthly or on-demand.
* Share with trainer (optional).

Create/Modify/Add/List:

* Add measurement (weight, height, chest, waist, hip, BMI auto-calc), upload photos, modify goals, list past measurements.

---

# 13. Workout Plan / Daily Workout

Elements:

* Today’s workout list with sets, reps, rest timers, demo video per exercise.
* Mark complete per exercise or whole workout.
* Trainer notes & attachments.
* History of completed workouts.
* Option: request modification (chat trainer).

Create/Modify/Add/List:

* Create custom workout (client saved), modify goal reps, list workouts.

---

# 14. Nutrition Plan

Elements:

* Meal plan (breakfast/lunch/dinner/snacks), calories target, macro breakdown.
* Daily logging (food search, quick add).
* Grocery list / recipes (with save).
* Nutritionist attachments.

Create/Modify/Add/List:

* Add meal entry, modify calorie goal, list meal history.

---

# 15. Payments, Invoices & Billing (FULL TRANSPARENCY)

Elements:

* **Dashboard**: Next due amount, balance pending, subscription status.
* **Payment history** (list): date, amount, method, invoice (download PDF).
* Detailed breakdown for each month: membership fees, trainer fees, class fees, taxes, discount, refunds, wallet adjustments.
* Saved payment methods, Add/Remove card, Set default method.
* Wallet / credits.
* Request refund button + status tracking.

Create/Modify/Add/List:

* Add payment method, create payment (checkout), modify subscription, list invoices.

---

# 16. Subscription & XPRTO Plan Management + GYm owner SuBcription

Elements:

* Current plan (Free / Premium), benefits list, expiry date.
* Upgrade/downgrade flow + checkout.
* Promo/Trials for premium.
* If premium: switching between XPRTO homepage & Gym homepage.

Create/Modify/Add/List:

* Create subscription purchase, list subscription invoices, modify auto-renew setting.

---

# 17. Messages / Chat (Trainer & Gym Support)

Elements:

* 1:1 chat with trainer (enabled after order/enroll), group announcements channel from gym owner, chat attachments (image, video, pdf).
* Voice notes, call button (VoIP) — call enabled after booking per spec.
* Message status: delivered/seen.
* Block/report user.

Create/Modify/Add/List:

* Create chat, add attachments, list conversations.

---

# 18. Notifications & Alerts

Elements:

* Notification center list (sessions, payments, announcements, safety alerts).
* Notification settings screen (enable/disable types).
* In-app banners for urgent gym notices.

Create/Modify/Add/List:

* Modify notification preferences, list past notifications.

---

# 19. Support & Abuse Control (Major USP)

Elements:

* **Raise Ticket**: Abuse / Safety / General support.

  * Fields: category, description, date/time of incident, trainer/gym involved, attach photos/videos, police report upload (optional).
* **Urgent Ticket / SOS**: Instant escalate with phone call option to XPRTO support; also option to “alert gym owner”.
* Ticket list with status (Open / In Progress / Resolved).
* Abuse history visibility on trainer profile (public) — show summary + number of complaints.
* After each abuse report, automatic workflow: demotion, investigation note, ban after 3 strikes (per spec).

Create/Modify/Add/List:

* Create ticket, modify (add evidence), list tickets & statuses.

---

# 20. Reviews & Ratings

Elements:

* Rate gym/trainer after session (stars + text + optional photo/video).
* View other reviews, filter by most recent / highest / lowest.
* Edit own review (within time window).

Create/Modify/Add/List:

* Create review, modify review, list reviews.

---

# 21. Profile & Account

Elements:

* Personal info: name, phone, email, DOB, gender.
* Health profile: chronic issues, allergies, emergency contact, doctor info.
* Documents: govt ID (for verification), medical clearance upload.
* Memberships: list of active memberships, validity.
* Family / Multi-profile: add family members.
* Logout, delete account.

Create/Modify/Add/List:

* Modify personal info, add emergency contact, add family member, list memberships.

---

# 22. Settings & Privacy

Elements:

* Security: change password, 2FA (SMS / Auth App).
* Privacy: who can see progress photos, profile visibility.
* App preferences: language, measurement units (kg/lb, cm/in).
* Location settings (auto-detect).
* T\&Cs, Privacy policy, Terms for doorstep sessions.

Create/Modify/Add/List:

* Modify preferences, list connected devices/sessions.

---

# 23. Switch to My Gym Homepage (Premium toggle)

Elements:

* Persistent button in nav / tab bar.
* If premium user not enrolled → show modal “You are not enrolled. Please enroll first” with action to search gyms.
* If enrolled → switch instantly to Gym Client Homepage.

---

# 24. Popups & Modals (Common / Important)

* **Enrollment prompt** (if trying gym features without enrollment).
* **Undertaking / Waiver modal** for booking non-verified or flagged trainers (mandatory to accept to proceed).
* **Abuse-history popup** when viewing flagged trainer (explains details; has “Yes continue” / “No”).
* **Payment success / failure** modal.
* **Reschedule confirmation** modal.

---

# 25. Reports & Export

* Export monthly progress report (PDF).
* Invoice export.
* Trainer session summary export.

Create/Modify/Add/List:

* Create export, list generated reports.

---

# 26. Media / Testimonial Upload

* Upload video testimonial or photos (with privacy choice).
* Gallery moderation (owner-reviewed).

Create/Modify/Add/List:

* Create testimonial, list submitted items, modify caption.

---

# 27. Emergency / SOS

* Big SOS button (call gym emergency contact, call XPRTO support).
* Location share during emergency.

---

# 28. FAQ / Help / Policies

* Searchable FAQs.
* Policy pages for doorstep services, cancellation, refund, safety protocol.

---

# 29. Misc developer / analytics screens (client visible)

* Timestamps for last sync, app version.
* App feedback form.

---

# 30. Edge Flows, Business Rules & Important UX behaviours (summarized)

* **Free XPRTO users** see limited gym/trainer info (name, rating, location). Full details behind premium paywall.
* **Chat/Call** with trainer unlocked only after paid order/enrollment (both free & premium have to enroll in trainer program; free users may also need platform subscription per spec).
* **Undertaking** must be shown & accepted before checkout for non-verified or flagged trainers.
* **Abuse reports** reduce trainer level and are public on profile; after 1 report show a strong popup; after 3 ban permanently.
* **Payment transparency**: every month show full line-itemed statement.
* **Switch to Gym Homepage**: always present for premium; if not enrolled, show “enroll first” modal.
* **Trial Management (prepaid)**: trials are prepaid, shown in XPRTO homepage cards and Gym detail.
* **Safety**: special “Abuse Control Support Ticket” for women/urgent cases, visible and prioritized.

---

# Forms — suggested field lists (quick)

* **Signup**: name, phone, email, password, gym code(optional), DOB, gender.
* **Payment Checkout**: name on card, card number, expiry, cvv, billing address, promo code.
* **Measurement**: date, weight, height, chest, waist, hip, body fat, notes, photo.
* **Abuse Ticket**: incident date/time, description, trainer/gym ID, attachments, desired action.
* **Booking**: service type, date, time, location, price summary, wallet/discount.

---

# Suggested MVP (priority order)

If you want a smaller first release, build these first:

1. Auth & Onboarding (with gym code).
2. Gym Client Homepage (basic: health snapshot, upcoming session, announcements).
3. Sessions / Booking basic (book class/trial + prepaid checkout).
4. Payments & Invoices (transparent list + download).
5. Trainer list & trainer profile (basic).
6. Chat (post-booking) + Messages.
7. Support & Abuse ticketing (urgent flow).
8. Health Dashboard (add weight + chart).

---

If you want, I can now:

* convert this into a clickable **screen map / user flow** (visual sitemap), or
* produce **component breakdown** (React/Tailwind) for top 10 screens (props, state, API contracts), or
* create a **MVP backlog with priorities & acceptance criteria**.
