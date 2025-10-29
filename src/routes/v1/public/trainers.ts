import { find, sanitize, SortType } from "@tezx/sqlx/mysql";
import { Router } from "tezx";
import { paginationHandler } from "tezx/middleware";
import { dbQuery, TABLES } from "../../../models/index.js";

let trainersList = new Router();
trainersList.get("/", paginationHandler({
    getDataSource: async (ctx, { page, limit, offset }) => {
        const { role } = ctx.auth || {};
        const { search, verify, mode, status } = ctx?.req.query;
        const { user_id, username, hashed, salt, } = ctx.auth?.user_info || {};
        let condition = "";

        // if ((role === 'gym' || role === 'admin') && !status) {
        //     condition = "jp.status IN ('draft', 'published', 'closed', 'archived')"
        // }
        // else {
        //     condition = `jp.status = "published"`
        // }

        // if (role === 'gym') {
        //     condition += ` AND jp.gym_id = ${sanitize(user_id)}`;
        // }
        // if (status) {
        //     condition += ` AND jp.status = ${sanitize(status)}`;
        // }


        if (search) {
            // condition += ` AND MATCH(title, description, subtitle) AGAINST (${sanitize(search)} IN NATURAL LANGUAGE MODE)`;
        }

        let sort = {
            registered_at: 1 // old first
        } as SortType<any>

        let sql = find(`${TABLES.TRAINERS.trainers} as t`, {
            sort: sort,
            joins: `
    LEFT JOIN ${TABLES.TRAINERS.RED_FLAGS} as rf ON t.trainer_id = rf.trainer_id AND rf.status = 'active'
    LEFT JOIN ${TABLES.FEEDBACK.CLIENT_TRAINER} as fb ON fb.trainer_id = t.trainer_id
    LEFT JOIN ${TABLES.TRAINERS.services} as ms ON ms.trainer_id = t.trainer_id AND ms.status = 'active'
  `,
            columns: `
    t.*,
    COUNT(DISTINCT rf.red_flag_id) AS active_red_flags_count,
    ROUND(AVG(fb.rating), 2) AS rating,
    COUNT(DISTINCT fb.feedback_id) AS reviews,
    MIN(ms.price) AS min_price,
    TIMESTAMPDIFF(YEAR, t.dob, CURDATE()) as age,
    MAX(ms.price) AS max_price,
    COUNT(DISTINCT ms.service_id) AS total_services,
    GROUP_CONCAT(DISTINCT ms.delivery_mode) AS delivery_modes
  `,
            limitSkip: {
                limit: limit,
                skip: offset
            },
            where: condition,
            groupBy: 't.trainer_id'
        });


        let count = find(`${TABLES.TRAINERS.trainers}`, {
            columns: 'count(*) as count',
            // joins: `LEFT JOIN ${TABLES.GYMS.gyms} as g ON jp.gym_id = g.gym_id`,
            where: condition,
        })
        const { success, result, error } = await dbQuery<any[]>(`${sql}${count}`);

        if (!success) {
            return {
                data: [],
                total: 0
            }
        }
        return {
            data: result?.[0],
            total: result?.[1]?.[0]?.count
        }
    },
})
);

// xprtoJobFeed.get('/:id', async (ctx) => {
//     const { id } = ctx.req.params;
//     const { role, user_info } = ctx.auth || {};
//     const userId = user_info?.user_id;
//     const { images, video } = await ctx.req.json();

//     if (!id) {
//         return ctx.json({ success: false, message: "Service ID is required" });
//     }
//     try {
//         let condition = `jp.job_id = ${sanitize(id)}`;
//         if ((role === 'gym' || role === 'admin')) {
//             condition += " AND jp.status IN ('draft', 'published', 'closed', 'archived')"
//         }
//         else {
//             condition += ` AND jp.status = "published"`
//         }

//         if (role === 'gym') {
//             condition += ` AND jp.gym_id = ${sanitize(userId)}`;
//         }

//         const joinsArr = [
//             `LEFT JOIN ${TABLES.GYMS.gyms} as g ON jp.gym_id = g.gym_id`,
//             `LEFT JOIN ${TABLES.TRAINERS.job_applications} as jt ON jt.job_id = jp.job_id`,
//         ];

//         let sql = find(`${TABLES.GYMS.job_posts} as jp`, {
//             joins: joinsArr.join(' '),
//             groupBy: `jp.job_id`,
//             columns: `jp.*,
//             g.gym_name as gym_name,
//             g.lat as gym_lat,
//             g.lng as gym_lng,
//             g.district as gym_district,
//             g.about as gym_about,
//             g.state as gym_state,
//             g.address as gym_address,
//             g.logo_url as gym_logo,
//             g.country as gym_country,
//             CASE WHEN jt.id IS NOT NULL AND jt.trainer_id = ${sanitize(userId)} THEN 'applied' ELSE 'not_applied' END as application_status,
//             COUNT(jt.id) as total_applications
//             `,
//             where: condition
//         });
//         console.log(sql);
//         return ctx.json(await dbQuery<any>(sql));

//     } catch (err) {
//         return ctx.json({ success: false, message: "Internal server error" });
//     }
// });
export default trainersList;