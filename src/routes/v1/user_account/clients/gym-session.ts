import { find, insert, mysql_date, mysql_datetime, sanitize } from "@tezx/sqlx/mysql";
import { Router } from "tezx";
import { dbQuery, TABLES } from "../../../../models/index.js";

const gymSessions = new Router({
    basePath: '/sessions'
});

gymSessions.get("/:client_id?", async (ctx) => {
    const { role } = ctx.auth || {};
    const { user_id } = ctx.auth?.user_info || {};
    let client_id = role === 'client_id' ? user_id : role !== 'client_id' ? ctx.req.params.client_id : null;

    const { type, date } = ctx.req.query;

    if (role === 'trainer') {
        return ctx.json({ success: false, message: "unauthorized" });
    }

    if (!client_id) {
        return ctx.json({ success: false, message: "Client Id is required!" });
    }
    let condition = `((${type === 'history' ? "sac.status != 'active' OR sac.valid_to < CURRENT_DATE()" : "sac.status = 'active' AND sac.valid_to >= CURRENT_DATE()"}) AND sac.client_id = ${sanitize(client_id)})`
    if (role === 'gym') {
        condition += ` AND gs.gym_id = ${user_id}`
    }
    const sql = find(`${TABLES.CLIENTS.SESSION_ASSIGNMENT_CLIENTS} sac`, {
        sort: `sac.assignment_id ASC`,
        joins: `
      LEFT JOIN ${TABLES.GYMS.SESSIONS} as gs ON sac.session_id = gs.session_id 
      LEFT JOIN ${TABLES.GYMS.gyms} g ON g.gym_id = gs.gym_id
      LEFT JOIN ${TABLES.TRAINERS.WEEKLY_SLOTS.WEEKLY_SLOTS} ws ON ws.session_id = gs.session_id
      LEFT JOIN ${TABLES.TRAINERS.trainers} t ON t.trainer_id = ws.trainer_id
      LEFT JOIN ${TABLES.TRAINERS.trainers} rt ON ws.replacement_trainer_id = rt.trainer_id
      LEFT JOIN ${TABLES.TRAINERS.SESSION_RUNS} sr ON sr.session_id = gs.session_id AND DATE(sr.run_date) = ${date ? sanitize(mysql_date(date as string)) : 'CURRENT_DATE()'}
    `,
        columns: `
       gs.*,
       sr.run_id,
       sr.started_at as run_started_at,
       sr.ended_at as run_ended_at,
       sr.status as run_status,
       sr.run_date,
       sr.lat as run_lat,
       sr.lng as run_lng,
       g.gym_name as gym_name,
       g.avatar as gym_avatar,
       g.logo_url as gym_logo_url,
       g.lat as gym_lat,
       g.lng as gym_lng,
       MAX(sac.assignment_id) as assignment_id,
        SUM(
            CASE
                WHEN sac.status = 'active'
                    AND sac.valid_to >= CURRENT_DATE()
                THEN 1
                ELSE 0
            END
        ) as total_client,
       CASE
        WHEN
            SUM(
                CASE
                    WHEN sac.status = 'active'
                        AND sac.valid_to >= CURRENT_DATE()
                    THEN 1
                    ELSE 0
                END
            ) >= gs.capacity
            THEN 1
            ELSE 0
      END AS is_full,
      sac.*,
      CASE 
        WHEN ws.replacement_trainer_id IS NOT NULL THEN 1
        ELSE 0
      END AS has_replacement_trainer,
      t.fullname as trainer_fullname,
      t.avatar as trainer_avatar,
      t.trainer_id as trainer_id,
      rt.fullname as replacement_trainer_fullname,
      rt.avatar as replacement_trainer_avatar,
      rt.trainer_id as replacement_trainer_id
    `,
        groupBy: "ws.slot_id",
        where: condition
    });

    const result = await dbQuery<any[]>(sql);
    return ctx.json(result);
});

gymSessions.post("/mark-attendance/:session_id/:run_id", async (ctx) => {
    const { role } = ctx.auth || {};
    const { user_id } = ctx.auth?.user_info || {};
    const session_id = ctx.req.params.session_id;
    const run_id = ctx.req.params.run_id;

    // Only client can mark attendance
    if (role !== "client") {
        return ctx.json({ success: false, message: "unauthorized" });
    }

    if (!session_id || !run_id) {
        return ctx.json({ success: false, message: "Session Id and run Id is required!" });
    }

    const body = await ctx.req.json();

    const {
        client_id,
        checkin_at,
        lat,
        lng,
    } = body;
    let findSql = find(TABLES.ATTENDANCE.SESSION_ATTENDANCES, {
        where: `session_id = ${sanitize(session_id)} AND run_id = ${sanitize(run_id)} AND
        client_id = ${sanitize(user_id)} AND marked_role = 'client' AND
        DATE(checkin_at) = ${sanitize(mysql_date(checkin_at))}`,
    });
    const findRes = await dbQuery<any>(findSql);
    if (findRes.success && findRes.result && findRes.result.length > 0) {
        return ctx.json({
            success: false,
            message: "Attendance already marked for this session run today!",
        });
    }
    // // The client who is marking attendance
    const cid = client_id || user_id;

    const attendanceSql = insert(TABLES.ATTENDANCE.SESSION_ATTENDANCES, {
        run_id,
        session_id,
        client_id: cid,
        checkin_at: mysql_datetime(checkin_at),
        marked_by: cid,
        marked_role: "client",
    });

    const insertRes = await dbQuery(attendanceSql);

    if (!insertRes.success) {
        return ctx.json({
            success: false,
            message: "Failed to mark attendance",
            error: insertRes.error,
        });
    }

    // --------------------------------------------
    // FINAL SUCCESS RESPONSE
    // --------------------------------------------
    return ctx.json({
        success: true,
        message: "Attendance marked successfully!",
    });
});


export default gymSessions;