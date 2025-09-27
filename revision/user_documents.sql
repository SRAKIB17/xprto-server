CREATE TABLE
    user_documents (
        id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
        user_type ENUM ('client', 'gym', 'trainer', 'admin') NOT NULL COMMENT 'polymorphic owner type',
        user_id BIGINT UNSIGNED NOT NULL COMMENT 'owner id from corresponding users table',
        document_type VARCHAR(64) NOT NULL COMMENT 'e.g. Aadhaar Card, PAN Card, Certificate, etc.',
        original_name VARCHAR(255) NOT NULL,
        stored_name VARCHAR(255) NOT NULL COMMENT 'filename stored in disk/S3 (avoid collisions)',
        storage_path VARCHAR(1024) NOT NULL COMMENT 'full path or object key',
        mime_type VARCHAR(100) DEFAULT NULL,
        size BIGINT UNSIGNED DEFAULT NULL COMMENT 'bytes',
        metadata JSON DEFAULT NULL COMMENT 'optional extra info (ocr results, country, id_no masked...)',
        checksum VARCHAR(128) DEFAULT NULL COMMENT 'sha256/md5 for dedupe',
        updated_by BIGINT UNSIGNED DEFAULT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY uq_documents_uuid (uuid),
        INDEX idx_user_user_documents (user_type, user_id)
    ) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;