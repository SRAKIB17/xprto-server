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
        trainers: concat("trainers")
    },
    USERS: "users",
    USER_DETAILS: "user_details",
    WORKOUTS: "workouts",
    BOOKINGS: "bookings",
    WALLET: "wallet",
    ORDERS: "orders",
    PRODUCTS: "products",
    CATEGORIES: "categories",
} as const;

// 👉 type এর জন্য
export type TableName = (typeof TABLES)[keyof typeof TABLES];
