CREATE TABLE
    wallets (
        wallet_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        user_role ENUM ('client', 'trainer', 'gym', 'admin') NOT NULL,
        user_id BIGINT UNSIGNED NOT NULL,
        currency VARCHAR(3) NOT NULL DEFAULT 'INR',
        available_balance DECIMAL(14, 2) NOT NULL DEFAULT 0.00, -- spendable
        held_balance DECIMAL(14, 2) NOT NULL DEFAULT 0.00, -- holds/escrow
        total_balance DECIMAL(14, 2) GENERATED ALWAYS AS (available_balance + held_balance) STORED,
        status ENUM ('active', 'suspended', 'closed') NOT NULL DEFAULT 'active',
        metadata JSON DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY (user_id, user_role, currency)
    ) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4;

CREATE TABLE
    wallet_transactions (
        txn_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        wallet_id BIGINT UNSIGNED DEFAULT NULL,
        gym_id BIGINT UNSIGNED DEFAULT NULL,
        admin_id BIGINT UNSIGNED DEFAULT NULL,
        idempotency_key VARCHAR(191) DEFAULT NULL, -- ensure idempotent ops
        type ENUM (
            'topup', -- add money from external source
            'hold', -- place amount on hold
            'release_hold', -- release held amount
            'payment', -- deduct for services
            'payout', -- withdraw money
            'refund', -- refund to user
            'adjustment', -- admin correction
            'transfer_in', -- incoming transfer
            'transfer_out' -- outgoing transfer
        ) NOT NULL,
        amount DECIMAL(14, 2) NOT NULL,
        fee DECIMAL(14, 2) NOT NULL DEFAULT 0.00, -- platform/service fee
        currency VARCHAR(3) NOT NULL DEFAULT 'INR',
        -- Balance state after txn
        balance_after DECIMAL(14, 2) NOT NULL, -- available balance after txn
        hold_change DECIMAL(14, 2) NOT NULL DEFAULT 0.00, -- +ve = add hold, -ve = release hold
        -- Payment gateway / external references
        payment_method VARCHAR(50) DEFAULT NULL, -- e.g. 'upi','card','wallet'
        external_txn_id VARCHAR(191) DEFAULT NULL, -- gateway txn id, bank ref no.
        -- Business references
        reference_type VARCHAR(50) DEFAULT NULL, -- e.g. 'booking','invoice' , "subscription"
        reference_id VARCHAR(191) DEFAULT NULL, -- internal/external id
        payment_id VARCHAR(200) DEFAULT NULL,
        -- Metadata
        metadata JSON DEFAULT NULL,
        -- Lifecycle
        status ENUM ('pending', 'success', 'failed', 'reversed') NOT NULL DEFAULT 'success',
        initiated_by BIGINT UNSIGNED NULL, -- who triggered
        initiated_role ENUM ('system', 'admin', 'gym', 'trainer', 'client') NOT NULL DEFAULT 'system',
        note TEXT DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        -- Constraints & Indexes
        FOREIGN KEY (wallet_id) REFERENCES wallets (wallet_id),
        FOREIGN KEY (gym_id) REFERENCES gyms (gym_id),
        FOREIGN KEY (admin_id) REFERENCES admin_details (admin_id),
        INDEX idx_idempotency (idempotency_key),
        INDEX idx_wallet (wallet_id),
        INDEX idx_reference (reference_type, reference_id),
        INDEX idx_status (status)
    ) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

CREATE TABLE
    wallet_payouts (
        payout_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        wallet_id BIGINT UNSIGNED NOT NULL, -- Recipient wallet
        -- Payment Info
        payout_type ENUM ('upi', 'bank', 'wallet', 'manual') DEFAULT 'upi', -- Type of payout
        payout_method VARCHAR(100) DEFAULT NULL, -- e.g., 'razorpay', 'cashfree', 'manual'
        provider VARCHAR(100) DEFAULT NULL, -- e.g., 'RazorpayX', 'Paytm', 'Bank of India'
        -- Account Info
        upi_id VARCHAR(191) DEFAULT NULL, -- UPI address like name@bank
        account_number VARCHAR(50) DEFAULT NULL,
        ifsc_code VARCHAR(20) DEFAULT NULL,
        account_holder_name VARCHAR(191) DEFAULT NULL,
        -- Transaction Info
        provider_payout_id VARCHAR(191) DEFAULT NULL, -- Razorpay/Cashfree payout ID
        reference_id VARCHAR(191) DEFAULT NULL, -- Internal or external reference
        idempotency_key VARCHAR(191) DEFAULT NULL, -- ensure idempotent ops,
        external_txn_id VARCHAR(191) DEFAULT NULL, -- gateway txn id, bank ref no.
        txn_note VARCHAR(255) DEFAULT NULL, -- Description or note for payout
        -- Financial Info
        amount DECIMAL(14, 2) NOT NULL,
        fee DECIMAL(14, 2) DEFAULT 0.00,
        tax DECIMAL(14, 2) DEFAULT 0.00,
        total_amount DECIMAL(14, 2) GENERATED ALWAYS AS (amount - fee - tax) STORED,
        currency VARCHAR(3) DEFAULT 'INR',
        -- Status Info
        status ENUM (
            'requested',
            'processing',
            'completed',
            'failed',
            'reversed'
        ) DEFAULT 'requested',
        failure_reason TEXT DEFAULT NULL,
        -- Meta
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (wallet_id) REFERENCES wallets (wallet_id),
        INDEX (idempotency_key),
        INDEX (wallet_id),
        INDEX (reference_id),
        INDEX (status)
    ) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;