import { find, sanitize, SortType } from "@tezx/sqlx/mysql";
import { Router } from "tezx";
import { paginationHandler } from "tezx/middleware";
import { dbQuery, TABLES } from "../../../models/index.js";
import { AuthorizationBasicAuthUser, AuthorizationMiddlewarePublic } from "../auth/basicAuth.js";

let gymList = new Router();
gymList.get("/", paginationHandler({
    getDataSource: async (ctx, { page, limit, offset }) => {
        const { role } = ctx.auth || {};
        const { search, verify, mode, status } = ctx?.req.query;
        const { user_id, username, hashed, salt, } = ctx.auth?.user_info || {};
        let condition = "g.status = 'active' AND (g.verification_status = 'verified' OR g.verification_status = 'fully_verified')";
        if (role === 'admin') {
            condition = ""
        }
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

        let sql = find(`${TABLES.GYMS.gyms} as g`, {
            sort: sort,
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
            limitSkip: {
                limit: limit,
                skip: offset
            },
            where: condition,
            groupBy: 'g.gym_id'
        });
        let count = find(`${TABLES.GYMS.gyms} as g`, {
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