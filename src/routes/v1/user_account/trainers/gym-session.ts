import { find, insert, mysql_date, mysql_datetime, sanitize, update } from "@tezx/sqlx/mysql";
import { Router } from "tezx";
import { dbQuery, TABLES } from "../../../../models/index.js";

const gymSessions = new Router({
    basePath: '/sessions'
});

gymSessions.get("/:trainer_id?", async (ctx) => {
    const { role } = ctx.auth || {};
    const { user_id } = ctx.auth?.user_info || {};
    let trainer_id = role === 'trainer' ? user_id : role !== 'trainer' ? ctx.req.params.trainer_id : null;

    if (role === 'client') {
        return ctx.json({ success: false, message: "unauthorized" });
    }

    if (!trainer_id) {
        return ctx.json({ success: false, message: "Trainer Id is required!" });
    }

    const sql = find(`${TABLES.GYMS.SESSIONS} gs`, {
        joins: `
      LEFT JOIN ${TABLES.TRAINERS.WEEKLY_SLOTS.WEEKLY_SLOTS} ws ON ws.session_id = gs.session_id AND (ws.trainer_id = ${trainer_id} OR ws.replacement_trainer_id = ${trainer_id})
      LEFT JOIN ${TABLES.CLIENTS.SESSION_ASSIGNMENT_CLIENTS} as sac ON sac.session_id = gs.session_id AND sac.status = 'active'
      LEFT JOIN ${TABLES.GYMS.gyms} as g ON g.gym_id = gs.gym_id
      LEFT JOIN ${TABLES.TRAINERS.SESSION_RUNS} sr ON sr.session_id = gs.session_id
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
      ws.trainer_id,
      g.gym_name,
      g.gym_name as gym_name,
      g.avatar as gym_avatar,
      g.logo_url as gym_logo_url,
      g.lat as gym_lat,
      g.lng as gym_lng,
      CASE 
        WHEN ws.replacement_trainer_id IS NOT NULL THEN 1
        ELSE 0
      END AS has_replacement_trainer
    `,
        groupBy: "gs.session_id",
        where: role === 'gym' ? `gs.gym_id = ${user_id}` : "",
    });

    const result = await dbQuery<any[]>(sql);
    return ctx.json(result);
});

gymSessions.post("/run/:session_id/:run_id?", async (ctx) => {
    const { role } = ctx.auth || {};
    const { user_id } = ctx.auth?.user_info || {};
    const session_id = ctx.req.params.session_id;
    const run_id = ctx.req.params.run_id;

    if (role !== "trainer") {
        return ctx.json({ success: false, message: "unauthorized" });
    }

    if (!session_id) {
        return ctx.json({ success: false, message: "Session Id is required!" });
    }

    const body = await ctx.req.json();

    const {
        trainer_id,
        started_at,
        ended_at,
        status,
        run_date,
        lat,
        lng,
    } = body;

    const tid = trainer_id || user_id;

    let sql;
    let newRunId = run_id;

    // ---------------------------------------------------------
    // INSERT (start session)
    // ---------------------------------------------------------
    if (!run_id) {
        sql = insert(TABLES.TRAINERS.SESSION_RUNS, {
            session_id,
            trainer_id: tid,
            started_at: started_at ? mysql_datetime(started_at) : undefined,
            status,
            run_date,
            lat,
            lng,
        });

        const insertRes = await dbQuery<any>(sql);

        if (!insertRes.success) {
            return ctx.json({ success: false, message: "Failed to start session" });
        }

        newRunId = insertRes.result?.insertId; // 💡 Correct auto increment run_id
    }

    // ---------------------------------------------------------
    // UPDATE (end session)
    // ---------------------------------------------------------
    else {
        sql = update(TABLES.TRAINERS.SESSION_RUNS, {
            values: {
                ended_at: ended_at ? mysql_datetime(ended_at) : undefined,
                status,
            },
            where: `run_id = ${sanitize(run_id)} AND trainer_id = ${sanitize(tid)}`,
        });

        const updateRes = await dbQuery(sql);

        if (!updateRes.success) {
            return ctx.json({ success: false, message: "Failed to update session run" });
        }

        // Insert attendance when ending session
        if (ended_at) {
            let attendanceSql = insert(TABLES.ATTENDANCE.SESSION_ATTENDANCES, {
                run_id,
                trainer_id: tid,
                checkin_at: started_at ? mysql_datetime(started_at) : undefined,
                checkout_at: mysql_datetime(ended_at),
                marked_by: tid,
                session_id,
                marked_role: "trainer",
            });
            await dbQuery(attendanceSql);
        }
    }
    // ---------------------------------------------------------
    // FINAL RESPONSE
    // ---------------------------------------------------------
    return ctx.json({
        success: true,
        message: "Session run recorded successfully!",
        data: {
            run_id: newRunId,
            session_id,
            trainer_id: tid,
            run_started_at: started_at || null,
            run_ended_at: ended_at || null,
            run_status: status,
            run_date,
            run_lat: lat,
            run_lng: lng,
        },
    });
});


export default gymSessions;