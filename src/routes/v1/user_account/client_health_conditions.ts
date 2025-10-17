// import { mysql_datetime, sanitize } from "@dbnx/mysql";
// import fs, { existsSync, renameSync } from "node:fs";
// import path from "node:path";
// import sharp from "sharp";
// import { Router } from "tezx";
// import { useFormData } from "tezx/helper";
// import { paginationHandler } from "tezx/middleware/pagination";
// import { support_email } from "../../../config.js";
// import { sendEmail } from "../../../email/mailer.js";
// import { db, table_schema } from "../../../models/index.js";
// import { wrappedCryptoToken } from "../../../utils/crypto.js";
// import { AuthorizationMiddlewareUser } from "../auth/basicAuth.js";
// import user_account_bookmark from "./bookmark.js";

import { destroy, find, insert, mysql_datetime, sanitize, update } from "@tezx/sqlx/mysql";
import { Router } from "tezx";
import { paginationHandler } from "tezx/middleware";
import { dbQuery, TABLES } from "../../../models/index.js";

const client_health_conditions = new Router({
    basePath: '/clients/health-condition'
});

// !done
client_health_conditions.get('/stats/:client_id', async (ctx) => {
    try {
        const { user_info: { user_id }, role } = ctx.auth || {};
        const clientId = role === 'trainer' ? ctx.req.params?.client_id : user_id;

        const query = `
      SELECT
        ch.client_id,
        cl.fullname,
        cl.avatar,
        
        -- 🔹 Average Values
        ROUND(AVG(ch.height_cm), 2) AS avg_height,
        ROUND(AVG(ch.weight_kg), 2) AS avg_weight,
        ROUND(AVG(ch.bmi), 2) AS avg_bmi,
        ROUND(AVG(ch.fat_kg), 2) AS avg_fat,
        ROUND(AVG(ch.visceral_fat_percent), 2) AS avg_visceral_fat,
        ROUND(AVG(ch.subcutaneous_fat_percent), 2) AS avg_subcutaneous_fat,
        ROUND(AVG(ch.skeletal_muscle_percent), 2) AS avg_muscle,
        ROUND(AVG(ch.resting_metabolism), 2) AS avg_metabolism,
        ROUND(AVG(ch.heart_rate), 2) AS avg_heart_rate,
        ROUND(AVG(ch.blood_pressure_systolic), 2) AS avg_bp_sys,
        ROUND(AVG(ch.blood_pressure_diastolic), 2) AS avg_bp_dia,

        -- 🔹 Min/Max Values
        ROUND(MIN(ch.bmi), 2) AS min_bmi,
        ROUND(MAX(ch.bmi), 2) AS max_bmi,
        ROUND(MIN(ch.weight_kg), 2) AS min_weight,
        ROUND(MAX(ch.weight_kg), 2) AS max_weight,
        ROUND(MIN(ch.heart_rate), 2) AS min_hr,
        ROUND(MAX(ch.heart_rate), 2) AS max_hr,
        
        COUNT(DISTINCT ch.health_id) AS total_records,
        MAX(ch.created_at) AS last_updated
        
      FROM ${TABLES.CLIENTS.HEALTH_CONDITIONS} AS ch
      LEFT JOIN ${TABLES.CLIENTS.clients} AS cl ON cl.client_id = ch.client_id
      WHERE ch.client_id = ${sanitize(clientId)}
      GROUP BY ch.client_id, cl.fullname, cl.avatar
      ORDER BY last_updated DESC
      LIMIT 1;
    `;


        const { success, result, error } = await dbQuery(query);
        if (!success || !result?.length) {
            return ctx.json({
                success: false,
                message: "No health statistics found for this client",
            });
        }

        return ctx.json({
            success: true,
            message: "Client health statistics fetched successfully",
            data: result[0],
        });
    } catch (error) {
        console.error("Error fetching client health stats:", error);
        return ctx.json({
            success: false,
            message: "Internal server error",
        });
    }
});



client_health_conditions.get("/", paginationHandler({
    getDataSource: async (ctx, { page, limit, offset }) => {
        const { role } = ctx.auth || {};
        const { user_id, username, hashed, salt, email } = ctx.auth?.user_info || {};
        let client_id = user_id;
        if (role === 'trainer') {
            client_id = ctx?.req?.query?.client_id
        }
        let condition = `client_id = ${client_id}`;
        if (role === 'trainer') {
            condition += `AND added_by = ${user_id}`
        }

        let sql = find(`${TABLES.CLIENTS.HEALTH_CONDITIONS} as hc`, {
            sort: {
                created_at: -1
            },
            joins: [
                {
                    type: "LEFT JOIN",
                    on: `hc.added_by = trainers.trainer_id`,
                    table: TABLES.TRAINERS.trainers
                }
            ],
            columns: `hc.*, trainers.fullname, trainers.avatar`,
            limitSkip: {
                limit: limit,
                skip: offset
            },
            where: condition,
        })
        let count = find(`${TABLES.CLIENTS.HEALTH_CONDITIONS} as hc`, {
            columns: 'count(*) as count',
            where: condition,
        })
        const { success, result, error } = await dbQuery<any[]>(`${sql}${count}`);
        if (!success) {
            return {
                data: [],
                total: 0
            }
        }
        return {
            data: result?.[0],
            total: result?.[1]?.[0]?.count
        }
    },
}));

// !done
client_health_conditions.delete('/delete/:id', async (ctx) => {
    const { id } = ctx.req.params;
    const { role, user_info } = ctx.auth || {};
    const userId = user_info?.user_id;

    if (!id) {
        return ctx.json({ success: false, message: "Skeletal ID is required" });
    }
    try {
        // 2️⃣ Delete the notification
        const deleteSql = destroy(`${TABLES.CLIENTS.HEALTH_CONDITIONS}`, {
            where: `health_id = ${sanitize(id)}`
        })
        const { success: delSuccess, error } = await dbQuery(deleteSql);
        if (delSuccess) {
            return ctx.json({ success: true, message: "Record deleted successfully" });
        } else {
            return ctx.json({ success: false, message: "Failed to delete record" });
        }
    } catch (err) {
        return ctx.json({ success: false, message: "Internal server error" });
    }
});

client_health_conditions.post('/add-edit', async (ctx) => {
    const { type } = ctx.req.params;
    const { role, user_info } = ctx.auth || {};
    const userId = user_info?.user_id;

    try {
        const body = await ctx.req.json();
        const {
            created_at, health_id, updated_at, title, client_id, added_by, height_cm, weight_kg, fat_kg, visceral_fat_percent, subcutaneous_fat_percent, skeletal_muscle_percent, resting_metabolism, blood_pressure_systolic, blood_pressure_diastolic, heart_rate, body_temperature, blood_sugar_level, oxygen_saturation, chronic_diseases, medications, allergies, remarks, device_name
        } = body;

        let query = '';
        let message = '';
        let action = '';

        // ✅ Update existing record
        if (health_id) {
            query = update(TABLES.CLIENTS.HEALTH_CONDITIONS, {
                values: {
                    title,
                    health_id,
                    client_id,
                    added_by,
                    height_cm,
                    fat_kg,
                    visceral_fat_percent,
                    subcutaneous_fat_percent,
                    skeletal_muscle_percent,
                    resting_metabolism,
                    blood_pressure_systolic,
                    blood_pressure_diastolic,
                    heart_rate,
                    body_temperature,
                    blood_sugar_level,
                    oxygen_saturation,
                    chronic_diseases,
                    medications,
                    allergies,
                    remarks,
                    device_name,
                    updated_at: mysql_datetime(),
                },
                where: `health_id = ${health_id}`,
            });
            message = 'Health record updated successfully';
            action = 'update';
        }

        // ✅ Insert new record
        else {
            query = insert(TABLES.CLIENTS.HEALTH_CONDITIONS, {
                title,
                health_id,
                client_id: role === 'trainer' ? client_id : userId,
                added_by: role === 'trainer' ? userId : undefined,
                height_cm,
                fat_kg,
                visceral_fat_percent,
                subcutaneous_fat_percent,
                skeletal_muscle_percent,
                resting_metabolism,
                blood_pressure_systolic,
                blood_pressure_diastolic,
                heart_rate,
                body_temperature,
                blood_sugar_level,
                oxygen_saturation,
                chronic_diseases,
                medications,
                allergies,
                remarks,
                device_name,
                updated_at: mysql_datetime(),
            });
            message = 'Skeletal record added successfully';
            action = 'insert';
        }

        // ✅ Execute query
        const { success, result, error } = await dbQuery<any>(query);

        if (!success) {
            console.error("DB Error:", error);
            return ctx.json({
                success: false,
                message: 'Database operation failed',
            });
        }

        // ✅ Respond to client
        return ctx.json({
            success: true,
            message,
            action,
            data: {
                ...body,
                health_id: health_id || result.insertId,
                client_id: role === 'trainer' ? client_id : userId,
            },
        });
    } catch (err) {
        return ctx.json({
            success: false,
            message: 'Internal server error',
        });
    }
});


export default client_health_conditions;