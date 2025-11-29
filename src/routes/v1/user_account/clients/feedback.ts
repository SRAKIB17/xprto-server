import { destroy, find, insert, mysql_datetime, update } from "@tezx/sqlx/mysql";
import { Router } from "tezx";
import { paginationHandler } from "tezx/middleware";
import { dbQuery } from "../../../../models/index.js";
import { TABLES } from "../../../../models/table.js";
import { copyFile } from "../../../../utils/fileExists.js";
import { DirectoryServe, filename } from "../../../../config.js";
import { sendNotification } from "../../../../utils/sendNotification.js";


// import user_account_document_flag from "./flag-document.js";
const clientFeedback = new Router({
    basePath: '/my-ratings'
});

// !gym
clientFeedback.get("/gyms",
    paginationHandler({
        getDataSource: async (ctx, { page, limit, offset }) => {
            const { role } = ctx.auth || {};
            const { rating, sort } = ctx?.req.query
            const { user_id, username, hashed, salt, email } = ctx.auth?.user_info || {};
            let condition = `gt.client_id = "${user_id}"`
            if (rating) {
                condition += ` AND .gt.rating BETWEEN ${rating} AND 5`
            }
            let sortObj: any = {
                "gt.feedback_id": -1
            };

            if (sort === 'highest' || sort === 'lowest') {
                sortObj = {
                    "gt.rating": sort === 'highest' ? -1 : 1
                }
            }

            let sql = find(`${TABLES.FEEDBACK.GYM_TRAINER_CLIENT} as gt`, {
                sort: sortObj,
                joins: `LEFT JOIN ${TABLES.GYMS.gyms} as g ON g.gym_id = gt.gym_id`,
                columns: `gt.*, g.gym_name as gym_name, g.logo_url as logo_url, g.avatar as avatar`,
                limitSkip: {
                    limit: limit,
                    skip: offset
                },
                where: condition,
            })
            let count = find(`${TABLES.FEEDBACK.GYM_TRAINER_CLIENT} as gt`, {
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

clientFeedback.delete("/gyms/:feedback_id/delete", async (ctx) => {
    const feedback_id = Number(ctx.req.params?.feedback_id);
    const { user_info } = ctx.auth || {};
    const user_id = user_info?.user_id;

    if (!feedback_id) {
        return ctx.json({ success: false, message: "Feedback ID is required" });
    }

    try {
        // only allow deleting own feedback
        const condition = `feedback_id = "${feedback_id}" AND client_id = "${user_id}"`;

        const sql = destroy(TABLES.FEEDBACK.GYM_TRAINER_CLIENT, {
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

//! trainer
clientFeedback.get("/trainers",
    paginationHandler({
        getDataSource: async (ctx, { page, limit, offset }) => {
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
                columns: `client_trainer_feedback.*, trainers.fullname as trainer_fullname, trainers.avatar as avatar`,
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

clientFeedback.delete("/trainers/:feedback_id/delete", async (ctx) => {
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

clientFeedback.post("/trainers/post/:trainer_id", async (ctx) => {
    const trainer_id = Number(ctx.req.params?.trainer_id);
    const { user_info } = ctx.auth || {};
    const user_id = user_info?.user_id;

    if (!trainer_id) {
        return ctx.json({ success: false, message: "Trainer ID is required" });
    }

    try {
        const body = await ctx.req.json();
        const { quality, punctuality, hygiene, workout_feel, misbehave_reported, rating, comments, video_url, misbehave_details } = body;
        if (!rating || rating < 1 || rating > 5) {
            return ctx.status(404).json({ success: false, message: "Rating must be between 1 and 5" });
        }

        let f_video_url = '';
        if (video_url) {
            if (await copyFile(video_url, DirectoryServe.feedback.trainer(video_url), true)) {
                f_video_url = filename(video_url);
            }
        }
        const sql = insert(TABLES.FEEDBACK.CLIENT_TRAINER, {
            trainer_id,
            misbehave_details,
            client_id: user_id,
            quality, punctuality, hygiene, workout_feel, misbehave_reported, rating, comments, video_url: f_video_url || undefined
        });
        const { success, result, error } = await dbQuery<any>(sql);

        if (!success) {
            console.error("DB error:", error);
            return ctx.json({ success: false, message: "Database error", error });
        }

        await sendNotification(
            {
                recipientId: trainer_id,
                recipientType: 'trainer',

                senderType: 'client',
                senderId: user_id,

                title: `New Feedback Received`,
                message: `A user has submitted feedback with a rating of ${rating}/5.`, // Message content
                type: 'alert',
                priority: 'high',
                metadata: {
                    event: 'trainer_feedback',
                },
            },
            'all'
        );
        return ctx.json({
            success: true,
            message: "Feedback submitted successfully",
            feedback_id: result?.insertId
        });
    }
    catch (err) {
        return ctx.json({
            success: false,
            message: "Internal server error"
        });
    }
});


export default clientFeedback;