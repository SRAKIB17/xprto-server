
import { destroy, find, insert, mysql_datetime, sanitize, update } from "@tezx/sqlx/mysql";
import { Router } from "tezx";
import { dbQuery, TABLES } from "../../../../models/index.js";

// import user_account_document_flag from "./flag-document.js";
const availabilitySlotsWeekly = new Router({
    basePath: '/availability-slots'
});

availabilitySlotsWeekly.get("/:gym_id/:trainer_id", async (ctx) => {
    const { role } = ctx.auth || {};
    const { user_id } = ctx.auth?.user_info || {};
    const { gym_id, trainer_id } = ctx.req.params;

    let condition = `(ws.trainer_id = ${sanitize(trainer_id)} OR ws.replacement_trainer_id = ${sanitize(trainer_id)}) AND ws.gym_id = ${sanitize(gym_id)}`;

    let sql = find(`${TABLES.TRAINERS.WEEKLY_SLOTS.WEEKLY_SLOTS} as ws`, {
        joins: `LEFT JOIN ${TABLES.GYMS.SESSIONS} as gs on gs.session_id = ws.session_id
        LEFT JOIN ${TABLES.TRAINERS.trainers} as T ON T.trainer_id = ws.replacement_trainer_id`,
        columns: `ws.*, gs.*, T.fullname as replacement_trainer_name`,
        sort: {
            "ws.slot_id": -1
        },
        where: condition,
    });
    return ctx.json(await dbQuery<any[]>(`${sql}`));
});

availabilitySlotsWeekly.put('/update/:slot_id', async (ctx) => {
    try {
        const { role, user_info } = ctx.auth || {};
        if (role !== 'gym') {
            return ctx.json({ success: false, message: "Unauthorized!" });
        }
        const { slot_id } = ctx.req.params;
        const userId = user_info?.user_id;
        const body = await ctx.req.json();

        // ✅ Validate inputs
        if (!slot_id) {
            return ctx.json({ success: false, message: "Slot ID required." });
        }

        // ✅ Allow only specific fields to be updated
        const allowedFields = [
            "slot_id",
            "session_id",
            "trainer_id",
            "replacement_trainer_id",
            "gym_id",
            "created_at",
            "updated_at"
        ];

        const updateData: Record<string, any> = {};
        for (const key of allowedFields) {
            if (key in body) updateData[key] = body[key];
        }

        // ✅ Automatically record decision metadata
        updateData.updated_at = mysql_datetime();

        if (Object.keys(updateData).length === 0) {
            return ctx.json({ success: false, message: "No valid fields to update." });
        }

        // ✅ Perform DB update
        const { success, } = await dbQuery(update(TABLES.TRAINERS.WEEKLY_SLOTS.WEEKLY_SLOTS, {
            values: updateData,
            where: `slot_id = ${sanitize(slot_id)}`
        }));

        if (!success) {
            return ctx.json({ success: false, message: "Failed to update slot request." });
        }

        return ctx.json({ success: true, message: "Slot updated successfully." });
    }
    catch (err) {
        return ctx.json({ success: false, message: "Internal server error" });
    }
});

availabilitySlotsWeekly.post('/', async (ctx) => {
    try {
        const { role, user_info } = ctx.auth || {};
        if (role !== 'gym') {
            return ctx.json({ success: false, message: "Unauthorized!" });
        }
        const {
            slot_id,
            session_id,
            trainer_id,
            replacement_trainer_id,
            gym_id,
            created_at,
            updated_at
        } = await ctx.req.json();

        const sql = insert(TABLES.TRAINERS.WEEKLY_SLOTS.WEEKLY_SLOTS, {
            slot_id,
            session_id,
            trainer_id,
            replacement_trainer_id,
            gym_id,
            created_at,
        })
        const { success, error } = await dbQuery(sql);

        if (!success) {
            return ctx.json({ success: false, message: "Failed to save slot" });
        }
        return ctx.json({ success: true, message: "Slot add successfully" });

    } catch (err) {
        return ctx.json({ success: false, message: "Internal server error" });
    }
});

availabilitySlotsWeekly.delete('/delete/:slot_id', async (ctx) => {
    try {
        const { role, user_info } = ctx.auth || {};
        if (role !== 'gym') {
            return ctx.json({ success: false, message: "Unauthorized!" });
        }
        const { slot_id } = ctx.req.params;

        const sql = destroy(TABLES.TRAINERS.WEEKLY_SLOTS.WEEKLY_SLOTS, { where: `slot_id = ${slot_id} AND gym_id = ${sanitize(user_info?.user_id)}` })
        const { success, error } = await dbQuery(sql);

        if (!success) {
            return ctx.json({ success: false, message: "Failed to delete slot" });
        }
        return ctx.json({ success: true, message: "Slot delete successfully" });

    } catch (err) {
        return ctx.json({ success: false, message: "Internal server error" });
    }
});

export default availabilitySlotsWeekly;