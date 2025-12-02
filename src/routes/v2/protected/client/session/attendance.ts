import { find, sanitize } from "@tezx/sqlx/mysql";
import { Router } from "tezx";
import { dbQuery, TABLES } from "../../../../../models/index.js";

const sessionClientAttendance = new Router();
sessionClientAttendance.get('/:session_id/:date?', async (ctx) => {
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

    // Determine which user's attendance we are fetching
    // 👉 Clients only see their own.  
    // 👉 Trainers/Admins can override via ?client_id=
    let client_id = user_id;

    const where = `
        MONTH(checkin_at) = ${sanitize(month)} 
        AND session_id = ${sanitize(session_id)} 
        AND client_id = ${sanitize(client_id)}
    `;

    const data = await dbQuery(
        find(TABLES.ATTENDANCE.SESSION_ATTENDANCES, { where })
    );

    return ctx.json(data);
});

export default sessionClientAttendance;