CREATE TABLE
    trainers (
        trainer_id BIGINT AUTO_INCREMENT PRIMARY KEY,
        login_type ENUM ('email', 'google', 'facebook') DEFAULT 'email',
        hashed VARCHAR(255) DEFAULT NULL,
        salt VARCHAR(255) DEFAULT NULL,
        gym_id BIGINT DEFAULT NULL,
        xprto BOOLEAN DEFAULT TRUE,
        postal_code VARCHAR(20) DEFAULT NULL,
        lat INT DEFAULT NULL,
        lng INT DEFAULT NULL,
        fullname VARCHAR(100) NOT NULL,
        age INT DEFAULT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        phone VARCHAR(20) UNIQUE NOT NULL,
        gender ENUM ('male', 'female', 'other') DEFAULT 'other',
        dob DATE DEFAULT NULL,
        bio TEXT DEFAULT NULL,
        specialization JSON DEFAULT NULL, -- e.g. "Strength, Yoga, Rehab"
        certification TEXT DEFAULT NULL, -- comma-separated or JSON list
        avatar VARCHAR(255) DEFAULT NULL,
        cover VARCHAR(255) DEFAULT NULL,
        experience_years INT DEFAULT 0,
        hire_date DATE DEFAULT NULL,
        status ENUM (
            'active',
            'inactive',
            'temporary-block',
            'suspended'
        ) DEFAULT 'active',
        registered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        last_visit TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        CONSTRAINT chk_mobile_length CHECK (CHAR_LENGTH(phone) BETWEEN 7 AND 20),
        CONSTRAINT chk_email_format CHECK (email LIKE '%_@_%._%'),
        FOREIGN KEY (gym_id) REFERENCES gyms (gym_id) ON DELETE SET NULL
    ) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4;

CREATE TABLE
    shifts (
        shift_id BIGINT AUTO_INCREMENT PRIMARY KEY,
        trainer_id BIGINT NOT NULL,
        title VARCHAR(50) NOT NULL, -- Morning, Evening, Night
        start_time DATETIME NOT NULL,
        end_time DATETIME NOT NULL,
        recurrence ENUM ('none', 'daily', 'weekly') DEFAULT 'none',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT fk_shift_trainer FOREIGN KEY (trainer_id) REFERENCES trainers (trainer_id)
    ) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4;

CREATE TABLE
    trainer_ratings (
        rating_id BIGINT AUTO_INCREMENT PRIMARY KEY,
        trainer_id BIGINT NOT NULL,
        client_id BIGINT NOT NULL,
        score INT CHECK (score BETWEEN 1 AND 5),
        feedback TEXT DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT fk_rating_trainer FOREIGN KEY (trainer_id) REFERENCES trainers (trainer_id),
        CONSTRAINT fk_rating_client FOREIGN KEY (client_id) REFERENCES clients (client_id)
    ) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4;

CREATE TABLE
    earnings (
        earning_id BIGINT AUTO_INCREMENT PRIMARY KEY,
        trainer_id BIGINT NOT NULL,
        type ENUM ('salary', 'commission', 'bonus') NOT NULL,
        amount DECIMAL(10, 2) NOT NULL,
        currency VARCHAR(10) DEFAULT 'USD',
        reference_id VARCHAR(50) DEFAULT NULL, -- booking id, sale id etc.
        status ENUM ('pending', 'paid') DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT fk_earning_trainer FOREIGN KEY (trainer_id) REFERENCES trainers (trainer_id)
    ) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4;

CREATE TABLE
    leaves (
        leave_id BIGINT AUTO_INCREMENT PRIMARY KEY,
        trainer_id BIGINT NOT NULL,
        start_date DATE NOT NULL,
        end_date DATE NOT NULL,
        type ENUM ('paid', 'unpaid', 'sick', 'casual') DEFAULT 'casual',
        reason TEXT DEFAULT NULL,
        status ENUM ('pending', 'approved', 'rejected') DEFAULT 'pending',
        admin_note TEXT DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT fk_leave_trainer FOREIGN KEY (trainer_id) REFERENCES trainers (trainer_id)
    ) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4;

CREATE TABLE
    trainer_documents (
        document_id BIGINT AUTO_INCREMENT PRIMARY KEY,
        trainer_id BIGINT NOT NULL,
        doc_type VARCHAR(100) NOT NULL, -- e.g. "Certification", "License"
        file_url VARCHAR(255) NOT NULL,
        expiry_date DATE DEFAULT NULL,
        status ENUM ('valid', 'expired', 'pending') DEFAULT 'pending',
        uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT fk_doc_trainer FOREIGN KEY (trainer_id) REFERENCES trainers (trainer_id)
    ) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4;