import { find } from "@tezx/sqlx/mysql";
import { Router } from "tezx";
import { dbQuery } from "../../../../models/index.js";
import { TABLES } from "../../../../models/table.js";

// import user_account_document_flag from "./flag-document.js";
const membershipGymTrainer = new Router({
    basePath: "/gym-trainer"
});
membershipGymTrainer.get('/', async (ctx) => {
    try {
        const { membership } = ctx.req.query;
        if (membership === 'gym' || !membership) {
            // Gym-Trainer join
            let sql = find(`${TABLES.MEMBERSHIP_JOIN.TRAINER_GYMS} as tg`, {
                joins: `
                    LEFT JOIN ${TABLES.TRAINERS.trainers} as t 
                        ON t.trainer_id = tg.trainer_id
                    LEFT JOIN ${TABLES.GYMS.gyms} as g 
                        ON g.gym_id = tg.gym_id
                `,
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
        else if (membership === 'trainer') {
            // Trainer-only membership
            let sql = find(`${TABLES.TRAINERS.trainers} as t`, {
                joins: '',
                columns: `
                    t.*,
                    t.fullname as trainer_name,
                    t.avatar as trainer_avatar
                `
            });
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

