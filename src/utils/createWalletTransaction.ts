import { Context } from 'tezx';
import { generateUUID } from 'tezx/helper';
import { pool, TABLES } from '../models/index.js';
import { generateTxnID } from './generateTxnID.js';

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
    payment_id?: string,
    initiated_by?: number;
    initiated_role?: 'system' | 'admin' | 'gym' | 'trainer' | 'client';
    note?: string;
    idempotency_key?: string;
}

/**
 * Safely perform a wallet transaction
 */
export async function performWalletTransaction(user: { role: string, user_id: number }, opts: WalletTransactionOptions) {
    const conn = await pool.getConnection();
    try {
        const { role, user_id } = user;

        if (!user_id || !role) throw new Error('Unauthenticated: missing user context');

        if (typeof opts.amount !== 'number' || Number.isNaN(opts.amount) || opts.amount <= 0) {
            throw new Error('Invalid amount; must be a positive number');
        }
        if (opts.fee != null && (typeof opts.fee !== 'number' || opts.fee < 0)) {
            throw new Error('Invalid fee; must be a non-negative number');
        }


        await conn.beginTransaction();
        const idempotency_key = opts.idempotency_key ?? generateUUID();
        // Check idempotency
        if (idempotency_key) {
            const [existingRows] = await conn.query(
                `SELECT * FROM ${TABLES.WALLETS.transactions} WHERE idempotency_key = ? LIMIT 1`,
                [idempotency_key]
            );
            const existing = (existingRows as any)[0];
            if (existing) {
                await conn.commit();
                return {
                    success: true,
                    idempotent: true,
                    txn_id: existing.id,
                    external_txn_id: existing?.external_txn_id,
                    amount: existing?.amount,
                    reference_id: existing?.reference_id,
                    status: existing?.status,
                    hold_change: existing?.hold_change,
                    balance_after: existing.balance_after
                };
            }
        }
        const external_txn_id = opts?.external_txn_id ?? generateTxnID("XPRTO");


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


        let txnAmount = opts.amount;
        switch (opts.type) {
            case 'topup':
            case 'refund':
            case 'adjustment':
            case 'transfer_in':
            case 'release_hold':  // releasing adds back
                txnAmount = Math.abs(opts.amount); // positive
                break;
            case 'hold':
            case 'payment':
            case 'payout':
            case 'transfer_out':
                txnAmount = -Math.abs(opts.amount); // negative
                break;
        }
        let txnFee = 0;
        if (opts.fee != null) {
            txnFee = -Math.abs(opts.fee); // always negative to indicate deduction
        }
        // 5️⃣ Insert transaction record
        const [txnResult] = await conn.query(
            `INSERT INTO ${TABLES.WALLETS.transactions} 
            (wallet_id, idempotency_key, type, amount, fee, currency, balance_after, hold_change, payment_method, external_txn_id, reference_type, reference_id, metadata, initiated_by, initiated_role, note, payment_id)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                wallet?.wallet_id,
                idempotency_key,
                opts.type,
                txnAmount,
                txnFee,
                currency,
                available,
                opts.holdChange ?? 0,
                opts.payment_method ?? null,
                external_txn_id ?? null,
                opts.reference_type ?? null,
                opts.reference_id ?? null,
                JSON.stringify(opts.metadata ?? {}),
                opts.initiated_by ?? null,
                opts.initiated_role ?? 'system',
                opts.note ?? null,
                opts?.payment_id ?? null

            ]
        );
        await conn.commit();
        return { success: true, balance_after: available, txn_id: (txnResult as any).insertId };
    }
    catch (err) {
        console.log(err)
        await conn.rollback();
        return { success: false, error: (err as Error).message };
    } finally {
        conn.release();
    }
}