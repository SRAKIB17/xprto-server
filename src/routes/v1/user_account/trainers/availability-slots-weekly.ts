
import { find, insert, mysql_date, mysql_datetime, sanitize, update } from "@tezx/sqlx/mysql";
import { Router } from "tezx";
import { paginationHandler } from "tezx/middleware";
import { DirectoryServe, filename } from "../../../../config.js";
import { dbQuery, TABLES } from "../../../../models/index.js";
import { copyFile } from "../../../../utils/fileExists.js";

// import user_account_document_flag from "./flag-document.js";
const availabilitySlotsWeekly = new Router({
    basePath: '/availability-slots'
});

availabilitySlotsWeekly.get("/:gym_id/:trainer_id", async (ctx) => {
    const { role } = ctx.auth || {};
    const { user_id } = ctx.auth?.user_info || {};
    const { gym_id, trainer_id } = ctx.req.params;

    let condition = `ws.trainer_id = ${sanitize(trainer_id)} AND ws.gym_id = ${sanitize(gym_id)}`;

    let sql = find(`${TABLES.TRAINERS.WEEKLY_SLOTS.WEEKLY_SLOTS} as ws`, {
        columns: `
        ws.*,
        gs.week_day as session_week_day,
        gs.start_time as session_start_time,
        gs.duration_minutes as session_duration_minutes
        `,
        joins: `LEFT JOIN ${TABLES.GYMS.SESSIONS} as gs on gs.session_id = ws.session_id`,
        sort: {
            "ws.slot_id": -1
        },
        where: condition,
    })
    return ctx.json(await dbQuery<any[]>(`${sql}`));
});

availabilitySlotsWeekly.post('/update/:leave_id', async (ctx) => {
    try {
        const { role, user_info } = ctx.auth || {};
        if (role !== 'gym') {
            return ctx.json({ success: false, message: "Unauthorized!" });
        }

        const { leave_id } = ctx.req.params;
        const userId = user_info?.user_id;
        const body = await ctx.req.json();

        // ✅ Validate inputs
        if (!leave_id) {
            return ctx.json({ success: false, message: "Leave ID required." });
        }

        // ✅ Allow only specific fields to be updated
        const allowedFields = [
            "status",          // pending / approved / rejected
            "admin_comments",  // remarks from manager
            "is_paid",         // mark paid/unpaid
            "decision_by",     // who approved/rejected
            "decision_role",   // 'gym_owner'
            "decision_reason", // reason for decision
            "decision_at"      // timestamp
        ];

        const updateData: Record<string, any> = {};
        for (const key of allowedFields) {
            if (key in body) updateData[key] = body[key];
        }

        // ✅ Automatically record decision metadata
        updateData.decision_by = userId;
        updateData.decision_role = role;
        updateData.decision_at = mysql_datetime();

        if (Object.keys(updateData).length === 0) {
            return ctx.json({ success: false, message: "No valid fields to update." });
        }

        // ✅ Perform DB update
        const { success, error } = await dbQuery(update(TABLES.TRAINERS.LEAVE_REQUESTS, {
            values: updateData,
            where: `leave_id = ${sanitize(leave_id)}`
        }));

        if (!success) {
            return ctx.json({ success: false, message: "Failed to update leave request." });
        }

        return ctx.json({ success: true, message: "Leave request updated successfully." });
    }
    catch (err) {
        return ctx.json({ success: false, message: "Internal server error" });
    }
});

availabilitySlotsWeekly.post('/apply', async (ctx) => {
    try {

        const { role, user_info } = ctx.auth || {};
        const userId = user_info?.user_id;
        const { start_date, end_date, gym_id, leave_type, is_paid, reason, attachments, retroactive } = await ctx.req.json();
        let finalAttachments: string[] = [];
        if (Array.isArray(attachments)) {
            for (const att of attachments) {
                // assume `att` is client temp file path or filename
                const fileName = filename(att); // extract filename
                const destPath = DirectoryServe.LeaveRequestAttachments(fileName);

                const copied = await copyFile(att, destPath, true);
                if (copied) {
                    finalAttachments.push(destPath); // store relative path or URL
                }
            }
        }

        const sql = insert(TABLES.TRAINERS.LEAVE_REQUESTS, {
            start_date: mysql_date(start_date),
            end_date: mysql_date(end_date),
            leave_type,
            is_paid,
            trainer_id: userId,
            gym_id: gym_id,
            reason,
            attachment: finalAttachments?.length ? JSON.stringify(finalAttachments) : undefined,
            retroactive
        })
        const { success, error } = await dbQuery(sql);

        if (!success) {
            return ctx.json({ success: false, message: "Failed to save leave request" });
        }

        return ctx.json({ success: true, message: "Leave request submitted successfully" });

    } catch (err) {
        console.error("Leave request error:", err);
        return ctx.json({ success: false, message: "Internal server error" });
    }
});

export default availabilitySlotsWeekly;