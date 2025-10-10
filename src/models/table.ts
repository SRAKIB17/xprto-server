// src/db/tables.ts
const database = 'u476740337_xprto';

const concat = (table: string, db: string = database) => {
    return `${db}.${table}`
}
export const TABLES = {
    CLIENTS: {
        clients: concat("clients")
    },
    TRAINERS: {
        WEEKLY_SLOTS: {
            WEEKLY_SLOTS: concat("trainer_weekly_slots"),
            SLOT_EXCEPTIONS: concat("slot_exceptions")
        },
        services: concat("trainer_services"),
        kyc_verification: concat("trainer_kyc_verification"),
        badge_verification: concat("trainer_badge_verification"),
        trainers: concat("trainers"),
    },
    GYMS: {
        gyms: concat("gyms"),
    },
    ADMIN: {
        admin: concat("admin_details"),
    },
    ABUSE_REPORTS: {
        HISTORY: concat("abuse_reports")
    },
    WALLETS: {
        WALLET_PAYOUTS: concat("wallet_payouts"),
        WALLETS: concat('wallets'),
        transactions: concat("wallet_transactions")
    },
    SUPPORT_TICKETS: {
        SUPPORT_TICKETS: concat('support_tickets'),
        SUPPORT_MESSAGES: concat("support_messages")
    },
    NOTIFICATIONS: concat("notifications"),
    USER_DOCUMENTS: concat("user_documents"),
    FEEDBACK: {
        CLIENT_TRAINER: concat("client_trainer_feedback")
    },
    CHAT_ROOMS: {
        chat_rooms: concat('chat_rooms'),
        memberships: concat('chat_room_memberships'),
        messages: concat('chat_messages')
    }

} as const;
// ('client', 'gym', 'trainer', 'admin') 
// 👉 type এর জন্য
export type TableName = (typeof TABLES)[keyof typeof TABLES];
