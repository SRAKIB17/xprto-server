import { find, sanitize, SortType } from "@tezx/sqlx/mysql";
import { Router } from "tezx";
import { paginationHandler } from "tezx/middleware";
import { dbQuery, TABLES } from "../../../models/index.js";
import { AuthorizationMiddlewarePublic } from "../auth/basicAuth.js";

let gymList = new Router();
gymList.get("/", paginationHandler({
    getDataSource: async (ctx, { page, limit, offset }) => {
        const { role } = ctx.auth || {};
        const { search, verify, mode, status } = ctx?.req.query;
        const { user_id, username, hashed, salt, } = ctx.auth?.user_info || {};
        let condition = "g.status = 'active' AND (g.verification_status = 'verified' OR g.verification_status = 'fully_verified')";
        const q = ctx.req.query;


        // Basic filters

        if (q.country) condition += ` AND g.country = ${sanitize(q.country)}`;
        if (q.state) condition += ` AND g.state = ${sanitize(q.state)}`;
        if (q.district) condition += ` AND g.district = ${sanitize(q.district)}`;
        if (q.services) condition += ` AND g.services = ${sanitize(q.services)}`

        const lat_ = ctx.req.query.lat_ ? Number(ctx.req.query.lat_) : null;
        const lng_ = ctx.req.query.lng_ ? Number(ctx.req.query.lng_) : null;
        if (q?.distance_km && lat_ && lng_) {
            condition += `
          AND (
            6371 * ACOS(
              COS(RADIANS(${lat_}))
              * COS(RADIANS(g.lat))
              * COS(RADIANS(g.lng) - RADIANS(${lng_}))
              + SIN(RADIANS(${lat_})) * SIN(RADIANS(g.lat))
            )
          ) <= ${q.distance_km}
        `;
        }

        let havingSQL = "";

        // Membership price filters
        if (q.min_membership_price) havingSQL += (havingSQL ? " AND " : "") + `MIN(mp.price) >= ${sanitize(q.min_membership_price)}`;
        if (q.max_membership_price) havingSQL += (havingSQL ? " AND " : "") + `MAX(mp.price) <= ${sanitize(q.max_membership_price)}`;

        // Rating filters
        if (q.min_rating) havingSQL += (havingSQL ? " AND " : "") + `ROUND(AVG(fb.rating), 2) >= ${sanitize(q.min_rating)}`;
        if (q.max_rating) havingSQL += (havingSQL ? " AND " : "") + `ROUND(AVG(fb.rating), 2) <= ${sanitize(q.max_rating)}`;

        // Total plans filters
        if (q.min_plans) havingSQL += (havingSQL ? " AND " : "") + `COUNT(DISTINCT mp.plan_id) >= ${sanitize(q.min_plans)}`;
        if (q.max_plans) havingSQL += (havingSQL ? " AND " : "") + `COUNT(DISTINCT mp.plan_id) <= ${sanitize(q.max_plans)}`;
        // ========== SEARCH ==========
        if (q.search) {
            const s = JSON.stringify(`%${q.search}%`);
            condition += (` AND 
                (
                    g.gym_name LIKE ${s} OR 
                    g.fullname LIKE ${s} OR
                    g.email LIKE ${s} OR
                    g.phone LIKE ${s} OR
                    g.district LIKE ${s} OR
                    g.state LIKE ${s} OR
                    g.country LIKE ${s} OR
                    g.tagline LIKE ${s} OR
                    g.notes LIKE ${s} OR
                    g.description LIKE ${s} OR
                    g.facilities LIKE ${s} OR
                    g.plan_features LIKE ${s} OR
                    g.about LIKE ${s} OR
                    g.services LIKE ${s}
                )
            `);
        }

        let sort: SortType<any> = { registered_at: 1 }; // default: old first
        switch ((q.sort || "").toString()) {
            case "rating_desc":
                sort = { rating: -1 };
                break;
            case "rating_asc":
                sort = { rating: 1 };
                break;
            case "membership_price_low":
                sort = { membership_min_price: 1 };
                break;
            case "membership_price_high":
                sort = { membership_min_price: -1 };
                break;
            case "total_clients_desc":
                sort = { total_clients: -1 };
                break;
            case "total_clients_asc":
                sort = { total_clients: 1 };
                break;
            case "nearest":
            case "distance_asc":
                if (lat_ && lng_) sort = { distance_km: 1, "jp.created_at": -1 };
                break;
            case "reviews_desc":
                sort = { reviews: -1 };
                break;
            case "reviews_asc":
                sort = { reviews: 1 };
                break;
            case "newest":
                sort = { registered_at: -1 };
                break;
            case "oldest":
                sort = { registered_at: 1 };
                break;
            default:
                // keep default
                break;
        }

        // const havingParts: string[] = [];

        // // Membership price filters (aggregated MIN/MAX on plans)
        // if (q.min_membership_price) havingParts.push(`MIN(mp.price) >= ${sanitize(q.min_membership_price)}`);
        // if (q.max_membership_price) havingParts.push(`MAX(mp.price) <= ${sanitize(q.max_membership_price)}`);

        // // Rating filters (avg rating from feedback)
        // if (q.min_rating) havingParts.push(`ROUND(AVG(fb.rating), 2) >= ${sanitize(q.min_rating)}`);
        // if (q.max_rating) havingParts.push(`ROUND(AVG(fb.rating), 2) <= ${sanitize(q.max_rating)}`);

        // // Total plans filter
        // if (q.min_plans) havingParts.push(`COUNT(DISTINCT mp.plan_id) >= ${sanitize(q.min_plans)}`);
        // if (q.max_plans) havingParts.push(`COUNT(DISTINCT mp.plan_id) <= ${sanitize(q.max_plans)}`);

        // // Total clients filter (g.total_clients is a column — can be in WHERE)
        // if (q.min_total_clients) whereParts.push(`g.total_clients >= ${sanitize(q.min_total_clients)}`);
        // if (q.max_total_clients) whereParts.push(`g.total_clients <= ${sanitize(q.max_total_clients)}`);
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

        let sql = find(`${TABLES.GYMS.gyms} as g`, {
            sort: sort,
            joins: `
    LEFT JOIN ${TABLES.FEEDBACK.GYM_TRAINER_CLIENT} as fb ON fb.gym_id = g.gym_id
    LEFT JOIN ${TABLES.GYMS.PLANS} as mp ON mp.gym_id = g.gym_id AND mp.visibility = 'public'
  `,
            columns: `
    g.*,
     ${lat_ && lng_ ? `
          (
            6371 * ACOS(
              COS(RADIANS(${lat_}))
              * COS(RADIANS(g.lat))
              * COS(RADIANS(g.lng) - RADIANS(${lng_}))
              + SIN(RADIANS(${lat_})) * SIN(RADIANS(g.lat))
            )
          ) AS distance_km,
          ` : ""}
    ROUND(AVG(fb.rating), 2) AS rating,
    COUNT(DISTINCT fb.feedback_id) AS reviews,
    MIN(mp.price) AS membership_min_price,
    MAX(mp.price) AS membership_max_price,
    COUNT(DISTINCT mp.plan_id) AS total_plan
  `,
            limitSkip: {
                limit: limit,
                skip: offset
            },
            where: condition,
            having: havingSQL ? havingSQL : undefined,
            groupBy: 'g.gym_id'
        });
        let count = find(`${TABLES.GYMS.gyms} as g`, {
            columns: 'count(DISTINCT g.gym_id) as count',
            joins: `
          LEFT JOIN ${TABLES.FEEDBACK.GYM_TRAINER_CLIENT} as fb ON fb.gym_id = g.gym_id
          LEFT JOIN ${TABLES.GYMS.PLANS} as mp ON mp.gym_id = g.gym_id AND mp.visibility = 'public'
            `,
            having: havingSQL ? havingSQL : undefined,
            where: condition,
        });

        //         let count = `
        //   SELECT COUNT(*) as count FROM (
        //     SELECT t.trainer_id
        //     FROM ${TABLES.TRAINERS.trainers} as t
        //     LEFT JOIN ${TABLES.TRAINERS.RED_FLAGS} as rf 
        //         ON t.trainer_id = rf.trainer_id AND rf.status = 'active'
        //     LEFT JOIN ${TABLES.FEEDBACK.CLIENT_TRAINER} as fb 
        //         ON fb.trainer_id = t.trainer_id
        //     LEFT JOIN ${TABLES.TRAINERS.services} as ms 
        //         ON ms.trainer_id = t.trainer_id AND ms.status = 'active'
        //     WHERE ${condition}
        //     GROUP BY t.trainer_id
        //     ${havingSQL ? `HAVING ${havingSQL}` : ""}
        //   ) AS subquery
        // `;

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

gymList.get("/:gym_id", async (ctx) => {
    let condition = `g.status = 'active' AND (g.verification_status = 'verified' OR g.verification_status = 'fully_verified') AND g.gym_id = ${sanitize(ctx?.req?.params?.gym_id)}`;

    let sql = find(`${TABLES.GYMS.gyms} as g`, {
        joins: `
    LEFT JOIN ${TABLES.FEEDBACK.GYM_TRAINER_CLIENT} as fb ON fb.gym_id = g.gym_id
    LEFT JOIN ${TABLES.GYMS.PLANS} as mp ON mp.gym_id = g.gym_id AND mp.visibility = 'public'
  `,
        columns: `
    g.*,
    ROUND(AVG(fb.rating), 2) AS rating,
    COUNT(DISTINCT fb.feedback_id) AS reviews,
    MIN(mp.price) AS membership_min_price,
    MAX(mp.price) AS membership_max_price,
    COUNT(DISTINCT mp.plan_id) AS total_plan
  `,
        where: condition,
        groupBy: 'g.gym_id'
    });

    let { success, result } = await dbQuery(sql);
    return ctx.json({ success: success, gym: result?.[0] })
});

gymList.get("/:gym_id/unavailability", async (ctx) => {
    const { gym_id } = ctx.req.params;
    let { month, year } = ctx.req.query;
    const m = month ? sanitize(month) : new Date().getMonth() + 1;
    const y = year ? sanitize(year) : new Date().getFullYear();
    const f = find(`${TABLES.GYMS.UNAVAILABILITY} as u`, {
        where: `
            u.gym_id = ${sanitize(gym_id)} 
            AND u.month = ${m} 
            AND u.year = ${y}
        `
    });
    console.log(f)
    return ctx.json(await dbQuery(f));
});

gymList.get("/:gym_id/trainers", async (ctx) => {
    return ctx.json(await dbQuery(find(`${TABLES.TRAINERS.trainers} as t`, {
        joins: `
        LEFT JOIN ${TABLES.MEMBERSHIP_JOIN.TRAINER_GYMS} as mtg ON mtg.trainer_id = t.trainer_id
        `,
        columns: `
        t.trainer_id,
        t.avatar,
        t.fullname,
        t.bio,
        t.verified,
        t.badge,
        t.specialization,
        t.gender
        `,
        where: `mtg.gym_id = ${sanitize(ctx.req.params.gym_id)} AND t.status = 'active'`
    })))
})

gymList.get("/:gym_id/membership", async (ctx) => {
    let condition = `visibility = "public"`;
    let sql = find(`${TABLES.GYMS.PLANS} as p`, {
        where: condition,
    });
    let { success, result } = await dbQuery(sql);
    return ctx.json({ success: success, trainer: result })
})
gymList.get("/:gym_id/sessions", AuthorizationMiddlewarePublic(), async (ctx) => {
    const { role, user_info } = ctx.auth ?? {};
    let { user_id } = user_info ?? {};
    const isClient = role === "client" && user_id;
    let condition = `s.gym_id = ${sanitize(ctx.req?.params?.gym_id)}`;

    let sql = find(`${TABLES.GYMS.SESSIONS} as s`, {
        joins: `
            LEFT JOIN ${TABLES.CLIENTS.SESSION_ASSIGNMENT_CLIENTS} AS sac
                ON sac.session_id = s.session_id AND sac.status = 'active'
            ${isClient ? `
            LEFT JOIN ${TABLES.CLIENTS.SESSION_ASSIGNMENT_CLIENTS} AS myassign
                ON myassign.session_id = s.session_id AND myassign.client_id = ${sanitize(user_id)}
            ` : ""}
        `,

        columns: `
            s.*,
            -- Total assigned users
            COUNT(sac.assignment_id) AS assigned_count,

            -- Is session full?
            CASE
                WHEN
                    SUM(
                        CASE
                            WHEN sac.status = 'active'
                                AND sac.valid_to >= CURRENT_DATE()
                            THEN 1
                            ELSE 0
                        END
                    ) >= s.capacity
                    THEN 1
                    ELSE 0
            END AS is_full,
            -- Has the logged-in client completed session?
            ${isClient ? `
            CASE 
                WHEN myassign.assignment_id IS NOT NULL 
                     AND myassign.status = 'completed' THEN 1
                ELSE 0
            END AS has_completed,
            ` : ""}

            -- Is client assigned?
            ${isClient ? `
            CASE 
                WHEN myassign.assignment_id IS NOT NULL THEN 1
                ELSE 0
            END AS is_assigned
            ` : ""}
        `,

        where: condition,
        groupBy: "s.session_id",
        sort: "s.start_time ASC"
    });
    let { success, result } = await dbQuery(sql);

    return ctx.json({ success, sessions: result });
});


gymList.get("/:gym_id/membership", async (ctx) => {
    let condition = `visibility = "public"`;
    let sql = find(`${TABLES.GYMS.PLANS} as p`, {
        where: condition,
    });
    let { success, result } = await dbQuery(sql);
    return ctx.json({ success: success, trainer: result })
})

gymList.get('/feedback/dashboard/:gym_id', async (ctx) => {
    try {
        const user_id = sanitize(ctx.req.params?.gym_id)
        let sql = find(TABLES.FEEDBACK.GYM_TRAINER_CLIENT, {
            sort: {
                feedback_id: -1
            },
            limitSkip: {
                limit: 3,
            },
            where: `gym_id = ${user_id}`
        });

        let matrix = find(TABLES.FEEDBACK.GYM_TRAINER_CLIENT, {
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
            where: `gym_id = ${user_id}`
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

gymList.get("/feedback/:gym_id",
    paginationHandler({
        getDataSource: async (ctx, { page, limit, offset }) => {
            const { rating, sort } = ctx?.req.query;
            const user_id = sanitize(ctx.req.params?.gym_id)
            let condition = `gym_id = ${user_id}`
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

            let sql = find(TABLES.FEEDBACK.GYM_TRAINER_CLIENT, {
                sort: sortObj,
                limitSkip: {
                    limit: limit,
                    skip: offset
                },
                where: condition,
            })
            let count = find(TABLES.FEEDBACK.GYM_TRAINER_CLIENT, {
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

export default gymList;