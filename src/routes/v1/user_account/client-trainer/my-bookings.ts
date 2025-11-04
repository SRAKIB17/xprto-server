import { find, mysql_date, mysql_datetime, sanitize, update } from "@tezx/sqlx/mysql";
import { Router } from "tezx";
import { paginationHandler } from "tezx/middleware";
import { dbQuery, TABLES } from "../../../../models";



// import user_account_document_flag from "./flag-document.js";
const trainerBookingRequest = new Router({
    basePath: '/my-bookings'
});
trainerBookingRequest.get('/dashboard', async (ctx) => {
    try {
        const { user_id } = ctx.auth?.user_info || {};

        if (!user_id) {
            return ctx.status(401).json({ success: false, message: "Unauthorized" });
        }
        let sql = find(TABLES.FEEDBACK.CLIENT_TRAINER, {
            sort: {
                feedback_id: -1
            },
            limitSkip: {
                limit: 2,
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

trainerBookingRequest.get("/",
    paginationHandler({
        getDataSource: async (ctx, { page, limit, offset }) => {
            const { role } = ctx.auth || {};
            const { rating, sort, status, date } = ctx?.req.query;

            const { user_id, username, hashed, salt, email } = ctx.auth?.user_info || {};
            let condition = role === 'client' ? `br.client_id = "${user_id}"` : `br.trainer_id = "${user_id}"`
            if (rating) {
                condition += ` AND rating BETWEEN ${rating} AND 5`
            }
            if (status) {
                condition += ` AND br.status = ${sanitize(status)}`
            }
            if (date) {
                const sanitizedDate = sanitize(mysql_date(date as string));
                condition += ` AND (DATE(br.requested_start) <= ${sanitizedDate} AND DATE(br.requested_end) >= ${sanitizedDate})`;
            }
            let sortObj: any = {
                "br.booking_id": -1
            };

            if (sort === 'highest' || sort === 'lowest') {
                sortObj = {
                    rating: sort === 'highest' ? -1 : 1
                }
            }

            let sql = find(`${TABLES.TRAINERS.BOOKING_REQUESTS} as br`, {
                sort: sortObj,
                joins: role === 'trainer' ?
                    `LEFT JOIN ${TABLES.CLIENTS.clients} as c ON c.client_id = br.client_id`
                    : `LEFT JOIN ${TABLES.TRAINERS.trainers} as t ON t.trainer_id = br.trainer_id`,
                columns: role === 'trainer' ?
                    `br.*, c.fullname,c.avatar,c.bio,c.gender,c.health_goal` :
                    `br.*, t.fullname,t.avatar,t.bio,t.gender,t.badge,t.verified,t.specialization`,
                limitSkip: {
                    limit: limit,
                    skip: offset
                },
                where: condition,
            });
            let count = find(`${TABLES.TRAINERS.BOOKING_REQUESTS} as br`, {
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
trainerBookingRequest.put("/:id/reply", async (ctx) => {
    try {
        const id = Number(ctx.req.params.id);
        if (!id) {
            return ctx.status(400).json({ success: false, message: "Invalid feedback id" });
        }

        const body = await ctx.req.json<{ reply: string }>();
        if (!body?.reply) {
            return ctx.status(400).json({ success: false, message: "Reply text is required" });
        }

        // ✅ Update query
        const { success, result } = await dbQuery(
            update(TABLES.FEEDBACK.CLIENT_TRAINER, {
                values: { reply: body.reply, updated_at: mysql_datetime() },
                where: `feedback_id = ${id}`,
            })
        );

        if (!success) {
            return ctx.status(500).json({ success: false, message: "Failed to update feedback" });
        }
        return ctx.json({ success: true, message: "Reply saved successfully", result });
    } catch (err) {
        return ctx.status(500).json({ success: false, message: "Something went wrong" });
    }
});


export default trainerBookingRequest;