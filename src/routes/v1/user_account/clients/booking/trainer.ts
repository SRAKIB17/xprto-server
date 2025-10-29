import { find, sanitize } from "@tezx/sqlx/mysql";
import { Router } from "tezx";
import { dbQuery, TABLES } from "../../../../../models/index.js";


// import user_account_document_flag from "./flag-document.js";
const trainerBooking = new Router({
    basePath: '/trainers'
});
trainerBooking.get('/:trainer_id/services', async (ctx) => {
    let { trainer_id } = await ctx.req.params;

    let sql = find(`${TABLES.TRAINERS.services} as ms`, {
        joins: `LEFT JOIN ${TABLES.TRAINERS.trainers} as t ON t.trainer_id = ms.trainer_id`,
        columns: `
        ms.*,
        t.fullname,
        t.avatar
        `,
        sort: {
            service_id: -1
        },
        where: `ms.trainer_id = ${sanitize(trainer_id)} AND ms.verify_status = "approved"`,
    })
    return ctx.json(await dbQuery<any[]>(`${sql}`))
})

export default trainerBooking;