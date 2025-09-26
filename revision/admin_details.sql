CREATE TABLE
    admin_details (
        admin_id BIGINT AUTO_INCREMENT PRIMARY KEY,
        fullname VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL UNIQUE,
        phone VARCHAR(20) DEFAULT NULL,
        password VARCHAR(255) NOT NULL,
        role ENUM ('super_admin', 'support_admin', 'gym_manager') DEFAULT 'support_admin',
        status ENUM ('active', 'inactive', 'suspended') DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4;