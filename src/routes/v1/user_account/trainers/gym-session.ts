
import { find, sanitize } from "@tezx/sqlx/mysql";
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
      LEFT JOIN ${TABLES.TRAINERS.WEEKLY_SLOTS.WEEKLY_SLOTS} ws
        ON ws.session_id = gs.session_id
        AND (ws.trainer_id = ${trainer_id} OR ws.replacement_trainer_id = ${trainer_id})
    `,
        columns: `
      gs.*,
      ws.trainer_id,
      ws.replacement_trainer_id,
      CASE 
        WHEN ws.replacement_trainer_id IS NOT NULL THEN 1
        ELSE 0
      END AS has_replacement_trainer
    `,
        where: role === 'gym' ? `gs.gym_id = ${user_id}` : "",
    });

    const result = await dbQuery<any[]>(sql);
    return ctx.json(result);
});

export default gymSessions;