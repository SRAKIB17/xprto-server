import { Router } from "tezx";
import { insert, find, update, destroy, sanitize } from "@tezx/sqlx/mysql";
import { dbQuery, TABLES } from "../../../../models/index.js";

const gymSessions = new Router();

// =========================
// 1️⃣ Create Session
// =========================
gymSessions.post("/", async (ctx) => {
    const body = await ctx.req.json();
    const { role } = ctx.auth || {};
    const { user_id, } = ctx.auth?.user_info || {};

    const {
        week_days, // eta array
        start_time,
        service_name,
        description,
        capacity,
        duration_minutes,
        recurrence,
    } = body;

    const query = insert(TABLES.GYMS.SESSIONS, {
        week_days: week_days?.length ? week_days.join(",") : null,
        start_time,
        gym_id: user_id,
        service_name,
        description,
        capacity,
        duration_minutes,
        recurrence,
    });

    const { success, error } = await dbQuery(query);

    if (!success) return ctx.json({ success: false, message: "Failed to create session", error });

    return ctx.json({ success: true, message: "Session created successfully" });
});


// =========================
// 2️⃣ Get All Sessions (with filters)
// =========================
gymSessions.get("/", async (ctx) => {
    const { role } = ctx.auth || {};
    const { user_id, } = ctx.auth?.user_info || {};
    const query = find(TABLES.GYMS.SESSIONS, {
        where: `gym_id = ${sanitize(user_id)}`,
        sort: `session_id DESC`
    });

    return ctx.json(await dbQuery(query));
});

// =========================
// 4️⃣ Update Session
// =========================
gymSessions.put("/:session_id", async (ctx) => {
    const id = ctx.req.params.session_id;
    const body = await ctx.req.json();
    const { user_id, } = ctx?.auth?.user_info || {};
    const updateData = {
        ...(body.week_days && { week_days: body.week_days.join(",") }),
        ...(body.start_time && { start_time: body.start_time }),
        ...(body.service_name && { service_name: body.service_name }),
        ...(body.description && { description: body.description }),
        ...(body.capacity && { capacity: body.capacity }),
        ...(body.duration_minutes && { duration_minutes: body.duration_minutes }),
        ...(body.recurrence && { recurrence: body.recurrence }),
        ...(body.updated_by && { updated_by: body.updated_by })
    };
    const query = update(TABLES.GYMS.SESSIONS, {
        values: updateData,
        where: `session_id = ${sanitize(id)} and gym_id = ${user_id}`
    });

    const { success } = await dbQuery(query);

    if (!success) return ctx.json({ success: false, message: "Failed to update session" });

    return ctx.json({ success: true, message: "Session updated successfully" });
});


// =========================
// 5️⃣ Delete Session
// =========================
gymSessions.delete("/:session_id", async (ctx) => {
    const id = ctx.req.params.session_id;
    const { role } = ctx.auth || {};
    const { user_id, } = ctx.auth?.user_info || {};

    const query = destroy(TABLES.GYMS.SESSIONS, {
        where: `session_id = ${sanitize(id)} AND gym_id = ${user_id}`
    });

    const { success, result } = await dbQuery<any>(query);

    if (!success)
        return ctx.json({ success: false, message: "Failed to delete session" });

    if (result?.affectedRows === 0)
        return ctx.json({ success: false, message: "Session not found" });

    return ctx.json({ success: true, message: "Session deleted successfully" });
});


export default gymSessions;
