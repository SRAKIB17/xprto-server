import { find } from "@tezx/sqlx/mysql";
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
    `,
        columns: `
       gs.*,
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
      ws.replacement_trainer_id,
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

export default gymSessions;