import { find, sanitize } from "@tezx/sqlx/mysql";
import { Router } from "tezx";
import { dbQuery, TABLES } from "../../../../../models/index.js";

const gymAdmin = new Router();

gymAdmin.get("/:gym_id/documents", async (ctx) => {
    const { gym_id } = ctx.req.params;
    const { success, result } = await dbQuery(
        find(TABLES.USER_DOCUMENTS, {
            where: `user_id = ${gym_id} AND user_type = "trainer"`,
        })
    );
    return ctx.json({ success, data: result });
});

gymAdmin.get("/:gym_id/membership-plans", async (ctx) => {
    const { gym_id } = ctx.req.params;

    const sql = find(`${TABLES.GYMS.PLANS}`, {
        columns: `*`,
        where: `gym_id = ${sanitize(gym_id)}`,
        sort: {
            plan_id: -1,
        }
    });
    return ctx.json(await dbQuery(sql));
});

gymAdmin.get("/:gym_id/sessions", async (ctx) => {
    const { gym_id } = ctx.req.params;

    const sql = find(`${TABLES.GYMS.SESSIONS}`, {
        columns: `*`,
        where: `gym_id = ${sanitize(gym_id)}`,
        sort: {
            session_id: -1,
        }
    });
    return ctx.json(await dbQuery(sql));
});

export default gymAdmin;