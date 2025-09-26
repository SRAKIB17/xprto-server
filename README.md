
client:
<xc@gamil.com>
1234
---

## **1. User Management**

**Tables:**

- `users`
  - id (PK)
  - role_id (FK → roles.id)
  - full_name
  - email
  - phone
  - password_hash
  - profile_photo
  - subscription_status (free, premium, gym_member)
  - subscription_expiry
  - verification_badge (verified, fully_verified, non_verified, suspicious)
  - status (active, suspended, deleted)
  - created_at, updated_at

- `roles`
  - id (PK)
  - name (Super Admin, Co-Admin, Gym Owner, Regd Gym Trainer, Regd Gym Member, Independent Trainer, Premium Member, Free Member)
  - description

- `user_profiles`
  - user_id (FK)
  - date_of_birth
  - gender
  - address
  - city
  - state
  - pincode
  - bio
  - expertise (for trainers)
  - certifications
  - experience_years
  - testimonials
  - portfolio_links

---

## **2. Gym Management (ERP)**

**Tables:**

- `gyms`
  - id (PK)
  - owner_id (FK → users.id)
  - name
  - address
  - city
  - state
  - pincode
  - contact_number
  - email
  - verification_status
  - rating
  - logo
  - description

- `gym_packages`
  - id (PK)
  - gym_id (FK)
  - name
  - description
  - duration_days
  - price
  - benefits

- `gym_equipments`
  - id (PK)
  - gym_id (FK)
  - name
  - brand
  - purchase_date
  - condition_status

---

## **3. Attendance Management**

**Tables:**

- `attendance`
  - id (PK)
  - user_id (FK)
  - gym_id (FK, nullable for independent users)
  - date
  - status (present, absent)
  - check_in_time
  - check_out_time

---

## **4. Health Data & Transformation**

**Tables:**

- `health_data`
  - id (PK)
  - user_id (FK)
  - height
  - weight
  - bmi
  - body_fat_percentage
  - calorie_goal
  - step_count
  - updated_at

- `transformation_records`
  - id (PK)
  - user_id (FK)
  - before_photo
  - after_photo
  - description
  - start_date
  - end_date

---

## **5. Trial & Session Management**

**Tables:**

- `trials`
  - id (PK)
  - gym_id (FK)
  - trainer_id (FK)
  - client_id (FK)
  - trial_date
  - status (pending, completed, cancelled)

- `sessions`
  - id (PK)
  - trainer_id (FK)
  - client_id (FK)
  - session_type (gym, home, online)
  - date
  - start_time
  - end_time
  - notes

---

## **6. Payments & Subscriptions**

**Tables:**

- `payments`
  - id (PK)
  - user_id (FK)
  - amount
  - currency
  - payment_method
  - transaction_id
  - status
  - created_at

- `subscriptions`
  - id (PK)
  - user_id (FK)
  - plan_name
  - price
  - start_date
  - end_date
  - status

---

## **7. Abuse & Report System**

**Tables:**

- `abuse_reports`
  - id (PK)
  - reported_user_id (FK)
  - reporter_user_id (FK)
  - description
  - evidence (photo/video)
  - status (pending, reviewed, resolved, suspended)
  - created_at

---

## **8. Notifications**

**Tables:**

- `notifications`
  - id (PK)
  - user_id (FK)
  - title
  - message
  - type (general, payment, verification, abuse_report)
  - is_read (boolean)
  - created_at

---

## **9. Admin Control**

**Tables:**

- `admin_logs`
  - id (PK)
  - admin_id (FK)
  - action
  - target_table
  - target_id
  - timestamp

- `license_manager`
  - id (PK)
  - license_key
  - assigned_to (FK → gyms.id or users.id)
  - status (active, expired, revoked)
  - issued_at
  - expiry_date

---

This schema covers **all 8 dashboards**, all 3 vision objectives, ERP features, independent trainer marketplace, attendance, abuse control, and subscription logic mentioned in your document【5†source】.  
