// src/db/tables.ts
export const TABLES = {
    CLIENT: {

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
