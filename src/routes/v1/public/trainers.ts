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
        let condition = "t.is_online = 1";

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


        let count = find(`${TABLES.TRAINERS.trainers} as t`, {
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

trainersList.get('/feedback/dashboard/:trainer_id', async (ctx) => {
    try {
        const user_id = sanitize(ctx.req.params?.trainer_id)
        let sql = find(TABLES.FEEDBACK.CLIENT_TRAINER, {
            sort: {
                feedback_id: -1
            },
            limitSkip: {
                limit: 3,
            },
            where: `trainer_id = ${user_id}`
        });

        let matrix = find(TABLES.FEEDBACK.CLIENT_TRAINER, {
            columns: `
                    ROUND(AVG(rating), 2) AS average_score,
                    SUM(CASE WHEN rating >= 4 THEN 1 ELSE 0 END) AS positive_count,
                    SUM(CASE WHEN rating = 3 THEN 1 ELSE 0 END) AS neutral_count,
                    SUM(CASE WHEN rating <= 2 THEN 1 ELSE 0 END) AS negative_count,
                    CONCAT(
                        ROUND(
                            SUM(CASE WHEN reply IS NOT NULL THEN 1 ELSE 0 END) / COUNT(*) * 100, 0
                        ), '%'
                    ) AS response_rate,
                    CONCAT(
                        FLOOR(AVG(TIMESTAMPDIFF(MINUTE, created_at, updated_at)) / 60), 'h ',
                        MOD(FLOOR(AVG(TIMESTAMPDIFF(MINUTE, created_at, updated_at))), 60), 'm'
                    ) AS avg_reply_time
                `,
            where: `trainer_id = ${user_id}`
        });
        const { success, result, error } = await dbQuery(`${sql}${matrix}`);

        if (!success) {
            return ctx.status(500).json({
                recent: [],
                metrics: {
                    average_score: 0,
                    positive_count: 0,
                    neutral_count: 0,
                    negative_count: 0,
                    response_rate: '0%',
                    avg_reply_time: '0h 0m'
                },
                success: false,
                message: "Failed to fetch dashboard metrics", error
            });
        }
        return ctx.json({
            success: true,
            recent: result?.[0],
            metrics: result?.[1]?.[0] || {
                average_score: 0,
                positive_count: 0,
                neutral_count: 0,
                negative_count: 0,
                response_rate: '0%',
                avg_reply_time: '0h 0m'
            }
        });
    } catch {
        return ctx.status(500).json({ success: false, message: "Something went wrong", });
    }
});

trainersList.get("/feedback/:trainer_id",
    paginationHandler({
        getDataSource: async (ctx, { page, limit, offset }) => {
            const { rating, sort } = ctx?.req.query;
            const user_id = sanitize(ctx.req.params?.trainer_id)
            let condition = `trainer_id = ${user_id}`
            if (rating) {
                condition += ` AND rating BETWEEN ${rating} AND 5`
            }
            let sortObj: any = {
                feedback_id: -1
            };

            if (sort === 'highest' || sort === 'lowest') {
                sortObj = {
                    rating: sort === 'highest' ? -1 : 1
                }
            }

            let sql = find(TABLES.FEEDBACK.CLIENT_TRAINER, {
                sort: sortObj,
                limitSkip: {
                    limit: limit,
                    skip: offset
                },
                where: condition,
            })
            let count = find(TABLES.FEEDBACK.CLIENT_TRAINER, {
                columns: 'count(*) as count',
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

export default trainersList;