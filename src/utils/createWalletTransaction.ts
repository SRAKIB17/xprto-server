import { Context } from 'tezx';
import { pool, TABLES } from '../models/index.js';

export type WalletTxnType =
    | 'topup'
    | 'hold'
    | 'release_hold'
    | 'payment'
    | 'payout'
    | 'refund'
    | 'adjustment'
    | 'transfer_in'
    | 'transfer_out';

interface WalletTransactionOptions {
    type: WalletTxnType;
    amount: number;
    fee?: number;
    holdChange?: number; // +ve = hold, -ve = release
    currency?: string;
    payment_method?: string;
    external_txn_id?: string;
    reference_type?: string;
    reference_id?: string;
    metadata?: any;
    initiated_by?: number;
    initiated_role?: 'system' | 'admin' | 'gym' | 'trainer' | 'client';
    note?: string;
    idempotency_key?: string;
}

/**
 * Safely perform a wallet transaction
 */
export async function performWalletTransaction(ctx: Context, opts: WalletTransactionOptions) {
    const conn = await pool.getConnection();
    try {
        const { role, user_info: { user_id } } = ctx.auth ?? {};
        await conn.beginTransaction();
        // 1️⃣ Lock wallet row
        const [walletRows] = await conn.query(
            `SELECT available_balance, held_balance, currency, wallet_id FROM ${TABLES.WALLETS.WALLETS} WHERE user_id = ? AND user_role = ? AND currency = ?
             FOR UPDATE`,
            [user_id, role, opts.currency ?? 'INR']
        );
        const wallet = (walletRows as any)[0];
        if (!wallet) throw new Error('Wallet not found');
        // 2️⃣ Check currency
        const currency = opts.currency ?? wallet.currency;
        // 3️⃣ Compute new balances
        let available = Number(wallet.available_balance);
        let held = Number(wallet.held_balance);
        // Update balances based on transaction type
        switch (opts.type) {
            case 'topup':
                available += opts.amount;
                break;
            case 'hold':
                if (available < opts.amount) throw new Error('Insufficient balance for hold');
                available -= opts.amount;
                held += opts.amount;
                break;
            case 'release_hold':
                if (held < opts.amount) throw new Error('Not enough held balance');
                available += opts.amount;
                held -= opts.amount;
                break;
            case 'payment':
            case 'payout':
                if (available < opts.amount) throw new Error('Insufficient balance');
                available -= opts.amount;
                break;
            case 'refund':
                available += opts.amount;
                break;
            case 'adjustment':
            case 'transfer_in':
                available += opts.amount;
                break;
            case 'transfer_out':
                if (available < opts.amount) throw new Error('Insufficient balance for transfer');
                available -= opts.amount;
                break;
            default:
                throw new Error('Unknown transaction type');
        }
        // 4️⃣ Update wallet
        await conn.query(
            `UPDATE ${TABLES.WALLETS.WALLETS} SET available_balance = ?, held_balance = ? WHERE wallet_id = ?`,
            [available, held, wallet?.wallet_id]
        );

        // 5️⃣ Insert transaction record
        const [txnResult] = await conn.query(
            `INSERT INTO ${TABLES.WALLETS.transactions} 
            (wallet_id, idempotency_key, type, amount, fee, currency, balance_after, hold_change, payment_method, external_txn_id, reference_type, reference_id, metadata, initiated_by, initiated_role, note)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                wallet?.wallet_id,
                opts.idempotency_key ?? null,
                opts.type,
                opts.amount,
                opts.fee ?? 0,
                currency,
                available,
                opts.holdChange ?? 0,
                opts.payment_method ?? null,
                opts.external_txn_id ?? null,
                opts.reference_type ?? null,
                opts.reference_id ?? null,
                JSON.stringify(opts.metadata ?? {}),
                opts.initiated_by ?? null,
                opts.initiated_role ?? 'system',
                opts.note ?? null,
            ]
        );
        await conn.commit();
        return { success: true, balance_after: available, txn_id: (txnResult as any).insertId };
    } catch (err) {
        await conn.rollback();
        return { success: false, error: (err as Error).message };
    } finally {
        conn.release();
    }
}