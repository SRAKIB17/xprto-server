import { destroy, find, insert, mysql_date, sanitize, update } from "@tezx/sqlx/mysql";
import { Router } from "tezx";
import { paginationHandler } from "tezx/middleware";
import { DirectoryServe, filename } from "../../../../../config";
import { dbQuery, TABLES } from "../../../../../models";
import { copyFile } from "../../../../../utils/fileExists";

const workoutPlans = new Router({
    basePath: '/workout-plans'
});

// added by thakele delet disable thakbe
//

workoutPlans.get("/",
    paginationHandler({
        getDataSource: async (ctx, { page, limit, offset }) => {
            const { role } = ctx.auth || {};
            const { rating, sort, status, date, client_id } = ctx?.req.query;
            const { user_id, username, hashed, salt, email } = ctx.auth?.user_info || {};
            let condition = role === 'client' ? `wr.client_id = "${user_id}"` : `wr.added_by = "${user_id}"`

            if (role === 'trainer' && client_id) {
                // if (!client_id) {
                //     return ctx.json({ success: false, message: "Client id is  required(client_id)." })
                // }
                condition += ` AND wr.client_id = ${sanitize(client_id)}`
            }
            if (date) {
                const sanitizedDate = sanitize(mysql_date(date as string));
                condition += ` AND (DATE(wr.start) <= ${sanitizedDate} AND DATE(wr.end) >= ${sanitizedDate})`;
            }
            let sortObj: any = {
                "wr.plan_id": -1
            };

            // if (sort === 'highest' || sort === 'lowest') {
            //     sortObj = {
            //         rating: sort === 'highest' ? -1 : 1
            //     }
            // }

            let sql = find(`${TABLES.PLANS.WORKOUT_PLANS.PLANS} as wr`, {
                sort: sortObj,
                joins: `
                ${role === 'trainer' ?
                        `LEFT JOIN ${TABLES.CLIENTS.clients} as c ON c.client_id = wr.client_id`
                        : `LEFT JOIN ${TABLES.TRAINERS.trainers} as t ON t.trainer_id = wr.added_by`
                    }
                `,
                columns: role === 'trainer' ?
                    `wr.*, c.fullname, c.avatar,c.bio,c.gender,c.health_goal` :
                    `wr.*, t.fullname, t.avatar,t.bio,t.gender,t.badge,t.verified,t.specialization`,
                limitSkip: {
                    limit: limit,
                    skip: offset
                },
                where: condition,
            });
            let count = find(`${TABLES.PLANS.WORKOUT_PLANS.PLANS} as wr`, {
                columns: 'count(*) as count',
                where: condition,
            });
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

workoutPlans.get("/:plan_id", async (ctx) => {
    const { role } = ctx.auth || {};
    const { user_id, username, hashed, salt, email } = ctx.auth?.user_info || {};
    let condition = role === 'client' ? `wr.client_id = "${user_id}"` : `wr.added_by = "${user_id}"`
    condition += `AND wr.plan_id = ${sanitize(ctx.req.params?.plan_id)}`;
    let sql = find(`${TABLES.PLANS.WORKOUT_PLANS.PLANS} as wr`, {
        joins: `
                ${role === 'trainer' ?
                `LEFT JOIN ${TABLES.CLIENTS.clients} as c ON c.client_id = wr.client_id`
                : `LEFT JOIN ${TABLES.TRAINERS.trainers} as t ON t.trainer_id = wr.added_by`
            }
                `,
        columns: role === 'trainer' ?
            `wr.*, c.fullname, c.avatar,c.bio,c.gender,c.health_goal` :
            `wr.*, t.fullname, t.avatar,t.bio,t.gender,t.badge,t.verified,t.specialization`,
        where: condition,
    });

    const exerciseSql = find(`${TABLES.PLANS.WORKOUT_PLANS.EXERCISE} as ex`, {
        joins: `
        LEFT JOIN ${TABLES.PLANS.WORKOUT_PLANS.PLANS} as wr ON wr.plan_id = ex.plan_id
        `,
        where: condition
    })
    const { success, result, error } = await dbQuery<any[]>(`${sql}${exerciseSql}`);

    return ctx.json({
        success: success,
        result: {
            plan: result?.[0]?.[0],
            exercise: result?.[1]
        }
    })
}
);

workoutPlans.post("/", async (ctx) => {
    try {
        const { user_info, role } = ctx.auth || {};
        const trainer_id = user_info?.user_id;
        const body = await ctx.req.json();
        let {
            client_id,
            session_id,
            title,
            start,
            end,
            attachment,
            tags,
            client_note,
            trainer_note,
        } = body;

        // ✅ Validation
        if (role === "trainer" && !(client_id || session_id)) {
            return ctx.status(400).json({ success: false, message: "Please provide client_id or session_id." });
        }

        // ✅ Default fields
        const added_by = role === "trainer" ? trainer_id : body?.added_by || null;

        let attach: any[] = [];
        if (Array.isArray(attachment)) {
            for (const img of attachment) {
                if (await copyFile(img, DirectoryServe.PLANS.workout_plan.Plans(img), true)) {
                    attach.push(filename(img));
                }
            }
        }
        // ✅ Prepare payload
        const payload = {
            client_id: role === "trainer" ? client_id : trainer_id,
            session_id: session_id || null,
            added_by,
            title: title || null,
            start: start || null,
            end: end || null,
            attachment: attach?.length ? JSON.stringify(attach || []) : undefined,
            tags: JSON.stringify(tags || []),
            client_note: client_note || null,
            trainer_note: trainer_note || null,
        };

        // ✅ Insert into DB
        const { success, result, error } = await dbQuery<{ insertId: string }>(
            insert(TABLES.PLANS.WORKOUT_PLANS.PLANS, payload as any)
        );

        if (!success) {
            console.error("DB Insert Error:", error);
            return ctx.status(500).json({ success: false, message: "Database error occurred." });
        }
        return ctx.json({
            success: true,
            message: "Workout plan created successfully.",
            data: { plan_id: result?.insertId, ...payload },
        });
    } catch (err) {
        return ctx.status(500).json({ success: false, message: "Internal server error." });
    }
});
workoutPlans.put("/:plan_id", async (ctx) => {
    try {
        const { user_info, role } = ctx.auth || {};
        const trainer_id = user_info?.user_id;
        const plan_id = ctx.req.params?.plan_id;
        const body = await ctx.req.json();

        let {
            client_id,
            session_id,
            title,
            start,
            end,
            attachment,
            tags,
            client_note,
            trainer_note,
        } = body;

        // ✅ Validation
        if (!plan_id) {
            return ctx.status(400).json({ success: false, message: "Missing plan_id parameter." });
        }

        if (role === "trainer" && !(client_id || session_id)) {
            return ctx.status(400).json({ success: false, message: "Please provide client_id or session_id." });
        }

        // ✅ Default fields
        const added_by = role === "trainer" ? trainer_id : body?.added_by || null;

        // ✅ Handle file attachments
        let attach: string[] = [];
        if (Array.isArray(attachment)) {
            for (const img of attachment) {
                const copied = await copyFile(img, DirectoryServe.PLANS.workout_plan.Plans(img), true);
                if (copied) attach.push(filename(img));
            }
        }

        // ✅ Prepare payload for DB update
        const payload = {
            client_id: role === "trainer" ? client_id : trainer_id,
            session_id: session_id || null,
            added_by,
            title: title || null,
            start: start || null,
            end: end || null,
            attachment: attach.length ? JSON.stringify(attach) : undefined,
            tags: JSON.stringify(tags || []),
            client_note: client_note || null,
            trainer_note: trainer_note || null,
        };

        // ✅ Update query
        const { success, result, error } = await dbQuery(
            update(TABLES.PLANS.WORKOUT_PLANS.PLANS, {
                values: payload,
                where: `plan_id = ${sanitize(plan_id)}`,
            })
        );

        if (!success) {
            console.error("DB Update Error:", error);
            return ctx.status(500).json({ success: false, message: "Database update failed." });
        }

        // ✅ Success response
        return ctx.json({
            success: true,
            message: "Workout plan updated successfully.",
            data: { plan_id, ...payload },
        });

    } catch (err) {
        console.error("Workout Plan Update Error:", err);
        return ctx.status(500).json({ success: false, message: "Internal server error." });
    }
});


workoutPlans.delete("/delete/plans/:plan_id", async (ctx) => {
    const plan_id = Number(ctx.req.params?.plan_id);
    const { user_info, role } = ctx.auth || {};
    const user_id = user_info?.user_id;
    if (!plan_id) {
        return ctx.json({ success: false, message: "Feedback ID is required" });
    }
    try {
        // only allow deleting own feedback
        const condition = `plan_id = "${plan_id}" AND ${role === 'trainer' ? `added_by = ${user_id}` : `client_id = ${user_id}`}`;

        const sql = destroy(TABLES.PLANS.WORKOUT_PLANS.PLANS, {
            where: condition,
        });
        const { success, result, error } = await dbQuery(sql);
        if (!success) {
            return ctx.json({
                success: false,
                message: error || "Failed to delete plan"
            });
        }
        return ctx.json({
            success: true,
            message: "Plan deleted successfully",
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
// ! *********************************************************** EXERCISE START ****************************************************************

workoutPlans.post("/:plan_id/exercises", async (ctx) => {
    try {
        const { user_info, role } = ctx.auth || {};
        const trainer_id = user_info?.user_id;
        const plan_id = ctx.req.params?.plan_id;

        if (!plan_id) {
            return ctx.status(400).json({ success: false, message: "Missing plan_id." });
        }

        const body = await ctx.req.json();
        const { name, sets, attachment } = body;

        if (!name) {
            return ctx.status(400).json({ success: false, message: "Exercise Name is required." });
        }

        /**
         * 
{
    "name": "Squat",
    "sets": [
        {
            "set": 1,
            "reps": 12,
            "rest_time": "00:45",
            "duration": "01:20",
            "weight": 5,
            "weight_unit": "kg",
            "misc": "Keep back straight"
        },
        {
            "set": 2,
            "reps": 10,
            "rest_time": "01:00",
            "duration": "01:15",
            "weight": 6,
            "weight_unit": "kg",
            "misc": "Increase weight slightly"
        },
        {
            "set": 3,
            "reps": 8,
            "rest_time": "01:30",
            "duration": "01:10",
            "weight": 7,
            "weight_unit": "kg",
            "misc": "Last set, controlled tempo"
        }
    ],
    "attachment": [
        "uploads/exercises/squat1.jpg",
        "uploads/exercises/squat2.jpg"
    ]
}
         */
        // Handle file attachments
        let attach: string[] = [];
        if (Array.isArray(attachment)) {
            for (const file of attachment) {
                const copied = await copyFile(file, DirectoryServe.PLANS.workout_plan.EXERCISE(file), true);
                if (copied) attach.push(filename(file));
            }
        }

        // Prepare payload
        const payload = {
            plan_id,
            name,
            sets: JSON.stringify(sets || []),
            attachment: attach.length ? JSON.stringify(attach) : undefined,
        };

        // Insert into DB
        const { success, result, error } = await dbQuery<{ insertId: number }>(
            insert(TABLES.PLANS.WORKOUT_PLANS.EXERCISE, payload)
        );

        if (!success) {
            console.error("DB Insert Error:", error);
            return ctx.status(500).json({ success: false, message: "Database error occurred." });
        }

        return ctx.json({
            success: true,
            message: "Exercise added successfully.",
            data: { exercise_id: result?.insertId, ...payload },
        });

    }
    catch (err) {
        console.error("Error in POST /exercises:", err);
        return ctx.status(500).json({ success: false, message: "Internal server error." });
    }
});

workoutPlans.put("/:plan_id/exercises/:exercise_id", async (ctx) => {
    try {
        const { user_info, role } = ctx.auth || {};
        const plan_id = ctx.req.params?.plan_id;
        const exercise_id = ctx.req.params?.exercise_id;

        if (!plan_id || !exercise_id) {
            return ctx.status(400).json({ success: false, message: "Missing plan_id or exercise_id." });
        }

        const body = await ctx.req.json();
        const { title, sets, attachment } = body;

        // Handle file attachments
        let attach: string[] = [];
        if (Array.isArray(attachment)) {
            for (const file of attachment) {
                const copied = await copyFile(file, DirectoryServe.PLANS.workout_plan.EXERCISE(file), true);
                if (copied) attach.push(filename(file));
            }
        }
        // Prepare payload
        const payload: any = {};
        if (title) payload.title = title;
        if (sets) payload.sets = JSON.stringify(sets);
        if (attach.length) payload.attachment = JSON.stringify(attach);
        payload.updated_at = mysql_date();
        // Update in DB
        const { success, result, error } = await dbQuery(
            update(TABLES.PLANS.WORKOUT_PLANS.EXERCISE, {
                values: payload,
                where: `exercise_id = ${sanitize(exercise_id)} AND plan_id = ${sanitize(plan_id)}`
            })
        );
        if (!success) {
            console.error("DB Update Error:", error);
            return ctx.status(500).json({ success: false, message: "Database update failed." });
        }
        return ctx.json({
            success: true,
            message: "Exercise updated successfully.",
            data: { exercise_id, ...payload },
        });
    }
    catch (err) {
        console.error("Error in PUT /exercises:", err);
        return ctx.status(500).json({ success: false, message: "Internal server error." });
    }
});

workoutPlans.delete("/:plan_id/exercises/:exercise_id", async (ctx) => {
    try {
        const { plan_id, exercise_id } = ctx.req.params;

        if (!plan_id || !exercise_id) {
            return ctx.status(400).json({ success: false, message: "Missing plan_id or exercise_id." });
        }

        // Delete from DB
        let sql = destroy(TABLES.PLANS.WORKOUT_PLANS.EXERCISE, {
            where: `exercise_id = ${sanitize(exercise_id)} AND plan_id = ${sanitize(plan_id)}`
        })
        const { success, result, error } = await dbQuery<any>(sql);

        if (!success) {
            return ctx.status(500).json({ success: false, message: "Failed to delete exercise." });
        }

        // Check if row was actually deleted
        if (result.affectedRows === 0) {
            return ctx.status(404).json({ success: false, message: "Exercise not found or already deleted." });
        }

        return ctx.json({
            success: true,
            message: "Exercise deleted successfully.",
            data: { exercise_id, plan_id }
        });

    } catch (err) {
        console.error("DELETE /exercises Error:", err);
        return ctx.status(500).json({ success: false, message: "Internal server error." });
    }
});


export default workoutPlans;