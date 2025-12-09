import { destroy, find, sanitize, update } from "@tezx/sqlx/mysql";
import { Router } from "tezx";
import { paginationHandler } from "tezx/middleware";
import { dbQuery, TABLES } from "../../../../../models/index.js";
const gymTrainers = new Router();

gymTrainers.get("/:trainer_id/feedback", paginationHandler({
    getDataSource: async (ctx, { page, limit, offset }) => {
        const { rating, sort } = ctx?.req.query
        const { user_id, } = ctx.auth?.user_info || {};
        let condition = `tf.trainer_id = ${sanitize(ctx.req.params.trainer_id)} AND tg.gym_id = ${sanitize(user_id)}`
        if (rating) {
            condition += ` AND tf.rating BETWEEN ${rating} AND 5`
        }
        let sortObj: any = {
            feedback_id: -1
        };

        if (sort === 'highest' || sort === 'lowest') {
            sortObj = {
                "tf.rating": sort === 'highest' ? -1 : 1
            }
        }

        let sql = find(`${TABLES.FEEDBACK.CLIENT_TRAINER} as tf`, {
            sort: sortObj,
            joins: `LEFT JOIN ${TABLES.MEMBERSHIP_JOIN.TRAINER_GYMS} as tg ON tf.trainer_id = tg.trainer_id`,
            limitSkip: {
                limit: limit,
                skip: offset
            },
            where: condition,
        })
        let count = find(`${TABLES.FEEDBACK.CLIENT_TRAINER} as tf`, {
            columns: 'count(*) as count',
            joins: `LEFT JOIN ${TABLES.MEMBERSHIP_JOIN.TRAINER_GYMS} as tg ON tf.trainer_id = tg.trainer_id`,
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
        } as any
    },
})
);

gymTrainers.get("/:trainer_id/document", async (ctx) => {
    const { user_id } = ctx.auth?.user_info || {};
    const trainer_id = ctx.req.params.trainer_id;

    const { success, result } = await dbQuery(
        find(`${TABLES.USER_DOCUMENTS} as doc`, {
            joins: `LEFT JOIN ${TABLES.MEMBERSHIP_JOIN.TRAINER_GYMS} as tg ON tg.trainer_id = doc.user_id AND doc.user_type = "trainer"`,
            where: `doc.user_id = ${sanitize(trainer_id)} AND doc.user_type = "trainer" AND tg.gym_id = ${sanitize(user_id)}`,
        })
    );
    return ctx.json({ success, data: result });
});

gymTrainers.delete("/:trainer_id/remove-from-gym", async (ctx) => {
    const { user_id } = ctx.auth?.user_info || {};
    const trainer_id = ctx.req.params.trainer_id;

    if (!user_id) return ctx.json({ success: false, message: "Unauthorized" });

    // Remove trainer from gym
    const { success, result } = await dbQuery<any>(
        destroy(`${TABLES.MEMBERSHIP_JOIN.TRAINER_GYMS} as m`, {
            where: `m.trainer_id = ${sanitize(trainer_id)} AND m.gym_id = ${sanitize(user_id)}`,
        })
    );

    if (success && result?.affectedRows) {
        // Optionally update trainer (example: set gym_assigned = 0)
        const { success: updSuccess } = await dbQuery(
            update(TABLES.TRAINERS.trainers, {
                values: { xprto: 0 },
                where: `trainer_id = ${sanitize(trainer_id)}`
            })
        );

        return ctx.json({ success: updSuccess, data: result });
    }

    return ctx.json({ success: false, message: "No trainer removed", data: result });
});

export default gymTrainers;