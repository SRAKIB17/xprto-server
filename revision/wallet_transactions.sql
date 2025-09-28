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
        INDEX idx_idempotency (idempotency_key),
        INDEX idx_wallet (wallet_id),
        INDEX idx_reference (reference_type, reference_id),
        INDEX idx_status (status)
    ) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

CREATE TABLE
    wallet_topups (
        topup_id BIGINT AUTO_INCREMENT PRIMARY KEY,
        wallet_id BIGINT NOT NULL,
        payment_provider VARCHAR(50) NOT NULL, -- stripe/bkash/sslcommerz/etc
        provider_payment_id VARCHAR(191) DEFAULT NULL,
        amount DECIMAL(14, 2) NOT NULL,
        fee DECIMAL(14, 2) DEFAULT 0.00,
        net_amount DECIMAL(14, 2) GENERATED ALWAYS AS (amount - fee) STORED,
        currency VARCHAR(3) NOT NULL DEFAULT 'BDT',
        status ENUM ('initiated', 'processing', 'completed', 'failed') NOT NULL DEFAULT 'initiated',
        idempotency_key VARCHAR(191) DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (wallet_id) REFERENCES wallets (wallet_id)
    ) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4;

CREATE TABLE
    payouts (
        payout_id BIGINT AUTO_INCREMENT PRIMARY KEY,
        wallet_id BIGINT NOT NULL, -- recipient wallet
        amount DECIMAL(14, 2) NOT NULL,
        currency VARCHAR(3) DEFAULT 'BDT',
        provider VARCHAR(50) DEFAULT NULL, -- bank/pg
        provider_payout_id VARCHAR(191) DEFAULT NULL,
        fee DECIMAL(14, 2) DEFAULT 0.00,
        status ENUM ('requested', 'processing', 'completed', 'failed') DEFAULT 'requested',
        requested_by BIGINT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (wallet_id) REFERENCES wallets (wallet_id)
    ) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4;

-- Optional: ledger table for audit of debits/credits (double-entry)
CREATE TABLE
    wallet_ledger (
        ledger_id BIGINT AUTO_INCREMENT PRIMARY KEY,
        txn_id BIGINT NOT NULL, -- link to wallet_transactions
        account_type ENUM ('user_wallet', 'platform_revenue', 'escrow') NOT NULL,
        debit DECIMAL(14, 2) DEFAULT 0.00,
        credit DECIMAL(14, 2) DEFAULT 0.00,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (txn_id) REFERENCES wallet_transactions (txn_id)
    ) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4;