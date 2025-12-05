CREATE TABLE
    client_gym_memberships (
        booking_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        -- 🔗 Relations
        client_id BIGINT UNSIGNED NOT NULL,
        gym_id BIGINT UNSIGNED NOT NULL,
        plan_id BIGINT UNSIGNED NOT NULL,
        valid_from DATE NOT NULL,
        valid_to DATE NOT NULL,
        price DECIMAL(10, 2) NOT NULL COMMENT 'Base price per billing cycle',
        discount_percent DECIMAL(5, 2) DEFAULT 0.00 COMMENT 'Optional discount percentage',
        status ENUM ('active', 'cancelled', 'completed') DEFAULT 'active',
        -- 💰 Payment / transaction info
        txn_id VARCHAR(191) NOT NULL,
        reference VARCHAR(191) DEFAULT NULL,
        -- 🔑 Identifier / idempotent key for safely retrying
        idempotent_key VARCHAR(191) DEFAULT NULL UNIQUE,
        -- ⏰ Timestamps
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        -- ⚡ Relations
        FOREIGN KEY (client_id) REFERENCES clients (client_id) ON DELETE CASCADE,
        FOREIGN KEY (gym_id) REFERENCES gyms (gym_id) ON DELETE CASCADE,
        FOREIGN KEY (plan_id) REFERENCES membership_plans (plan_id) ON DELETE CASCADE,
        -- Indexing for faster queries
        UNIQUE (gym_id, plan_id, client_id),
        INDEX (client_id),
        INDEX (gym_id),
        INDEX (plan_id),
        INDEX (valid_from, valid_to)
    ) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

```
INSERT INTO client_gym_memberships 
(client_id, gym_id, plan_id, valid_from, valid_to, status, txn_id, reference, idempotent_key)
VALUES
(1, 1, 1, '2025-01-01', '2025-12-31', 'active', 'TXN-1001', 'REF-1001', 'IDEMP-1001'),
(1, 1, 2, '2025-01-01', '2025-12-31', 'active', 'TXN-1002', 'REF-1002', 'IDEMP-1002'),
(1, 1, 3, '2025-01-01', '2025-12-31', 'active', 'TXN-1003', 'REF-1003', 'IDEMP-1003'),
(1, 1, 4, '2025-01-01', '2025-12-31', 'active', 'TXN-1004', 'REF-1004', 'IDEMP-1004'),
(1, 1, 5, '2025-01-01', '2025-12-31', 'active', 'TXN-1005', 'REF-1005', 'IDEMP-1005'),
(1, 1, 6, '2025-01-01', '2025-12-31', 'active', 'TXN-1006', 'REF-1006', 'IDEMP-1006'),
(1, 1, 7, '2025-01-01', '2025-12-31', 'active', 'TXN-1007', 'REF-1007', 'IDEMP-1007'),
(1, 1, 8, '2025-01-01', '2025-12-31', 'active', 'TXN-1008', 'REF-1008', 'IDEMP-1008'),
(1, 1, 9, '2025-01-01', '2025-12-31', 'active', 'TXN-1009', 'REF-1009', 'IDEMP-1009'),
(1, 1, 10, '2025-01-01', '2025-12-31', 'active', 'TXN-1010', 'REF-1010', 'IDEMP-1010');

    ```