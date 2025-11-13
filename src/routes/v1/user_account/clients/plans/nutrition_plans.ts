import { destroy, find, insert, mysql_date, sanitize, update } from "@tezx/sqlx/mysql";
import { Router } from "tezx";
import { paginationHandler } from "tezx/middleware";
import { DirectoryServe, filename } from "../../../../../config";
import { dbQuery, TABLES } from "../../../../../models";
import { copyFile } from "../../../../../utils/fileExists";

const nutritionPlans = new Router({
    basePath: '/nutrition-plans'
});

// added by thakele delet disable thakbe
//
//! done
nutritionPlans.get("/",
    paginationHandler({
        getDataSource: async (ctx, { page, limit, offset }) => {
            const { role } = ctx.auth || {};
            const { rating, sort, status, date, client_id } = ctx?.req.query;
            const { user_id, username, hashed, salt, email } = ctx.auth?.user_info || {};
            let condition = role === 'client' ? `np.client_id = "${user_id}"` : `np.added_by = "${user_id}"`

            if (role === 'trainer' && client_id) {
                // if (!client_id) {
                //     return ctx.json({ success: false, message: "Client id is  required(client_id)." })
                // }
                condition += ` AND np.client_id = ${sanitize(client_id)}`
            }
            if (date) {
                const sanitizedDate = sanitize(mysql_date(date as string));
                condition += ` AND (DATE(np.start) <= ${sanitizedDate} AND DATE(np.end) >= ${sanitizedDate})`;
            }
            let sortObj: any = {
                "np.plan_id": -1
            };

            // if (sort === 'highest' || sort === 'lowest') {
            //     sortObj = {
            //         rating: sort === 'highest' ? -1 : 1
            //     }
            // }

            let sql = find(`${TABLES.PLANS.NUTRITION.PLANS} as np`, {
                sort: sortObj,
                joins: `
                LEFT JOIN ${TABLES.GYMS.SESSIONS} as s ON s.session_id = np.session_id
                ${role === 'trainer' ?
                        `LEFT JOIN ${TABLES.CLIENTS.clients} as c ON c.client_id = np.client_id`
                        : `LEFT JOIN ${TABLES.TRAINERS.trainers} as t ON t.trainer_id = np.added_by`
                    }
                `,
                columns: role === 'trainer' ?
                    `np.*, s.service_name, c.fullname, c.avatar,c.bio,c.gender,c.health_goal` :
                    `np.*, s.service_name, t.fullname, t.avatar,t.bio,t.gender,t.badge,t.verified,t.specialization`,
                limitSkip: {
                    limit: limit,
                    skip: offset
                },
                where: condition,
            });
            let count = find(`${TABLES.PLANS.NUTRITION.PLANS} as np`, {
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

// !done
nutritionPlans.get("/:plan_id", async (ctx) => {
    const { role } = ctx.auth || {};
    const { user_id, username, hashed, salt, email } = ctx.auth?.user_info || {};
    let condition = role === 'client' ? `np.client_id = "${user_id}"` : `np.added_by = "${user_id}"`
    condition += `AND np.plan_id = ${sanitize(ctx.req.params?.plan_id)}`;
    let sql = find(`${TABLES.PLANS.NUTRITION.PLANS} as np`, {
        joins: `
                LEFT JOIN ${TABLES.GYMS.SESSIONS} as s ON s.session_id = np.session_id
                ${role === 'trainer' ?
                `LEFT JOIN ${TABLES.CLIENTS.clients} as c ON c.client_id = np.client_id`
                : `LEFT JOIN ${TABLES.TRAINERS.trainers} as t ON t.trainer_id = np.added_by`
            }
                `,
        columns: role === 'trainer' ?
            `np.*, s.service_name, c.fullname, c.avatar,c.bio,c.gender,c.health_goal` :
            `np.*, s.service_name, t.fullname, t.avatar,t.bio,t.gender,t.badge,t.verified,t.specialization`,
        where: condition,
    });

    const mealsSql = find(`${TABLES.PLANS.NUTRITION.MEAL} as ml`, {
        joins: `
        LEFT JOIN ${TABLES.PLANS.NUTRITION.PLANS} as np ON np.plan_id = ml.plan_id
        `,
        where: condition
    })
    const { success, result, error } = await dbQuery<any[]>(`${sql}${mealsSql}`);

    return ctx.json({
        success: success,
        result: {
            plan: result?.[0]?.[0],
            meals: result?.[1]
        }
    })
}
);
// !done
nutritionPlans.post("/", async (ctx) => {
    try {
        const { user_info, role } = ctx.auth || {};
        const trainer_id = user_info?.user_id;
        const body = await ctx.req.json();
        let {
            client_id,
            session_id,
            title,
            description,
            start,
            end,
            calories,
            protein_g,
            carbs_g,
            fats_g,
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
                if (await copyFile(img, DirectoryServe.PLANS.nutrition_plan.Plans(img), true)) {
                    attach.push(filename(img));
                }
            }
        }
        // ✅ Prepare payload
        const payload = {
            client_id: role === "trainer" ? client_id : trainer_id,
            session_id: session_id || null,
            added_by,
            description,
            calories,
            protein_g,
            carbs_g,
            fats_g,
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
            insert(TABLES.PLANS.NUTRITION.PLANS, payload as any)
        );

        if (!success) {
            return ctx.status(500).json({ success: false, message: "Database error occurred." });
        }
        return ctx.json({
            success: true,
            message: "Nutrition plan created successfully.",
            data: { plan_id: result?.insertId, ...payload },
        });
    } catch (err) {
        return ctx.status(500).json({ success: false, message: "Internal server error." });
    }
});

// !done
nutritionPlans.put("/:plan_id", async (ctx) => {
    try {
        const { user_info, role } = ctx.auth || {};
        const trainer_id = user_info?.user_id;
        const plan_id = ctx.req.params?.plan_id;
        const body = await ctx.req.json();

        let {
            client_id,
            session_id,
            title,
            description,
            calories,
            protein_g,
            carbs_g,
            fats_g,
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
                const copied = await copyFile(img, DirectoryServe.PLANS.nutrition_plan.Plans(img), true);
                if (copied) attach.push(filename(img));
            }
        }

        // ✅ Prepare payload for DB update
        const payload = {
            client_id: role === "trainer" ? client_id : trainer_id,
            session_id: session_id || null,
            added_by,
            description,
            calories,
            protein_g,
            carbs_g,
            fats_g,
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
            update(TABLES.PLANS.NUTRITION.PLANS, {
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
            message: "Nutrition plan updated successfully.",
            data: { plan_id, ...payload },
        });

    } catch (err) {
        console.error("Nutrition Plan Update Error:", err);
        return ctx.status(500).json({ success: false, message: "Internal server error." });
    }
});

// !done
nutritionPlans.delete("/delete/plans/:plan_id", async (ctx) => {
    const plan_id = Number(ctx.req.params?.plan_id);
    const { user_info, role } = ctx.auth || {};
    const user_id = user_info?.user_id;
    if (!plan_id) {
        return ctx.json({ success: false, message: "Plan Id is required" });
    }
    try {
        // only allow deleting own 
        const condition = `plan_id = "${plan_id}" AND ${role === 'trainer' ? `added_by = ${user_id}` : `client_id = ${user_id}`}`;

        const sql = destroy(TABLES.PLANS.NUTRITION.PLANS, {
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

// ! *********************************************************** Meal START ****************************************************************
nutritionPlans.post("/:plan_id/meal", async (ctx) => {
    try {
        const { user_info, role } = ctx.auth || {};
        const trainer_id = user_info?.user_id;
        const plan_id = ctx.req.params?.plan_id;

        if (!plan_id) {
            return ctx.status(400).json({ success: false, message: "Missing plan_id." });
        }

        const body = await ctx.req.json();
        const {
            name,
            description,
            calories,
            protein_g,
            carbs_g,
            fats_g,
            image_url,
            meal_time,//('breakfast', 'lunch', 'dinner', 'snack', 'other')
            notes,
        } = body;

        if (!name) {
            return ctx.status(400).json({ success: false, message: "Meal Name is required." });
        }


        // Handle file attachments
        let attach: string = "";
        const copied = await copyFile(image_url, DirectoryServe.PLANS.nutrition_plan.MEAL(image_url), true);
        if (copied) attach = filename(image_url);

        // Prepare payload
        const payload = {
            description,
            calories,
            protein_g,
            carbs_g,
            fats_g,
            meal_time,
            notes,
            image_url: attach ? attach : undefined,
        };

        // Insert into DB
        const { success, result, error } = await dbQuery<{ insertId: number }>(
            insert(TABLES.PLANS.NUTRITION.MEAL, payload)
        );

        if (!success) {
            console.error("DB Insert Error:", error);
            return ctx.status(500).json({ success: false, message: "Database error occurred." });
        }

        return ctx.json({
            success: true,
            message: "Meal added successfully.",
            data: { meal_id: result?.insertId, ...payload },
        });

    }
    catch (err) {
        console.error("Error in POST /meal:", err);
        return ctx.status(500).json({ success: false, message: "Internal server error." });
    }
});

nutritionPlans.put("/:plan_id/meal/:meal_id", async (ctx) => {
    try {
        const { user_info, role } = ctx.auth || {};
        const plan_id = ctx.req.params?.plan_id;
        const meal_id = ctx.req.params?.meal_id;

        if (!plan_id || !meal_id) {
            return ctx.status(400).json({ success: false, message: "Missing plan_id or meal_id." });
        }

        const body = await ctx.req.json();
        const {
            name,
            description,
            calories,
            protein_g,
            carbs_g,
            fats_g,
            image_url,
            meal_time,//('breakfast', 'lunch', 'dinner', 'snack', 'other')
            notes,
        } = body;


        // Handle file attachments
        let attach: string = "";
        const copied = await copyFile(image_url, DirectoryServe.PLANS.nutrition_plan.MEAL(image_url), true);
        if (copied) attach = filename(image_url);

        // Prepare payload
        const payload: any = {};
        if (name) payload.name = name;
        if (fats_g) payload.fats_g = fats_g;
        if (description) payload.description = description;
        if (protein_g) payload.protein_g = protein_g;
        if (carbs_g) payload.carbs_g = carbs_g;
        if (meal_time) payload.meal_time = meal_time;
        if (calories) payload.notes = calories;
        if (notes) payload.notes = notes;
        if (attach) payload.image_url = JSON.stringify(attach);

        payload.updated_at = mysql_date();
        // Update in DB
        const { success, result, error } = await dbQuery(
            update(TABLES.PLANS.NUTRITION.MEAL, {
                values: payload,
                where: `meal_id = ${sanitize(meal_id)} AND plan_id = ${sanitize(plan_id)}`
            })
        );
        if (!success) {
            console.error("DB Update Error:", error);
            return ctx.status(500).json({ success: false, message: "Database update failed." });
        }
        return ctx.json({
            success: true,
            message: "Meal updated successfully.",
            data: { meal_id, ...payload },
        });
    }
    catch (err) {
        console.error("Error in PUT /meal:", err);
        return ctx.status(500).json({ success: false, message: "Internal server error." });
    }
});

nutritionPlans.delete("/:plan_id/meal/:meal_id", async (ctx) => {
    try {
        const { plan_id, meal_id } = ctx.req.params;

        if (!plan_id || !meal_id) {
            return ctx.status(400).json({ success: false, message: "Missing plan_id or meal_id." });
        }

        // Delete from DB
        let sql = destroy(TABLES.PLANS.NUTRITION.PLANS, {
            where: `meal_id = ${sanitize(meal_id)} AND plan_id = ${sanitize(plan_id)}`
        })
        const { success, result, error } = await dbQuery<any>(sql);

        if (!success) {
            return ctx.status(500).json({ success: false, message: "Failed to delete meal." });
        }

        // Check if row was actually deleted
        if (result.affectedRows === 0) {
            return ctx.status(404).json({ success: false, message: "Meal not found or already deleted." });
        }

        return ctx.json({
            success: true,
            message: "Meal deleted successfully.",
            data: { meal_id, plan_id }
        });

    } catch (err) {
        console.error("DELETE /meals Error:", err);
        return ctx.status(500).json({ success: false, message: "Internal server error." });
    }
});


export default nutritionPlans;