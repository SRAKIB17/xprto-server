import { find, sanitize } from "@tezx/sqlx/mysql";
import { Router } from "tezx";
import { dbQuery, TABLES } from "../../../../models/index.js";

const gymSessions = new Router({
    basePath: '/sessions'
});

gymSessions.get("/:client_id?", async (ctx) => {
    const { role } = ctx.auth || {};
    const { user_id } = ctx.auth?.user_info || {};
    let client_id = role === 'client_id' ? user_id : role !== 'client_id' ? ctx.req.params.client_id : null;

    const { type } = ctx.req.query

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
        groupBy: "gs.session_id",
        where: condition
    });

    const result = await dbQuery<any[]>(sql);
    return ctx.json(result);
});

export default gymSessions;