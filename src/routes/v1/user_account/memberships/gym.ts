import { find, sanitize } from "@tezx/sqlx/mysql";
import { Router } from "tezx";
import { dbQuery } from "../../../../models/index.js";
import { TABLES } from "../../../../models/table.js";

// import user_account_document_flag from "./flag-document.js";
const membershipGymTrainer = new Router({
    basePath: "/:for"
});
membershipGymTrainer.get('/', async (ctx) => {
    try {
        const _for = ctx.req.params?.for as "gym-client" | 'gym-trainer'
        const { user_id, fullname, email } = ctx.auth?.user_info || {};

        if (!user_id) {
            return ctx.json({ success: false, message: "Authentication required" });
        }

        if (_for === 'gym-trainer') {
            // Gym-Trainer join
            let sql = find(`${TABLES.MEMBERSHIP_JOIN.TRAINER_GYMS} as tg`, {
                joins: `
                    LEFT JOIN ${TABLES.TRAINERS.trainers} as t 
                        ON t.trainer_id = tg.trainer_id
                    LEFT JOIN ${TABLES.GYMS.gyms} as g 
                        ON g.gym_id = tg.gym_id
                `,
                where: `t.trainer_id = ${sanitize(user_id)}`,
                columns: `
                    tg.*,
                    t.fullname as trainer_name,
                    t.avatar as trainer_avatar,
                    g.gym_name as gym_name,
                    g.logo_url as gym_logo
                `
            });
            return ctx.json(await dbQuery(sql));
        }
        else if (_for === 'gym-client') {
            // Trainer-only membership
            const sql = find(`${TABLES.GYMS.gyms} as g`, {
                joins: `
            LEFT JOIN ${TABLES.GYMS.SESSIONS} as ss ON ss.gym_id = g.gym_id
            LEFT JOIN ${TABLES.CLIENTS.SESSION_ASSIGNMENT_CLIENTS} as ass ON ass.session_id = ss.session_id
            `,
                groupBy: 'g.gym_id',
                columns: `
              DISTINCT g.gym_id,
              g.gym_name as gym_name,
              g.logo_url as gym_logo
            `,
                where: `ass.client_id = ${sanitize(user_id)}`,
            })

            return ctx.json(await dbQuery(sql));
        }
        else {
            return ctx.json({ success: false, message: 'Invalid membership type' });
        }
    }
    catch (err) {
        return ctx.json({ success: false, message: 'Server error' });
    }
});


export default membershipGymTrainer;

