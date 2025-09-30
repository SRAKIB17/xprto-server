// utils/txn.ts
export function generateTxnID(prefix = "TXN") {
    const timestamp = Date.now().toString(36); // base36 timestamp
    const randomPart = Math.random().toString(36).substring(2, 8).toUpperCase(); // 6 random chars
    return `${prefix}-${timestamp}-${randomPart}`;
}
