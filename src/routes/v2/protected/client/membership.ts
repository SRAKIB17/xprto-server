import { find, sanitize } from "@tezx/sqlx/mysql";
import { Router } from "tezx";
import { dbQuery, TABLES } from "../../../../models/index.js";

const clientMembership = new Router({
    basePath: "/membership"
});

clientMembership.get('/', async (ctx) => {
    const auth = ctx.auth ?? {};
    const { user_id } = ctx.auth?.user_info || {};

    const sql = find(`${TABLES.CLIENTS.CLIENT_GYM_MEMBERSHIPS} as cgm`, {
        joins: `
            LEFT JOIN ${TABLES.GYMS.PLANS} as pl ON pl.plan_id = cgm.plan_id
            LEFT JOIN ${TABLES.GYMS.gyms} as gm  ON gm.gym_id = cgm.gym_id
        `,
        sort: {
            is_active: -1
        },
        columns: `
            cgm.*,
            pl.*,
            gm.gym_name,
            gm.logo_url,

            CASE
                WHEN cgm.valid_from >= CURRENT_DATE()
                    THEN 1
                ELSE 0
            END AS is_active,

            CASE
                WHEN cgm.valid_to < CURRENT_DATE()
                    THEN 'Your membership has expired. Please visit the gym to renew it.'
                ELSE NULL
            END AS renewal_message
        `,
        where: `cgm.client_id = ${sanitize(user_id)}`
    });

    return ctx.json(await dbQuery(sql));
});

export default clientMembership;
