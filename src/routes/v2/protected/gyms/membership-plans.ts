import { destroy, find, insert, sanitize, update } from "@tezx/sqlx/mysql";
import { Router } from "tezx";
import { dbQuery, TABLES } from "../../../../models/index.js";

const gymMembershipPlans = new Router({
    basePath: "membership-plans"
});

gymMembershipPlans.get("/", async (ctx) => {
    let { role, user_info } = ctx.auth ?? {};
    const { user_id } = user_info ?? {};

    const sql = find(`${TABLES.GYMS.PLANS}`, {
        columns: `*`,
        where: `gym_id = ${sanitize(user_id)}`,
        sort: {
            plan_id: -1,
        }
    });
    return ctx.json(await dbQuery(sql));
});

/**
 * Create plan
 */
gymMembershipPlans.post("/", async (ctx) => {
    try {
        const body = await ctx.req.json();
        let { role, user_info } = ctx.auth ?? {};
        const { user_id } = user_info ?? {};

        // 🔍 Basic validation
        if (!body.title || !body.price) {
            return ctx.status(400).json({
                success: false,
                message: "Required fields: title, price",
            });
        }

        // 🔧 Auto-create slug if missing
        const slug = body.slug
            ? String(body.slug).trim()
            : String(body.title).trim().toLowerCase().replace(/\s+/g, "-");

        // 🧾 Prepare payload
        const payload = {
            gym_id: user_id,
            slug,
            title: body.title,
            description: body.description ?? null,
            billing_cycle: body.billing_cycle ?? "monthly",/**
            (
            'daily',
            'weekly',
            'monthly',
            'quarterly',
            'half_yearly',
            'yearly',
            'one_time'
        )  */
            duration_days: body.duration_days ?? null,
            price: body.price,
            discount_percent: body.discount_percent ?? 0,
            currency: body.currency ?? "INR",
            has_trainer: body.has_trainer ?? 0,
            trainer_type: body.trainer_type ?? "none",// ('none', 'general', 'personal', 'pro')
            self_training_allowed: body.self_training_allowed ?? 1,
            is_pro_plan: body.is_pro_plan ?? 0,

            // 🟦 JSON fields
            facilities: body.facilities ? (typeof body.facilities === 'string' ? body.facilities : JSON.stringify(body.facilities)) : undefined,
            features: body.features ? (typeof body.features === 'string' ? body.features : JSON.stringify(body.features)) : undefined,
            included_classes: body.included_classes ? (typeof body.included_classes === 'string' ? body.included_classes : JSON.stringify(body.included_classes)) : undefined,

            visibility: body.visibility ?? "public",
            active: body.active ?? 1,
        };

        // 🧨 Insert Query
        const { success, result, error } = await dbQuery(
            insert(TABLES.GYMS.PLANS, payload)
        );

        if (!success) {
            return ctx.status(500).json({
                success: false,
                message: error || "Failed to create plan",
            });
        }

        return ctx.json({
            success: true,
            message: "Plan created successfully",
            data: result,
        });

    } catch (err: any) {
        return ctx.status(500).json({
            success: false,
            message: "Internal server error",
            error: err?.message,
        });
    }
});
gymMembershipPlans.put("/:plan_id", async (ctx) => {
    try {
        const plan_id = ctx.params.plan_id;
        const body = await ctx.req.json();
        let { role, user_info } = ctx.auth ?? {};
        const { user_id } = user_info ?? {};

        if (!plan_id) {
            return ctx.status(400).json({
                success: false,
                message: "plan_id parameter is required",
            });
        }

        // 🟩 Build update payload (only include provided fields)
        const updatePayload: any = {};

        if (body.title) updatePayload.title = body.title;

        if (body.slug) {
            updatePayload.slug = String(body.slug).trim();
        } else if (body.title) {
            updatePayload.slug = String(body.title).trim().toLowerCase().replace(/\s+/g, "-");
        }

        if (body.description !== undefined) updatePayload.description = body.description;
        if (body.billing_cycle) updatePayload.billing_cycle = body.billing_cycle;
        if (body.duration_days !== undefined) updatePayload.duration_days = body.duration_days;

        if (body.price !== undefined) updatePayload.price = body.price;
        if (body.discount_percent !== undefined) updatePayload.discount_percent = body.discount_percent;

        if (body.currency) updatePayload.currency = body.currency;
        if (body.has_trainer !== undefined) updatePayload.has_trainer = body.has_trainer;
        if (body.trainer_type) updatePayload.trainer_type = body.trainer_type;
        if (body.self_training_allowed !== undefined) updatePayload.self_training_allowed = body.self_training_allowed;
        if (body.is_pro_plan !== undefined) updatePayload.is_pro_plan = body.is_pro_plan;

        // ⬅ JSON FIELDS
        if (body.facilities !== undefined) {
            updatePayload.facilities =
                typeof body.facilities === "string"
                    ? body.facilities
                    : JSON.stringify(body.facilities);
        }
        if (body.features !== undefined) {
            updatePayload.features =
                typeof body.features === "string"
                    ? body.features
                    : JSON.stringify(body.features);
        }
        if (body.included_classes !== undefined) {
            updatePayload.included_classes =
                typeof body.included_classes === "string"
                    ? body.included_classes
                    : JSON.stringify(body.included_classes);
        }

        if (body.visibility) updatePayload.visibility = body.visibility;
        if (body.active !== undefined) updatePayload.active = body.active;

        updatePayload.updated_at = new Date();

        // ❗ Prevent empty update
        if (Object.keys(updatePayload).length === 0) {
            return ctx.status(400).json({
                success: false,
                message: "No valid fields provided for update",
            });
        }

        // 🔐 Ensure gym owner can only update their own plans
        const condition = `plan_id = ${sanitize(plan_id)} AND gym_id = ${sanitize(user_id)}`;

        // 🛠 Perform update query
        const { success, result, error } = await dbQuery(
            update(TABLES.GYMS.PLANS, {
                where: condition,
                values: updatePayload
            })
        );

        if (!success) {
            return ctx.status(500).json({
                success: false,
                message: error || "Failed to update plan",
            });
        }

        return ctx.json({
            success: true,
            message: "Plan updated successfully",
            data: result,
        });

    } catch (err: any) {
        return ctx.status(500).json({
            success: false,
            message: "Internal server error",
            error: err?.message,
        });
    }
});


gymMembershipPlans.delete("/:plan_id", async (ctx) => {
    const { plan_id } = ctx.req.params;
    let { user_info } = ctx.auth ?? {};
    const { user_id } = user_info ?? {};

    if (!plan_id) return ctx.status(400).json({ success: false, message: "plan_id is required" });

    try {
        const sql = destroy(TABLES.GYMS.PLANS, {
            where: `plan_id = ${sanitize(plan_id)} AND gym_id = ${sanitize(user_id)}`,
        });

        const { success, result, error } = await dbQuery(sql);
        if (!success) {
            return ctx.status(500).json({ success: false, message: error || "Failed to delete plan" });
        }

        return ctx.json({ success: true, message: "Plan deleted", data: result });
    } catch (err) {
        return ctx.status(500).json({ success: false, message: "Internal server error", err });
    }
});


export default gymMembershipPlans;