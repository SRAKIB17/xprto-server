
# 🏋️‍♂️ XPRTO TRAINER APP – MODULES & SUB-MODULES

## 1. 🔐 **Authentication & Onboarding**

* **Screens**

  * Welcome screen (Choose: Client / Trainer / Gym)
  * Login (Mobile OTP / Email + Password)
  * Sign Up (Role: Trainer / Client / Gym)
  * Forgot Password / Reset Password

* **Trainer Onboarding Flow**

  * Basic Profile Form (Name, Gender, Email, Mobile, Address, Languages, Education, Profile Picture)
  * Upload KYC Documents (PAN, Aadhaar, etc.)
  * Upload Certifications / Specializations
  * Police Verification Certificate (mandatory if "Offline Sessions" enabled)
  * Trainer Intro Video Upload
  * Submit for Verification → Status (Pending / Verified / Pro / Suspended)

---

## 2. 👨‍🏫 **Trainer Profile Management**

* **Sub-modules**

  * Edit Profile (personal + professional details)
  * Upload Certifications, Skills, Specializations
  * Profile Badge Levels:

    * Level 01 → Low Graded (Not Verified)
    * Level 02 → Verified Badge
    * Level 03 → Pro (XPRTO Assured)
  * Upload Photo Gallery & Intro Video
  * Trainer Availability (slots calendar)
  * Set Location (District / State / Country)
  * Public View (Client-facing Profile Page)

* **Screens**

  * My Profile Dashboard
  * Badge Status Screen
  * Document Upload Screen
  * Public Profile Preview

---

## 3. 🛠️ **Service & Course Management**

* **Sub-modules**

  * Add New Service / Course

    * Service Type: Offline (Doorstep) / Online (Consultation, Program)
    * Pricing: Per Hour / Flat One Time
    * Service Details: Title, Description, Benefits, Duration (Days/Hours)
    * Why Opt This Service? (selling points)
    * Upload Media (Images, Video, Certifications)
  * Edit / Update / Delete Services
  * Pending Approval (goes to Superadmin)
  * Live Services List

* **Screens**

  * My Services List
  * Add/Edit Service Form
  * Service Preview Page

---

## 4. 📅 **Booking & Availability**

* **Sub-modules**

  * Trainer Slot Calendar (set availability)
  * Client Booking Request → Trainer Accept/Reject
  * Reschedule Requests (Client ↔ Trainer)
  * Cancellation Requests + Refund % Logic
  * Session Reminders (2 hr / 1 hr notifications)

* **Screens**

  * Booking Requests Screen
  * My Schedule (calendar view)
  * Reschedule / Cancel Screen
  * Booking Detail Page

---

## 5. 💰 **Payments & Wallet**

* **Sub-modules**

  * Trainer Earning Dashboard
  * Upcoming Payments
  * Settled Payments + Invoice (GST, Platform Fee, Convenience Fee)
  * Wallet Recharge (Cashback Offers)
  * Client Wallet Recharge (with offers)
  * Refund Handling (as per policy)

* **Screens**

  * Wallet Overview
  * Earning Breakdown Page
  * Transaction History
  * Invoice PDF View

---

## 6. 📝 **Session Management & Feedback**

* **Trainer Duties (Post Session)**

  * Upload Joint Photo with Client
  * Collect Client Review (via app questions)
  * Submit Session Completion Report

* **Feedback Questions (Client Side)**

  * Trainer Behavior?
  * Any Misbehave / Suspicion?
  * Workouts Tough or Easy?
  * Would you Re-book?
  * Rate the Trainer

* **Screens**

  * Active Session Detail
  * End Session Feedback Form (Trainer)
  * Client Feedback Form

---

## 7. 📢 **Notifications System**

* **Trainer Notifications**

  * New Booking
  * Upcoming Session Reminders (2hr / 1hr)
  * Session Completed → Payment Breakdown
  * Payment Credited → Invoice
  * Abuse Notice / Red-Flag / Suspension Notice
  * Course Listing Approved / Rejected

* **Client Notifications**

  * Booking Confirmed
  * Session Reminder (2hr / 1hr)
  * Abuse Report Option
  * Post-Session Feedback Request
  * Session Rescheduled / Cancelled / Refund Updates

* **Screens**

  * Notification Center (Trainer)
  * Notification Center (Client)

---

## 8. 🚩 **Abuse Management & Red-Flag System**

* **Sub-modules**

  * Abuse Report (Client ↔ Trainer)
  * Superadmin Enquiry Panel
  * Red-Flag Assignment (Visible on Profile)
  * Suspension / Termination Handling
  * Red-Flag Removal (only by Superadmin)

* **Screens**

  * Report Abuse Form
  * Red-Flag History (Trainer Profile)
  * Superadmin Abuse Panel

---

## 9. 🏛️ **Superadmin Panel**

* **Trainer Controls**

  * Publish / Suspend / Terminate Profiles
  * Verify KYC + PVC + Certifications
  * Approve / Reject Services
  * Assign Badges (Level 01 → 03)
  * Handle Red-Flags

* **Client Controls**

  * Refunds & Wallet Management
  * Abuse Resolution

* **Screens**

  * Trainer Verification Dashboard
  * Service Approval Dashboard
  * Abuse / Red-Flag Dashboard

---

## 10. 🏋️‍♂️ **Gym Owner & Trainer Management**

* **Sub-modules**

  * Add Gym Trainers
  * Shift Management (Leave Requests → Substitute Assignment)
  * Assign Clients to Substitute Trainer
  * Notify Clients about Substitution

* **Screens**

  * Gym Trainer List
  * Leave Request & Substitution Screen
  * Client Notification Screen

---

## 11. 🏠 **Trainer Homepage (Dashboard)**

* **Widgets**

  * Similar Trainers (Carousel)
  * Client Testimonials
  * Job Board Ads
  * Earning Analytics
  * Booking Requests
  * Upcoming Payments
  * Notices from XPRTO

---

## 12. 🔎 **Search & Discovery (Client Side)**

* Search Trainers by:

  * Top Rated / Low Rated
  * Nearby Trainers
  * Nutritionist / Fitness Coach / Health Freelancer
  * Verified Trainers / Pro Badges / VIP Trainers
  * Keywords

* **Screens**

  * Trainer List (Grid / Card / Carousel)
  * Trainer Profile Detail Page
  * Filter + Sort

---

## 13. ⭐ **Ratings, Reviews & Testimonials**

* Anonymous Feedback System

* Video Testimonials (embed from YouTube)

* Pros & Cons Highlights

* Trainer Ranking System

* **Screens**

  * Trainer Review Page
  * Video Testimonials Section

---

## 14. 🎯 **Extra Features**

* Wallet Cashback Offers (both Client + Trainer)
* Featured Trainers & Courses Section
* Most Rated / Most Opted Services Highlight

---

✅ এভাবে মোট **14টি মূল মডিউল** হবে → প্রতিটা আবার সাব-মডিউল ও স্ক্রিনে ভাগ হয়ে যাবে।
এটা করলে Figma UI/UX টিমকে **একদম স্পষ্ট ব্রিফ** দেওয়া যাবে।

---

তুমি কি চাইছো আমি এগুলোকে একটা **ERD (Entity-Relationship Diagram)** + **App Navigation Flow Diagram (SVG)** এ কনভার্ট করে দিই? এতে Superadmin / Trainer / Client – তিনটার পুরো relation একসাথে ভিজুয়াল হবে।
