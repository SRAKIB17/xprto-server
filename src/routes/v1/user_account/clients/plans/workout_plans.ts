import { destroy, find, sanitize } from "@tezx/sqlx/mysql";
import { Router } from "tezx";
import { paginationHandler } from "tezx/middleware";


// import user_account_document_flag from "./flag-document.js";
const nutritionPlans = new Router({
    basePath: '/workout-plans '
});


nutritionPlans.get("/",
    paginationHandler({
        getDataSource: async (ctx, { page, limit, offset }) => {
            const { role } = ctx.auth || {};
            const { rating, sort, status, date } = ctx?.req.query;

            const { user_id, username, hashed, salt, email } = ctx.auth?.user_info || {};

            let condition = role === 'client' ?
                `br.client_id = "${user_id}"` : `br.trainer_id = "${user_id}"`

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
                joins: `
                LEFT JOIN ${TABLES.TRAINERS.services} as sv ON sv.service_id = br.service_id
                ${role === 'trainer' ?
                        `LEFT JOIN ${TABLES.CLIENTS.clients} as c ON c.client_id = br.client_id`
                        : `LEFT JOIN ${TABLES.TRAINERS.trainers} as t ON t.trainer_id = br.trainer_id`
                    }
                `,
                columns: role === 'trainer' ?
                    `br.*,sv.package_name, sv.title, sv.images, c.fullname,c.avatar,c.bio,c.gender,c.health_goal` :
                    `br.*,sv.package_name, sv.title, sv.images, t.fullname,t.avatar,t.bio,t.gender,t.badge,t.verified,t.specialization`,
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

nutritionPlans.get("/:date", async (ctx) => {
    const { role } = ctx.auth || {};
    const { rating, sort } = ctx?.req.query
    const { user_id, username, hashed, salt, email } = ctx.auth?.user_info || {};
    let condition = `client_trainer_feedback.client_id = "${user_id}"`
    if (rating) {
        condition += ` AND .client_trainer_feedback.rating BETWEEN ${rating} AND 5`
    }
    let sortObj: any = {
        "client_trainer_feedback.feedback_id": -1
    };

    if (sort === 'highest' || sort === 'lowest') {
        sortObj = {
            "client_trainer_feedback.rating": sort === 'highest' ? -1 : 1
        }
    }

    let sql = find(TABLES.FEEDBACK.CLIENT_TRAINER, {
        sort: sortObj,
        joins: [
            {
                on: 'client_trainer_feedback.trainer_id = trainers.trainer_id',
                table: TABLES.TRAINERS.trainers
            }
        ],
        columns: `client_trainer_feedback.*, trainers.fullname as trainer_fullname, trainers.avatar as trainer_avatar`,
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
});

nutritionPlans.delete("/trainers/:feedback_id/delete", async (ctx) => {
    const feedback_id = Number(ctx.req.params?.feedback_id);
    const { user_info } = ctx.auth || {};
    const user_id = user_info?.user_id;

    if (!feedback_id) {
        return ctx.json({ success: false, message: "Feedback ID is required" });
    }

    try {
        // only allow deleting own feedback
        const condition = `feedback_id = "${feedback_id}" AND client_id = "${user_id}"`;

        const sql = destroy(TABLES.FEEDBACK.CLIENT_TRAINER, {
            where: condition,
        });
        const { success, result, error } = await dbQuery(sql);
        if (!success) {
            return ctx.json({
                success: false,
                message: error || "Failed to delete feedback"
            });
        }
        return ctx.json({
            success: true,
            message: "Feedback deleted successfully",
            data: result
        });
    }
    catch (err) {
        return ctx.json({
            success: false,
            message: "Internal server error"
        });
    }
});

// nutritionPlans.put("/:id/reply", async (ctx) => {
//     try {
//         const id = Number(ctx.req.params.id);
//         if (!id) {
//             return ctx.status(400).json({ success: false, message: "Invalid feedback id" });
//         }

//         const body = await ctx.req.json<{ reply: string }>();
//         if (!body?.reply) {
//             return ctx.status(400).json({ success: false, message: "Reply text is required" });
//         }

//         // ✅ Update query
//         const { success, result } = await dbQuery(
//             update(TABLES.FEEDBACK.CLIENT_TRAINER, {
//                 values: { reply: body.reply, updated_at: mysql_datetime() },
//                 where: `feedback_id = ${id}`,
//             })
//         );

//         if (!success) {
//             return ctx.status(500).json({ success: false, message: "Failed to update feedback" });
//         }
//         return ctx.json({ success: true, message: "Reply saved successfully", result });
//     } catch (err) {
//         return ctx.status(500).json({ success: false, message: "Something went wrong" });
//     }
// });


export default nutritionPlans;