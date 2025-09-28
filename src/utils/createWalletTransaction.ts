// utils/wallet.ts
import { Pool } from "mysql2/promise";

export interface WalletTxnInput {
    wallet_id: number;
    idempotency_key: string;
    type:
    | "topup"
    | "hold"
    | "release_hold"
    | "payment"
    | "payout"
    | "refund"
    | "adjustment"
    | "transfer_in"
    | "transfer_out";
    amount: number;
    fee?: number;
    currency?: string;
    hold_change?: number;
    payment_method?: string | null;
    external_txn_id?: string | null;
    reference_type?: string | null;
    reference_id?: string | null;
    metadata?: any;
    status?: "pending" | "success" | "failed" | "reversed";
    initiated_by?: number | null;
    initiated_role?: "system" | "admin" | "gym" | "trainer" | "client";
    note?: string | null;
}

/**
 * Insert a wallet transaction safely (idempotent).
 *
 * - Uses idempotency_key to prevent duplicate inserts.
 * - Calculates balance_after based on current wallet state.
 * - Returns the inserted or existing transaction.
 */
export async function createWalletTransaction(
    db: Pool,
    input: WalletTxnInput
) {
    const conn = await db.getConnection();
    try {
        await conn.beginTransaction();

        // 1. Check if transaction with same idempotency_key already exists
        const [existing] = await conn.query(
            `SELECT * FROM wallet_transactions WHERE idempotency_key = ? LIMIT 1`,
            [input.idempotency_key]
        );

        if ((existing as any[]).length > 0) {
            // Already exists → return existing txn (idempotent behavior)
            await conn.rollback();
            return (existing as any[])[0];
        }

        // 2. Fetch wallet to calculate balance
        const [walletRows] = await conn.query(
            `SELECT available_balance, held_balance 
       FROM wallets WHERE wallet_id = ? FOR UPDATE`,
            [input.wallet_id]
        );

        if ((walletRows as any[]).length === 0) {
            throw new Error("Wallet not found");
        }

        const wallet = (walletRows as any[])[0];
        let available = parseFloat(wallet.available_balance);
        let held = parseFloat(wallet.held_balance);

        // 3. Apply changes depending on type
        available += input.amount - (input.fee ?? 0);
        held += input.hold_change ?? 0;

        if (available < 0 || held < 0) {
            throw new Error("Insufficient balance or invalid hold change");
        }

        const balance_after = available;

        // 4. Insert new transaction
        const [result] = await conn.query(
            `INSERT INTO wallet_transactions (
        wallet_id, idempotency_key, type, amount, fee, currency,
        balance_after, hold_change, payment_method, external_txn_id,
        reference_type, reference_id, metadata, status,
        initiated_by, initiated_role, note
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                input.wallet_id,
                input.idempotency_key,
                input.type,
                input.amount,
                input.fee ?? 0.0,
                input.currency ?? "INR",
                balance_after,
                input.hold_change ?? 0.0,
                input.payment_method ?? null,
                input.external_txn_id ?? null,
                input.reference_type ?? null,
                input.reference_id ?? null,
                input.metadata ? JSON.stringify(input.metadata) : null,
                input.status ?? "success",
                input.initiated_by ?? null,
                input.initiated_role ?? "system",
                input.note ?? null,
            ]
        );

        // 5. Update wallet balances
        await conn.query(
            `UPDATE wallets 
       SET available_balance = ?, held_balance = ?, updated_at = NOW()
       WHERE wallet_id = ?`,
            [available, held, input.wallet_id]
        );

        await conn.commit();

        return {
            txn_id: (result as any).insertId,
            balance_after,
            ...input,
        };
    } catch (err) {
        await conn.rollback();
        throw err;
    } finally {
        conn.release();
    }
}
