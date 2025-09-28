CREATE TABLE
    admin_details (
        admin_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        fullname VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL UNIQUE,
        phone VARCHAR(20) DEFAULT NULL,
        avatar VARCHAR(255) DEFAULT NULL,
        password VARCHAR(255) NOT NULL,
        role ENUM ('super_admin', 'support_admin') DEFAULT 'support_admin',
        status ENUM ('active', 'inactive', 'suspended') DEFAULT 'active',
        registered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        last_visit TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;