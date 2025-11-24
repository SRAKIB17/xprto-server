import { find, sanitize } from "@tezx/sqlx/mysql";
import { Router } from "tezx";
import { dbQuery, TABLES } from "../../../../models";

const myGym = new Router({
    basePath: '/my-gym'
});
myGym.get('/', async (ctx) => {
    const _for = ctx.req.params?.for as "gym-client" | 'gym-trainer'
    const { user_id, fullname, email } = ctx.auth?.user_info || {};

    if (!user_id) {
        return ctx.json({ success: false, message: "Authentication required" });
    }

    const sql = find(`${TABLES.GYMS.gyms} as g`, {
        joins: `
            LEFT JOIN ${TABLES.GYMS.SESSIONS} as ss ON ss.gym_id = g.gym_id
            LEFT JOIN ${TABLES.CLIENTS.SESSION_ASSIGNMENT_CLIENTS} as ass ON ass.session_id = ss.session_id
            LEFT JOIN ${TABLES.CLIENTS.CLIENT_GYM_MEMBERSHIPS} as cgm ON cgm.gym_id = g.gym_id
            `,
        groupBy: 'g.gym_id',
        columns: `
              DISTINCT g.gym_id,
              g.gym_name as gym_name,
              g.logo_url as gym_logo,
              g.address,
              g.about,
              g.gym_type,
              g.postal_code,
              g.country,
              g.district
            `,
        where: `(ass.client_id = ${sanitize(user_id)} AND ass.valid_to >= CURRENT_DATE()) OR (cgm.client_id = ${sanitize(user_id)} AND cgm.valid_to >= CURRENT_DATE())`,
    })

    return ctx.json(await dbQuery(sql));
})

export default myGym;