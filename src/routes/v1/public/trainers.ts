import { find, sanitize, SortType } from "@tezx/sqlx/mysql";
import { Router } from "tezx";
import { paginationHandler } from "tezx/middleware";
import { dbQuery, TABLES } from "../../../models/index.js";

let trainersList = new Router();
trainersList.get("/", paginationHandler({
    getDataSource: async (ctx, { page, limit, offset }) => {
        let condition = "t.is_online = 1 AND xprto = 1";
        const q = ctx.req.query;

        if (q.gender) {
            condition += ` AND t.gender = ${sanitize(q.gender)}`;
        }
        if (q.state) condition += ` AND t.state = ${sanitize(q.state)}`;
        if (q.district) condition += ` AND t.district = ${sanitize(q.district)}`;

        if (q.mode) {
            condition += ` AND ms.delivery_mode = ${sanitize(q.mode)}`;
        }
        if (q.min_age) condition += ` AND TIMESTAMPDIFF(YEAR, t.dob, CURDATE()) >= ${sanitize(q.min_age)}`;
        if (q.max_age) condition += ` AND TIMESTAMPDIFF(YEAR, t.dob, CURDATE()) <= ${sanitize(q.max_age)}`;

        // Rating filtering
        if (q.min_rating) condition += ` AND AVG(fb.rating) >= ${sanitize(q.min_rating)}`;

        /** Geo Filters */
        const lat_ = ctx.req.query.lat_ ? Number(ctx.req.query.lat_) : null;
        const lng_ = ctx.req.query.lng_ ? Number(ctx.req.query.lng_) : null;
        // WHERE distance filter (must be raw formula, not alias)
        if (q?.distance_km && lat_ && lng_) {
            condition += `
          AND (
            6371 * ACOS(
              COS(RADIANS(${lat_}))
              * COS(RADIANS(t.lat))
              * COS(RADIANS(t.lng) - RADIANS(${lng_}))
              + SIN(RADIANS(${lat_})) * SIN(RADIANS(t.lat))
            )
          ) <= ${q.distance_km}
        `;
        }

        if (q.search) {
            const s = sanitize(q.search);
            condition += ` AND
                (
                    t.fullname LIKE ${s}
                    OR t.email LIKE ${s}
                    OR t.phone LIKE ${s}
                    OR t.specialization LIKE ${s}
                    OR t.certification LIKE ${s}
                    OR t.district LIKE ${s}
                    OR t.state LIKE ${s}
                    OR t.country LIKE ${s}
                )
            `;
        }

        let sort: SortType<any> = {};

        switch (q.sort) {
            case "rating_desc":
                sort = { rating: -1 };
                break;
            case "rating_asc":
                sort = { rating: 1 };
                break;
            case "price_low":
                sort = { min_price: 1 };
                break;
            case "price_high":
                sort = { min_price: -1 };
                break;
            case "newest":
                sort = { registered_at: -1 };
                break;
            case "oldest":
                sort = { registered_at: 1 };
                break;
            case "experience_desc":
                sort = { experience_years: -1 };
                break;
            case "experience_asc":
                sort = { experience_years: 1 };
                break;
            default:
                sort = { registered_at: 1 };
        }

        // ================== HAVING ==================
        let havingSQL = "";

        // Price filter
        if (q.min_price) {
            havingSQL += (havingSQL ? " AND " : "") + `MIN(ms.price) >= ${sanitize(q.min_price)}`;
        }
        if (q.max_price) {
            havingSQL += (havingSQL ? " AND " : "") + `MAX(ms.price) <= ${sanitize(q.max_price)}`;
        }

        // Age filter
        if (q.min_age) {
            havingSQL += (havingSQL ? " AND " : "") + `TIMESTAMPDIFF(YEAR, t.dob, CURDATE()) >= ${sanitize(q.min_age)}`;
        }
        if (q.max_age) {
            havingSQL += (havingSQL ? " AND " : "") + `TIMESTAMPDIFF(YEAR, t.dob, CURDATE()) <= ${sanitize(q.max_age)}`;
        }

        // Rating filter
        if (q.min_rating) {
            havingSQL += (havingSQL ? " AND " : "") + `ROUND(AVG(fb.rating),2) >= ${sanitize(q.min_rating)}`;
        }
        if (q.max_rating) {
            havingSQL += (havingSQL ? " AND " : "") + `ROUND(AVG(fb.rating),2) <= ${sanitize(q.max_rating)}`;
        }

        // Total services filter (optional)
        if (q.min_services) {
            havingSQL += (havingSQL ? " AND " : "") + `COUNT(DISTINCT ms.service_id) >= ${sanitize(q.min_services)}`;
        }
        if (q.max_services) {
            havingSQL += (havingSQL ? " AND " : "") + `COUNT(DISTINCT ms.service_id) <= ${sanitize(q.max_services)}`;
        }

        // যদি কোন filter না থাকে, havingSQL হবে empty string

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

        let sql = find(`${TABLES.TRAINERS.trainers} as t`, {
            sort: sort,
            joins: `
    LEFT JOIN ${TABLES.TRAINERS.RED_FLAGS} as rf ON t.trainer_id = rf.trainer_id AND rf.status = 'active'
    LEFT JOIN ${TABLES.FEEDBACK.CLIENT_TRAINER} as fb ON fb.trainer_id = t.trainer_id
    LEFT JOIN ${TABLES.TRAINERS.services} as ms ON ms.trainer_id = t.trainer_id AND ms.status = 'active'
  `,
            columns: `
        t.trainer_id,
        t.login_type,
        t.gym_id,
        t.xprto,
        t.postal_code,
        t.is_online,
        t.country,
        t.state,
        t.district,
        t.address,
        t.lat,
        t.lng,
        t.email_verified,
        t.fullname,
        t.age,
        t.phone,
        t.gender,
        t.dob,
        t.bio,
        t.verified,
        t.badge,
        t.specialization,
        t.certification,
        t.avatar,
        t.cover,
        t.experience_years,
        t.hire_date,
        t.status,
        t.registered_at,
        t.last_visit,
        t.updated_at,
      ${lat_ && lng_
                    ? `
          (
            6371 * ACOS(
              COS(RADIANS(${lat_}))
              * COS(RADIANS(t.lat))
              * COS(RADIANS(t.lng) - RADIANS(${lng_}))
              + SIN(RADIANS(${lat_})) * SIN(RADIANS(t.lat))
            )
          ) AS distance_km,
          `
                    : ""}
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
            having: havingSQL ? havingSQL : undefined,
            where: condition,
            groupBy: 't.trainer_id'
        });

        let count = find(`${TABLES.TRAINERS.trainers} as t`, {
            columns: 'count(DISTINCT t.trainer_id) as count',
            joins: `
    LEFT JOIN ${TABLES.TRAINERS.RED_FLAGS} as rf ON t.trainer_id = rf.trainer_id AND rf.status = 'active'
    LEFT JOIN ${TABLES.FEEDBACK.CLIENT_TRAINER} as fb ON fb.trainer_id = t.trainer_id
    LEFT JOIN ${TABLES.TRAINERS.services} as ms ON ms.trainer_id = t.trainer_id AND ms.status = 'active'
            `,
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
}));

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