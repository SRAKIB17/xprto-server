// walletUtils.ts

import { PoolConnection } from "mysql2/promise";

/**
 * Insert a wallet transaction
 */
export async function createTransaction(
    conn: PoolConnection,
    params: {
        wallet_id: number;
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
        payment_method?: string;
        external_txn_id?: string;
        reference_type?: string;
        reference_id?: string;
        metadata?: object;
        status?: "pending" | "success" | "failed" | "reversed";
        initiated_by?: number;
        initiated_role?: "system" | "admin" | "gym" | "trainer" | "client";
        note?: string;
    }
) {
    const {
        wallet_id,
        type,
        amount,
        fee = 0,
        currency = "INR",
        hold_change = 0,
        payment_method,
        external_txn_id,
        reference_type,
        reference_id,
        metadata,
        status = "success",
        initiated_by,
        initiated_role = "system",
        note,
    } = params;

    // Current balance fetch
    const [[wallet]]: any = await conn.query(
        "SELECT available_balance, held_balance FROM wallets WHERE wallet_id = ? FOR UPDATE",
        [wallet_id]
    );

    if (!wallet) throw new Error("Wallet not found");

    let newAvailable = wallet.available_balance;
    let newHeld = wallet.held_balance;

    // Apply changes based on type
    if (type === "payment" || type === "payout" || type === "transfer_out") {
        newAvailable -= amount + fee;
    } else if (type === "topup" || type === "refund" || type === "transfer_in") {
        newAvailable += amount;
    }

    if (hold_change !== 0) {
        newHeld += hold_change;
        if (hold_change < 0) newAvailable += Math.abs(hold_change); // release hold -> add to available
    }

    const balance_after = newAvailable;
    // Update wallet balances
    await conn.query(
        "UPDATE wallets SET available_balance = ?, held_balance = ? WHERE wallet_id = ?",
        [newAvailable, newHeld, wallet_id]
    );

    // Insert txn
    await conn.query(
        `INSERT INTO wallet_transactions 
     (wallet_id, type, amount, fee, currency, balance_after, hold_change, 
      payment_method, external_txn_id, reference_type, reference_id, metadata, 
      status, initiated_by, initiated_role, note) 
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
        [
            wallet_id,
            type,
            amount,
            fee,
            currency,
            balance_after,
            hold_change,
            payment_method,
            external_txn_id,
            reference_type,
            reference_id,
            metadata ? JSON.stringify(metadata) : null,
            status,
            initiated_by,
            initiated_role,
            note,
        ]
    );

    return { balance_after, newHeld };
}

/**
 * Client pays gym immediately
 */
export async function addPayment(
    conn: PoolConnection,
    clientWallet: number,
    gymWallet: number,
    amount: number,
    bookingId: string,
    clientId: number
) {
    await createTransaction(conn, {
        wallet_id: clientWallet,
        type: "payment",
        amount,
        reference_type: "booking",
        reference_id: bookingId,
        initiated_by: clientId,
        initiated_role: "client",
        note: "Payment for Gym Service",
    });

    await createTransaction(conn, {
        wallet_id: gymWallet,
        type: "transfer_in",
        amount,
        reference_type: "booking",
        reference_id: bookingId,
        initiated_by: clientId,
        initiated_role: "client",
        note: "Received Payment from Client",
    });
}

/**
 * Place due payment (hold)
 */
export async function addDue(
    conn: PoolConnection,
    clientWallet: number,
    amount: number,
    bookingId: string,
    clientId: number
) {
    await createTransaction(conn, {
        wallet_id: clientWallet,
        type: "hold",
        amount,
        hold_change: amount,
        reference_type: "booking",
        reference_id: bookingId,
        status: "pending",
        initiated_by: clientId,
        initiated_role: "client",
        note: "Hold for Gym Service (Due)",
    });
}

/**
 * Release due payment to gym
 */
export async function settleDue(
    conn: PoolConnection,
    clientWallet: number,
    gymWallet: number,
    amount: number,
    bookingId: string,
    clientId: number
) {
    // Release hold from client
    await createTransaction(conn, {
        wallet_id: clientWallet,
        type: "release_hold",
        amount,
        hold_change: -amount,
        reference_type: "booking",
        reference_id: bookingId,
        initiated_by: clientId,
        initiated_role: "client",
        note: "Release Hold for Gym Service",
    });

    // Debit client
    await createTransaction(conn, {
        wallet_id: clientWallet,
        type: "payment",
        amount,
        reference_type: "booking",
        reference_id: bookingId,
        initiated_by: clientId,
        initiated_role: "client",
        note: "Payment for Gym Service (from Hold)",
    });

    // Credit gym
    await createTransaction(conn, {
        wallet_id: gymWallet,
        type: "transfer_in",
        amount,
        reference_type: "booking",
        reference_id: bookingId,
        initiated_by: clientId,
        initiated_role: "client",
        note: "Received Payment from Client (Hold Released)",
    });
}

/**
 * Admin manual adjustment
 */
export async function adminAdjust(
    conn: PoolConnection,
    walletId: number,
    amount: number,
    note: string,
    adminId: number
) {
    await createTransaction(conn, {
        wallet_id: walletId,
        type: "adjustment",
        amount,
        reference_type: "admin_action",
        initiated_by: adminId,
        initiated_role: "admin",
        note,
    });
}

// await addPayment(conn, clientWalletId, gymWalletId, 500, "BK123", clientId);
// await addDue(conn, clientWalletId, 500, "BK123", clientId);
// await settleDue(conn, clientWalletId, gymWalletId, 500, "BK123", clientId);
// await adminAdjust(conn, gymWalletId, 1000, "Manual settlement", adminId);
