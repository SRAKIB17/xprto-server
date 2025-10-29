CREATE TABLE
    notifications (
        notification_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        -- Recipient
        recipient_type ENUM ('client', 'trainer', 'gym', 'admin') NOT NULL,
        recipient_id BIGINT UNSIGNED NOT NULL,
        -- Sender
        sender_type ENUM ('system', 'admin', 'gym', 'trainer', 'client') NOT NULL DEFAULT 'system',
        sender_id BIGINT UNSIGNED NULL,
        -- Content
        title VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        type ENUM (
            'alert',
            'offer',
            'update',
            'announcement',
            'reminder',
            'payment_due',
            'class_schedule',
            'feedback',
            'achievement',
            'system_event'
        ) NOT NULL DEFAULT 'alert',
        metadata JSON NULL,
        action_url VARCHAR(300) DEFAULT NULL,
        priority ENUM ('low', 'medium', 'high', 'urgent') DEFAULT 'medium',
        delivery_method ENUM ('app', 'email', 'sms', 'whatsapp') DEFAULT 'app',
        -- Timestamps
        sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        read_at TIMESTAMP NULL DEFAULT NULL,
        expires_at TIMESTAMP NULL DEFAULT NULL,
        INDEX idx_recipient_notifications (recipient_type, recipient_id)
    ) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci


    আপনি চাইছেন `notifications` টেবিলের জন্য **searchable index** তৈরি করতে এবং যদি দরকার হয় `ALTER` statement ব্যবহার করে update করতে। নিচে বিস্তারিত দিচ্ছি।

---

### 1️⃣ Fulltext Index (title + message)

যদি আপনি **title** ও **message** field এর উপর search functionality চান (keyword search), তাহলে **FULLTEXT index** বানানো যায়:

```sql
ALTER TABLE notifications
ADD FULLTEXT idx_title_message_notification (title, message);
```

এভাবে আপনি MySQL/MariaDB তে keyword search করতে পারবেন:

```sql
SELECT * 
FROM notifications
WHERE MATCH(title, message) AGAINST ('gym' IN NATURAL LANGUAGE MODE);
```

/*
-- Query: SELECT * FROM u476740337_xprto.notifications
LIMIT 0, 1000

-- Date: 2025-09-27 06:24
*/
INSERT INTO `notifications` (`notification_id`,`recipient_type`,`recipient_id`,`sender_type`,`sender_id`,`title`,`message`,`type`,`metadata`,`action_url`,`priority`,`delivery_method`,`sent_at`,`read_at`,`expires_at`) VALUES
(2,'trainer',1,'',7,'Feedback Given','Client 7 submitted feedback on your last class.','feedback',NULL,NULL,'medium','app','2025-09-26 21:35:36',NULL,NULL),
(3,'trainer',1,'system',NULL,'System Update','App will be down for maintenance tonight.','system_event',NULL,NULL,'low','app','2025-09-26 21:35:36',NULL,NULL),
(4,'trainer',1,'admin',2,'Payment Reminder','Please confirm your pending payment invoice.','payment_due',NULL,NULL,'urgent','app','2025-09-26 21:35:36',NULL,NULL),
(5,'trainer',1,'',3,'Achievement Unlocked','Client 3 reached their goal weight!','achievement',NULL,NULL,'medium','app','2025-09-26 21:35:36',NULL,NULL),
(6,'trainer',1,'',8,'Class Schedule Change','Client 8 asked to reschedule the session.','class_schedule',NULL,NULL,'high','app','2025-09-26 21:35:36',NULL,NULL),
(7,'trainer',1,'gym_owner',1,'Offer Announcement','Special discount for premium trainers!','offer',NULL,NULL,'medium','app','2025-09-26 21:35:36',NULL,NULL),
(8,'trainer',1,'system',NULL,'Security Notice','We detected a login from a new device.','alert',NULL,NULL,'urgent','app','2025-09-26 21:35:36',NULL,NULL),
(9,'trainer',1,'',10,'Feedback Request','Please rate your last session with Client 10.','feedback',NULL,NULL,'low','app','2025-09-26 21:35:36',NULL,NULL),
(10,'trainer',1,'admin',4,'New Policy Update','Admin added a new cancellation policy.','announcement',NULL,NULL,'medium','app','2025-09-26 21:35:36',NULL,NULL),
(11,'trainer',1,'system',NULL,'Reminder','Don’t forget to update your profile information.','reminder',NULL,NULL,'low','app','2025-09-26 21:35:36',NULL,NULL),
(12,'trainer',1,'',12,'Class Booking','Client 12 booked a new session for next week.','class_schedule',NULL,NULL,'high','app','2025-09-26 21:35:36',NULL,NULL),
(13,'trainer',1,'',15,'Payment Completed','Client 15 completed payment for the last session.','update',NULL,NULL,'medium','app','2025-09-26 21:35:36',NULL,NULL),
(14,'trainer',1,'gym_owner',2,'Achievement Badge','You received “Top Trainer” badge this month.','achievement',NULL,NULL,'high','app','2025-09-26 21:35:36',NULL,NULL),
(15,'trainer',1,'system',NULL,'System Event','New video training feature is now live!','system_event',NULL,NULL,'medium','app','2025-09-26 21:35:36',NULL,NULL),
(16,'trainer',1,'admin',6,'Alert','Please verify your KYC documents.','alert',NULL,NULL,'urgent','app','2025-09-26 21:35:36',NULL,NULL),
(17,'trainer',1,'',18,'Offer','Client 18 shared a referral code with you.','offer',NULL,NULL,'low','app','2025-09-26 21:35:36',NULL,NULL),
(18,'trainer',1,'gym_owner',3,'Announcement','New gym equipment added to your center.','announcement',NULL,NULL,'medium','app','2025-09-26 21:35:36',NULL,NULL),
(19,'trainer',1,'system',NULL,'Reminder','Complete your weekly progress report.','reminder',NULL,NULL,'medium','app','2025-09-26 21:35:36',NULL,NULL),
(20,'trainer',1,'',20,'Feedback Request','Client 20 asked you to review their workout plan.','feedback',NULL,NULL,'high','app','2025-09-26 21:35:36',NULL,NULL),
(21,'gym',1,'system',NULL,'System Maintenance','The platform will be unavailable for 2 hours tonight.','system_event',NULL,NULL,'medium','app','2025-09-26 21:36:42',NULL,NULL),
(22,'gym',1,'admin',2,'Payment Due','Please clear pending subscription payment.','payment_due',NULL,NULL,'urgent','app','2025-09-26 21:36:42',NULL,NULL),
(23,'gym',1,'trainer',5,'Trainer Request','Trainer 5 requested additional slots for clients.','update',NULL,NULL,'high','app','2025-09-26 21:36:42',NULL,NULL),
(24,'gym',1,'',10,'Feedback Submitted','Client 10 left a review about your gym.','feedback',NULL,NULL,'medium','app','2025-09-26 21:36:42',NULL,NULL),
(25,'gym',1,'gym_owner',1,'Offer Announcement','New promotional offer available for your gym members.','offer',NULL,NULL,'medium','app','2025-09-26 21:36:42',NULL,NULL),
(26,'gym',1,'system',NULL,'Security Alert','Unusual login activity detected in gym account.','alert',NULL,NULL,'urgent','app','2025-09-26 21:36:42',NULL,NULL),
(27,'gym',1,'admin',3,'New Policy','Updated terms & conditions for gyms have been published.','announcement',NULL,NULL,'medium','app','2025-09-26 21:36:42',NULL,NULL),
(28,'gym',1,'trainer',7,'Class Schedule','Trainer 7 updated their weekly schedule.','class_schedule',NULL,NULL,'high','app','2025-09-26 21:36:42',NULL,NULL),
(29,'gym',1,'',15,'Membership Renewal','Client 15 renewed membership successfully.','update',NULL,NULL,'medium','app','2025-09-26 21:36:42',NULL,NULL),
(30,'gym',1,'system',NULL,'Reminder','Update your gym facilities information.','reminder',NULL,NULL,'low','app','2025-09-26 21:36:42',NULL,NULL),
(31,'gym',1,'admin',4,'Inspection Notice','Admin scheduled a compliance inspection for next week.','alert',NULL,NULL,'high','app','2025-09-26 21:36:42',NULL,NULL),
(32,'gym',1,'trainer',9,'Achievement','Trainer 9 achieved 100+ sessions this month.','achievement',NULL,NULL,'medium','app','2025-09-26 21:36:42',NULL,NULL),
(33,'gym',1,'gym_owner',2,'Special Event','Join the annual fitness expo this weekend.','announcement',NULL,NULL,'medium','app','2025-09-26 21:36:42',NULL,NULL),
(34,'gym',1,'system',NULL,'New Feature','Group booking feature now available for gyms.','system_event',NULL,NULL,'medium','app','2025-09-26 21:36:42',NULL,NULL),
(35,'gym',1,'',18,'Complaint','Client 18 submitted a complaint about equipment.','alert',NULL,NULL,'high','app','2025-09-26 21:36:42',NULL,NULL),
(36,'gym',1,'trainer',12,'Trainer Feedback','Trainer 12 requested more equipment.','feedback',NULL,NULL,'low','app','2025-09-26 21:36:42',NULL,NULL),
(37,'gym',1,'admin',6,'Offer','Discount on annual subscription fees for gyms.','offer',NULL,NULL,'medium','app','2025-09-26 21:36:42',NULL,NULL),
(38,'gym',1,'system',NULL,'Reminder','Don’t forget to upload gym license documents.','reminder',NULL,NULL,'high','app','2025-09-26 21:36:42',NULL,NULL),
(39,'gym',1,'gym_owner',3,'Achievement','Your gym ranked in Top 10 gyms in the city.','achievement',NULL,NULL,'high','app','2025-09-26 21:36:42',NULL,NULL),
(40,'gym',1,'',20,'Session Booking','Client 20 booked 5 group classes in your gym.','class_schedule',NULL,NULL,'high','app','2025-09-26 21:36:42',NULL,NULL),
(41,'client',1,'system',NULL,'Welcome to FitLife','Thank you for registering as a client in FitLife app.','announcement',NULL,NULL,'medium','app','2025-09-26 21:37:01',NULL,NULL),
(42,'client',1,'admin',2,'Profile Approved','Your client profile has been verified successfully.','update',NULL,NULL,'high','app','2025-09-26 21:37:01',NULL,NULL),
(43,'client',1,'trainer',5,'Session Reminder','Your personal training session is scheduled for tomorrow at 7 AM.','reminder',NULL,NULL,'high','app','2025-09-26 21:37:01',NULL,NULL),
(44,'client',1,'gym_owner',1,'Membership Offer','Get 20% off on annual gym membership!','offer',NULL,NULL,'medium','app','2025-09-26 21:37:01',NULL,NULL),
(45,'client',1,'system',NULL,'Password Change Alert','Your password was recently updated.','alert',NULL,NULL,'urgent','app','2025-09-26 21:37:01',NULL,NULL),
(46,'client',1,'trainer',8,'Feedback Request','Please leave a review for your last session.','feedback',NULL,NULL,'low','app','2025-09-26 21:37:01',NULL,NULL),
(47,'client',1,'admin',3,'Payment Confirmation','We have received your subscription payment successfully.','payment_due',NULL,NULL,'medium','app','2025-09-26 21:37:01',NULL,NULL),
(48,'client',1,'gym_owner',2,'Class Update','Yoga class timing has been changed to 6 PM.','class_schedule',NULL,NULL,'high','app','2025-09-26 21:37:01',NULL,NULL),
(49,'client',1,'system',NULL,'New Feature','Group booking is now available for clients.','system_event',NULL,NULL,'medium','app','2025-09-26 21:37:01',NULL,NULL),
(50,'client',1,'trainer',6,'Achievement Unlocked','You completed 10 training sessions this month!','achievement',NULL,NULL,'high','app','2025-09-26 21:37:01',NULL,NULL),
(51,'client',1,'admin',4,'Important Notice','System maintenance will occur tonight from 12AM - 2AM.','alert',NULL,NULL,'medium','app','2025-09-26 21:37:01',NULL,NULL),
(52,'client',1,'gym_owner',3,'Special Event','Join our fitness bootcamp this weekend.','announcement',NULL,NULL,'medium','app','2025-09-26 21:37:01',NULL,NULL),
(53,'client',1,'trainer',7,'Trainer Update','Trainer 7 has uploaded a new workout plan for you.','update',NULL,NULL,'medium','app','2025-09-26 21:37:01',NULL,NULL),
(54,'client',1,'system',NULL,'Reminder','Update your health information for better recommendations.','reminder',NULL,NULL,'low','app','2025-09-26 21:37:01',NULL,NULL),
(55,'client',1,'admin',5,'Survey','Please participate in our annual fitness survey.','feedback',NULL,NULL,'low','app','2025-09-26 21:37:01',NULL,NULL),
(56,'client',1,'gym_owner',4,'Offer Extended','The summer discount offer has been extended by 1 week.','offer',NULL,NULL,'medium','app','2025-09-26 21:37:01',NULL,NULL),
(57,'client',1,'trainer',9,'Session Cancelled','Your scheduled session tomorrow has been cancelled.','alert',NULL,NULL,'high','app','2025-09-26 21:37:01',NULL,NULL),
(58,'client',1,'system',NULL,'New Badge','Congratulations! You earned a "Consistency" badge.','achievement',NULL,NULL,'high','app','2025-09-26 21:37:01',NULL,NULL),
(59,'client',1,'admin',6,'Policy Update','Our privacy policy has been updated.','announcement',NULL,NULL,'medium','app','2025-09-26 21:37:01',NULL,NULL),
(60,'client',1,'gym_owner',5,'Reminder','Don’t forget to renew your membership before it expires.','reminder',NULL,NULL,'high','app','2025-09-26 21:37:01',NULL,NULL);
