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
        WALLETS: concat('wallets'),
    },
    SUPPORT_TICKETS: {
        SUPPORT_TICKETS: concat('support_tickets'),
        SUPPORT_MESSAGES: concat("support_messages")
    },
    NOTIFICATIONS: concat("notifications"),
    USER_DOCUMENTS: concat("user_documents"),
    FEEDBACK: {
        CLIENT_TRAINER: concat("client_trainer_feedback")
    }

} as const;
// ('client', 'gym', 'trainer', 'admin') 
// 👉 type এর জন্য
export type TableName = (typeof TABLES)[keyof typeof TABLES];
