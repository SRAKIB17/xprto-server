import { find, insert, mysql_date, mysql_datetime, sanitize, update } from "@tezx/sqlx/mysql";
import { Router } from "tezx";
import { dbQuery, TABLES } from "../../../../models/index.js";
import { paginationHandler } from "tezx/middleware";

const gymSessions = new Router({
    basePath: '/sessions'
});

gymSessions.get("/:trainer_id?", async (ctx) => {
    const { role } = ctx.auth || {};
    const { user_id, } = ctx.auth?.user_info || {};
    let trainer_id = role === 'trainer' ? user_id : role !== 'trainer' ? ctx.req.params.trainer_id : null;

    if (role === 'client') {
        return ctx.json({ success: false, message: "unauthorized" });
    }

    if (!trainer_id) {
        return ctx.json({ success: false, message: "Trainer Id is required!" });
    }
    const { date } = ctx.req.query;
    let condition = `(ws.trainer_id = ${sanitize(trainer_id)} OR ws.replacement_trainer_id = ${sanitize(trainer_id)})`;
    if (role === 'gym') {
        condition += ` AND gs.gym_id = ${user_id}`
    }
    const sql = find(`${TABLES.GYMS.SESSIONS} gs`, {
        joins: `
      LEFT JOIN ${TABLES.TRAINERS.WEEKLY_SLOTS.WEEKLY_SLOTS} ws ON ws.session_id = gs.session_id 
      LEFT JOIN ${TABLES.TRAINERS.trainers} rt ON ws.replacement_trainer_id = rt.trainer_id
      LEFT JOIN ${TABLES.CLIENTS.SESSION_ASSIGNMENT_CLIENTS} as sac ON sac.session_id = gs.session_id AND sac.status = 'active'
      LEFT JOIN ${TABLES.GYMS.gyms} as g ON g.gym_id = gs.gym_id
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
      rt.fullname as replacement_trainer_fullname,
      rt.avatar as replacement_trainer_avatar,
      rt.trainer_id as replacement_trainer_id,
      CASE 
        WHEN ws.replacement_trainer_id IS NOT NULL THEN 1
        ELSE 0
      END AS has_replacement_trainer
    `,
        groupBy: "ws.slot_id",
        where: condition
    });
    const result = await dbQuery<any[]>(sql);
    return ctx.json(result);
});

gymSessions.get("/specific/:session_id/:trainer_id?", async (ctx) => {
    const { role } = ctx.auth || {};
    const { user_id, } = ctx.auth?.user_info || {};
    let trainer_id = role === 'trainer' ? user_id : role !== 'trainer' ? ctx.req.params.trainer_id : null;
    const session_id = ctx.req.params.session_id;
    if (!session_id) {
        return ctx.json({ success: false, message: "Session Id is required!" });
    }
    if (role === 'client') {
        return ctx.json({ success: false, message: "unauthorized" });
    }

    if (!trainer_id) {
        return ctx.json({ success: false, message: "Trainer Id is required!" });
    }
    const { date } = ctx.req.query;
    let condition = `(ws.trainer_id = ${sanitize(trainer_id)} OR ws.replacement_trainer_id = ${sanitize(trainer_id)}) AND ws.session_id = ${sanitize(session_id)}`;
    if (role === 'gym') {
        condition += ` AND gs.gym_id = ${user_id}`
    }
    const sql = find(`${TABLES.GYMS.SESSIONS} gs`, {
        joins: `
      LEFT JOIN ${TABLES.TRAINERS.WEEKLY_SLOTS.WEEKLY_SLOTS} ws ON ws.session_id = gs.session_id 
      LEFT JOIN ${TABLES.TRAINERS.trainers} rt ON ws.replacement_trainer_id = rt.trainer_id
      LEFT JOIN ${TABLES.CLIENTS.SESSION_ASSIGNMENT_CLIENTS} as sac ON sac.session_id = gs.session_id AND sac.status = 'active'
      LEFT JOIN ${TABLES.GYMS.gyms} as g ON g.gym_id = gs.gym_id
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
      rt.fullname as replacement_trainer_fullname,
      rt.avatar as replacement_trainer_avatar,
      rt.trainer_id as replacement_trainer_id,
      CASE 
        WHEN ws.replacement_trainer_id IS NOT NULL THEN 1
        ELSE 0
      END AS has_replacement_trainer
    `,
        groupBy: "ws.slot_id",
        where: condition
    });
    const result = await dbQuery<any[]>(sql);
    return ctx.json(result);
});

gymSessions.get("/specific/clients/:session_id",
    paginationHandler({
        getDataSource: async (ctx, { page, limit, offset }) => {
            const { role } = ctx.auth || {};
            const search = ctx?.req.query?.search
            const { user_id, username, hashed, salt, email } = ctx.auth?.user_info || {};
            let condition = `sac.session_id = ${sanitize(ctx.req.params.session_id)}`
            if (search) {
                condition += ` AND (c.fullname LIKE "%${sanitize(search)}%" OR c.client_id = ${sanitize(search)})`;
            }
            let sql = find(`${TABLES.CLIENTS.SESSION_ASSIGNMENT_CLIENTS} as sac`, {
                joins: `
                LEFT JOIN ${TABLES.CLIENTS.clients} as c ON c.client_id = sac.client_id
                `,
                sort: {
                    "sac.assignment_id": -1
                },
                columns: `
                sac.*,
                c.client_id,
                c.login_type,
                c.gym_id,
                c.postal_code,
                c.country,
                c.state,
                c.district,
                c.address,
                c.lat,
                c.lng,
                c.xprto,
                c.email_verified,
                c.fullname,
                c.avatar,
                c.email,
                c.phone,
                c.is_pro,
                c.dob,
                c.age,
                c.bio,
                c.gender,
                c.membership_no,
                c.health_goal,
                c.emergency_contact,
                c.medical_conditions,
                c.registered_at
                `,
                limitSkip: {
                    limit: limit,
                    skip: offset
                },
                where: condition,
            })
            let count = find(`${TABLES.CLIENTS.SESSION_ASSIGNMENT_CLIENTS} as sac`, {
                joins: `
                LEFT JOIN ${TABLES.CLIENTS.clients} as c ON c.client_id = sac.client_id
                `,
                columns: 'count(*) as count',
                where: condition,
            })
            const { success, result } = await dbQuery<any[]>(`${sql}${count}`);
            if (!success) {
                return {
                    data: [],
                    total: 0
                }
            }
            return {
                data: result?.[0],
                total: result?.[1]?.[0]?.count
            } as any
        },
    })
);

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