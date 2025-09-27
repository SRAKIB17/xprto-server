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
    NOTIFICATIONS: concat("notifications"),
    FEEDBACK: {
        CLIENT_TRAINER: concat("client_trainer_feedback")
    }

} as const;

// 👉 type এর জন্য
export type TableName = (typeof TABLES)[keyof typeof TABLES];
