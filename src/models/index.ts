import mysql, { Pool, RowDataPacket } from "mysql2/promise";

// const host = process.env.DB_HOST as string;
// const port = parseInt(process.env.DB_PORT || "3306", 10);
// const user = process.env.DB_USER as string;
// const password = process.env.DB_PASS as string;
// const database = process.env.DB_NAME as string;

const host = 'localhost';
const port = parseInt(process.env.DB_PORT || "3306", 10);
const user = 'root';
const password = '11224455';


const pool: Pool = mysql.createPool({
    host,
    port,
    user,
    password,
    waitForConnections: true,
    idleTimeout: 60000,
    queueLimit: 0,
    enableKeepAlive: true,
    multipleStatements: true,
    keepAliveInitialDelay: 0,
});

export type DBResponse<T> = {
    success: boolean;
    message?: string;
    error?: any;
    result?: T;
};

async function dbExecute<T = RowDataPacket[]>(sql: string): Promise<DBResponse<T>> {
    const connection = await pool.getConnection();
    try {
        const [rows] = await connection.execute<any>(sql);
        return {
            success: true,
            result: rows,
            message: "Query executed successfully",
        };
    } catch (error: any) {
        return {
            success: false,
            error,
            message: error?.message || "Execution failed",
        };
    } finally {
        connection.release();
    }
}

async function dbQuery<T = RowDataPacket[]>(sql: string): Promise<DBResponse<T>> {
    const connection = await pool.getConnection();
    try {
        const [rows] = await connection.query<any>(sql);
        return {
            success: true,
            result: rows,
            message: "Query fetched successfully",
        };
    } catch (error: any) {
        return {
            success: false,
            error,
            message: error?.message || "Query failed",
        };
    } finally {
        connection.release();
    }
}

export { pool, dbExecute, dbQuery, DBResponse };
export * from "./table.js";