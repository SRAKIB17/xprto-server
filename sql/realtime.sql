CREATE TABLE
  `chat_rooms` (
    `room_id` bigint UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    `room_name` varchar(255) DEFAULT NULL,
    `is_group` tinyint (1) DEFAULT '0',
    `is_announcement` BOOLEAN DEFAULT FALSE,
    `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
    `thumbnail` varchar(500) DEFAULT NULL
  ) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

CREATE TABLE
  `chat_room_memberships` (
    `chat_id` bigint UNSIGNED NOT NULL AUTO_INCREMENT,
    `user_id` bigint UNSIGNED NOT NULL,
    `user_role` ENUM ('system', 'admin', 'gym', 'trainer', 'client') NOT NULL DEFAULT 'system',
    `room_id` bigint UNSIGNED NOT NULL,
    join_date timestamp NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`chat_id`),
    UNIQUE (`user_id`, `room_id`, `user_role`),
    FOREIGN KEY (`room_id`) REFERENCES `chat_rooms` (`room_id`) ON DELETE CASCADE
  ) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

CREATE TABLE
  `chat_messages` (
    attachments JSON DEFAULT NULL,
    `message_id` bigint UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    `user_id` bigint UNSIGNED NOT NULL,
    `sender_role` ENUM ('s', 'a', 'g', 't', 'c') DEFAULT "c",
    `room_id` bigint UNSIGNED NOT NULL,
    `message_type` enum ('TEXT', 'FILE') DEFAULT 'TEXT',
    `text` text DEFAULT NULL,
    `is_read` BOOLEAN DEFAULT FALSE,
    -- `is_update` tinyint (1) DEFAULT '0',
    -- `updated_at` timestamp NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
    `timestamp` timestamp DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`room_id`) REFERENCES `chat_rooms` (`room_id`) ON DELETE CASCADE
  ) ENGINE = InnoDB AUTO_INCREMENT = 220 DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;