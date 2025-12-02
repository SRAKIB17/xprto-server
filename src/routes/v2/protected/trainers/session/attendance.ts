import { find, sanitize } from "@tezx/sqlx/mysql";
import { Router } from "tezx";
import { dbQuery, TABLES } from "../../../../../models/index.js";

const sessionTrainerAttendance = new Router();
sessionTrainerAttendance.get('/:session_id/:date?', async (ctx) => {
    const { role, user_info } = ctx.auth ?? {};
    const { user_id } = user_info ?? {};

    // Validate session_id
    const session_id = Number(ctx.req.params.session_id);
    if (isNaN(session_id)) {
        return ctx.status(400).json({ error: "Invalid session_id" });
    }

    // Handle date or fallback to current month
    let rawDate = ctx.req.params.date;
    let parsedDate = rawDate ? new Date(rawDate) : new Date();

    if (isNaN(parsedDate.getTime())) {
        return ctx.status(400).json({ error: "Invalid date format" });
    }

    const month = parsedDate.getMonth() + 1;
    let trainer_id = user_id;
    const where = `
        MONTH(checkin_at) = ${sanitize(month)} 
        AND session_id = ${sanitize(session_id)} 
        AND trainer_id = ${sanitize(trainer_id)}
    `;

    const data = await dbQuery(
        find(TABLES.ATTENDANCE.SESSION_ATTENDANCES, { where })
    );

    return ctx.json(data);
});

export default sessionTrainerAttendance;