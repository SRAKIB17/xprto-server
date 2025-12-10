import { destroy, find, insert, sanitize, update } from "@tezx/sqlx/mysql";
import { Router } from "tezx";
import { paginationHandler } from "tezx/middleware";
import { dbQuery, TABLES } from "../../../../models/index.js";
import { DirectoryServe, filename } from "../../../../config.js";
import { copyFile, removeFile } from "../../../../utils/fileExists.js";

const jobFeedAdmin = new Router();

/**
 * GET /job-posts
 * Fetch job posts with pagination
 * Optional query params: page, limit, status, gym_id, job_type, city
 */
jobFeedAdmin.get(
    "/",
    paginationHandler({
        getDataSource: async (ctx, { page, limit, offset }) => {
            const { status, gym_id, job_type, city, gym_name, title } = ctx.req.query;
            let conditions: string[] = [];
            if (status) conditions.push(`j.status = ${sanitize(status)}`);
            if (title) conditions.push(`j.title = ${sanitize(title)}`)
            if (gym_id) conditions.push(`j.gym_id = ${sanitize(gym_id)}`);
            if (job_type) conditions.push(`j.job_type = ${sanitize(job_type)}`);
            if (city) conditions.push(`j.city = ${sanitize(city)}`);
            if (gym_name) conditions.push(`g.gym_name = ${sanitize(gym_name)}`)
            const whereClause = conditions.length ? `${conditions.join(" AND ")}` : "";
            let findSql = find(`${TABLES.GYMS.job_posts} as j`, {
                joins: `LEFT JOIN ${TABLES.GYMS.gyms} as g ON g.gym_id = j.gym_id`,
                limitSkip: {
                    limit, skip: offset
                },
                where: whereClause
            })

            let countSql = find(`${TABLES.GYMS.job_posts} as j`, {
                joins: `LEFT JOIN ${TABLES.GYMS.gyms} as g ON g.gym_id = j.gym_id`,
                columns: "count(*) as count",
                where: whereClause
            })

            const { success, result, error } = await dbQuery<any[]>(`${findSql}${countSql}`);
            if (!success) {
                console.error(error);
                return { data: [], total: 0 };
            }

            return {
                data: result?.[0],
                total: result?.[1]?.[0]?.count,
            };
        },
    })
);

jobFeedAdmin.put("/:job_id/status/:status", async (ctx) => {
    try {
        const { job_id, status } = ctx.req.params;
        const body = await ctx.req.json();
        const { reason } = body;
        // allowed status list
        const allowedStatuses = ["draft", "published", "closed", "archived"];
        if (!allowedStatuses.includes(status)) {
            return ctx.status(400).json({ error: "Invalid status" });
        }

        // Auth
        let { role, user_info } = ctx.auth ?? {};
        const decision_by = user_info?.user_id ?? null;
        const decision_role = "admin";

        // ================================
        // Check job exists
        // ================================
        const checkSql = `
                SELECT job_id, status 
                FROM job_posts 
                WHERE job_id = ${sanitize(job_id)} AND gym_id = ${sanitize(decision_by)}
                LIMIT 1;
            `;

        const { success: found, result: jobRows } = await dbQuery<any[]>(checkSql);

        if (!found || jobRows?.length === 0) {
            return ctx.status(404).json({ error: "Job post not found" });
        }

        // ================================
        // Build update SQL
        // ================================
        const updateSql = update(TABLES.GYMS.job_posts, {
            values: {
                decision_by: decision_by,
                decision_reason: reason,
                decision_role: decision_role,
                decision_at: mysql_datetime()
            },
            where: `job_id = ${sanitize(job_id)}`
        })

        const { success, error } = await dbQuery(updateSql);

        if (!success) {
            console.error(error);
            return ctx.status(500).json({ error: "Status update failed" });
        }

        return ctx.json({
            success: true,
            message: "Job status updated",
            job_id,
            new_status: status,
            decision_by,
            decision_role,
        });
    } catch (err) {
        console.error(err);
        return ctx.status(500).json({ error: "Server error" });
    }
}
);

jobFeedAdmin.get("/applications/:job_id",
    paginationHandler({
        getDataSource: async (ctx, { page, limit, offset }) => {
            const { role, user_info } = ctx.auth ?? {};
            const { user_id } = user_info ?? {};
            const job_id = ctx.req.params.job_id;

            const whereClause = `ja.job_id = ${sanitize(job_id)}`;

            // ---------- FIND QUERY ----------
            const findSql = find(`${TABLES.TRAINERS.job_applications} as ja`, {
                joins: `
                    LEFT JOIN ${TABLES.TRAINERS.trainers} as t 
                        ON t.trainer_id = ja.trainer_id
                    LEFT JOIN ${TABLES.GYMS.job_posts} as j 
                        ON j.job_id = ja.job_id
                    LEFT JOIN ${TABLES.GYMS.gyms} as g 
                        ON g.gym_id = j.gym_id
                `,
                columns: `
                    ja.*,
                    t.fullname, t.gender, t.phone, t.email, t.avatar as trainer_avatar,
                    j.title, j.category, j.city,
                    g.gym_name,
                    g.avatar as gym_avatar,
                    g.gym_name,
                    g.logo_url
                `,
                where: whereClause,
                limitSkip: { limit, skip: offset }
            });

            // ---------- COUNT QUERY ----------
            const countSql = find(`${TABLES.TRAINERS.job_applications} as ja`, {
                joins: `
                    LEFT JOIN ${TABLES.TRAINERS.trainers} as t 
                        ON t.trainer_id = ja.trainer_id
                    LEFT JOIN ${TABLES.GYMS.job_posts} as j 
                        ON j.job_id = ja.job_id
                    LEFT JOIN ${TABLES.GYMS.gyms} as g 
                        ON g.gym_id = j.gym_id
                `,
                columns: "COUNT(*) as count",
                where: whereClause
            });

            // ---------- EXECUTE ----------
            const { success, result, error } = await dbQuery<any[]>(`${findSql}${countSql}`);

            if (!success) {
                console.error(error);
                return { data: [], total: 0 };
            }

            return {
                data: result?.[0],
                total: result?.[1]?.[0]?.count,
            };
        },
    })
);
jobFeedAdmin.put(
    "/applications/:job_id/update/:application_id",
    async (ctx) => {
        try {
            const { job_id, application_id } = ctx.req.params;
            const body = await ctx.req.json();
            const {
                cover_letter,
                expected_salary,
                expected_salary_unit,
                status,
                notes,
                extra,
                remove_attachments, // array of old attachments to remove
                attachment, // new attachments (temp paths)
                decision_reason,
            } = body;

            // AUTH INFO
            const { role, user_info } = ctx.auth ?? {};
            const decision_by = user_info?.user_id ?? null;
            const decision_role = role === "admin" ? "admin" : "gym_owner";

            // ================================
            // Fetch existing application
            // ================================
            const selectSql = `
                SELECT attachment 
                FROM ${TABLES.TRAINERS.job_applications}
                WHERE id = ${sanitize(application_id)} 
                AND job_id = ${sanitize(job_id)}
                LIMIT 1;
            `;

            const { success: found, result } = await dbQuery<any[]>(selectSql);
            if (!found || !result?.length) {
                return ctx.status(404).json({ error: "Application not found" });
            }

            let currentAttachments: string[] = result[0]?.attachment ?? [];
            let finalAttachments = [...currentAttachments];

            // ================================
            // Remove old attachments + checkbox use korba
            // ================================
            if (Array.isArray(remove_attachments)) {
                for (const oldFile of remove_attachments) {
                    await removeFile(DirectoryServe.jobApplications(oldFile));
                    finalAttachments = finalAttachments.filter(f => f !== oldFile);
                }
            }

            // ================================
            // Add new attachments
            // ================================
            if (Array.isArray(attachment)) {
                for (const att of attachment) {
                    const fileName = filename(att);
                    let check = await copyFile(
                        att,
                        DirectoryServe.jobApplications(fileName),
                        true
                    );
                    if (check) {
                        finalAttachments.push(`/${fileName}`);
                    }
                }
            }

            // ================================
            // Prepare update SQL
            // ================================
            const updateData: any = {
                cover_letter,
                expected_salary,
                expected_salary_unit,
                status,
                notes,
                extra,
                attachment: JSON.stringify(finalAttachments)
            };

            // If status changed → record decision info
            if (status) {
                updateData.decision_by = decision_by;
                updateData.decision_role = decision_role;
                updateData.decision_reason = decision_reason ?? null;
                updateData.decision_at = new Date();
            }

            // Build dynamic SQL
            const setParts = Object.entries(updateData)
                .filter(([_, v]) => v !== undefined)
                .map(([k, v]) => `${k} = ${sanitize(v)}`)
                .join(", ");

            const updateSql = `
                UPDATE ${TABLES.TRAINERS.job_applications}
                SET ${setParts}
                WHERE id = ${sanitize(application_id)}
                AND job_id = ${sanitize(job_id)}
                LIMIT 1;
            `;

            const { success, error } = await dbQuery(updateSql);

            if (!success) {
                console.error(error);
                return ctx.status(500).json({ error: "Update failed" });
            }

            return ctx.json({
                success: true,
                message: "Application updated successfully",
                attachments: finalAttachments
            });

        } catch (err) {
            console.error(err);
            return ctx.status(500).json({ error: "Server error" });
        }
    }
);

jobFeedAdmin.post("/", async (ctx) => {
    const body = await ctx.req.json();
    const finalAttachments: string[] = [];

    // Handle attachments if sent as array
    const attachment = body.attachments;
    if (Array.isArray(attachment)) {
        for (const att of attachment) {
            const fileName = filename(att); // temp path or client filename
            const check = await copyFile(att, DirectoryServe.jobApplications(fileName), true);
            if (check) {
                finalAttachments.push(`/${fileName}`);
            }
        }
    }

    if (finalAttachments.length) {
        body.attachments = finalAttachments;
    }

    // ✅ Only allow fields defined in job_posts table
    const allowedFields = [
        "gym_id",
        "posted_by",
        "available_slots",
        "vacancies",
        "title",
        "subtitle",
        "description",
        "requirements",
        "responsibilities",
        "qualifications",
        "experience_required",
        "min_experience_years",
        "job_type",
        "employment_place",
        "gender_preference",
        "salary_type",
        "salary",
        "salary_min",
        "salary_max",
        "salary_unit",
        "currency",
        "start_date",
        "tags",
        "category",
        "location",
        "city",
        "state",
        "video",
        "images",
        "attachments",
        "faqs",
        "benefits",
        "extra",
        "visibility",
        "status",
        "priority",
    ];

    const cleanBody: any = {};
    for (const key of allowedFields) {
        if (body[key] !== undefined) {
            cleanBody[key] =
                typeof body[key] === "object" ? JSON.stringify(body[key]) : sanitize(body[key]);
        }
    }

    // Insert into DB
    const sql = insert(TABLES.GYMS.job_posts, cleanBody);
    const { success, result, error } = await dbQuery<any>(sql);

    if (!success) {
        console.error(error);
        return ctx.json({ success: false, message: "Failed to create job post" });
    }

    return ctx.json({ success: true, message: "Job post created", data: { job_id: result.insertId } });
});


jobFeedAdmin.put("/:job_id", async (ctx) => {
    const job_id = ctx.req.params.job_id;
    const body = await ctx.req.json();

    if (!job_id) {
        return ctx.json({ success: false, message: "Job ID is required" });
    }

    // Fetch existing job post to merge attachments if needed
    const { success: fetchSuccess, result: existingJob } = await dbQuery<any>(
        `SELECT attachments FROM ${TABLES.GYMS.job_posts} WHERE job_id = ${sanitize(job_id)}`
    );

    if (!fetchSuccess || !existingJob?.length) {
        return ctx.json({ success: false, message: "Job post not found" });
    }

    let oldAttachments: string[] = [];
    try {
        oldAttachments = existingJob[0].attachments ? JSON.parse(existingJob[0].attachments) : [];
    } catch (err) {
        oldAttachments = [];
    }

    // Handle new attachments
    const finalAttachments: string[] = [...oldAttachments];
    const attachment = body.attachments;
    if (Array.isArray(attachment)) {
        for (const att of attachment) {
            const fileName = filename(att);
            const check = await copyFile(att, DirectoryServe.jobApplications(fileName), true);
            if (check) {
                finalAttachments.push(`/${fileName}`);
            }
        }
    }

    if (finalAttachments.length) {
        body.attachments = finalAttachments;
    }

    // Only allow fields defined in job_posts table
    const allowedFields = [
        "gym_id", "posted_by", "available_slots", "vacancies", "title", "subtitle", "description",
        "requirements", "responsibilities", "qualifications", "experience_required", "min_experience_years",
        "job_type", "employment_place", "gender_preference", "salary_type", "salary", "salary_min",
        "salary_max", "salary_unit", "currency", "start_date", "tags", "category", "location", "city",
        "state", "video", "images", "attachments", "faqs", "benefits", "extra", "visibility", "status",
        "priority"
    ];

    const cleanBody: any = {};
    for (const key of allowedFields) {
        if (body[key] !== undefined) {
            cleanBody[key] =
                typeof body[key] === "object" ? JSON.stringify(body[key]) : sanitize(body[key]);
        }
    }

    // Update the job post
    const sql = update(TABLES.GYMS.job_posts, {
        values: cleanBody,
        where: `job_id = ${sanitize(job_id)}`,
    });

    const { success, result, error } = await dbQuery<any>(sql);

    if (!success) {
        console.error(error);
        return ctx.json({ success: false, message: "Failed to update job post" });
    }

    return ctx.json({ success: true, message: "Job post updated successfully" });
});
jobFeedAdmin.delete("/:job_id", async (ctx) => {
    const job_id = ctx.req.params.job_id;

    if (!job_id) {
        return ctx.json({ success: false, message: "Job ID is required" });
    }

    // Fetch existing job post to get attachments
    const { success: fetchSuccess, result: existingJob } = await dbQuery<any>(
        `SELECT attachments FROM ${TABLES.GYMS.job_posts} WHERE job_id = ${sanitize(job_id)}`
    );

    if (!fetchSuccess || !existingJob?.length) {
        return ctx.json({ success: false, message: "Job post not found" });
    }

    // Delete attachments from server
    try {
        const attachments: string[] = existingJob[0].attachments
            ? JSON.parse(existingJob[0].attachments)
            : [];
        for (const attPath of attachments) {
            const fullPath = DirectoryServe.jobApplications(attPath.replace(/^\//, ""));
            await removeFile(fullPath);
        }
    } catch (err) {
        console.warn("Failed to remove some attachments:", err);
    }

    // Delete the job post from DB
    const sql = destroy(TABLES.GYMS.job_posts, { where: `job_id = ${sanitize(job_id)}` });
    const { success, result, error } = await dbQuery<any>(sql);

    if (!success) {
        console.error(error);
        return ctx.json({ success: false, message: "Failed to delete job post" });
    }

    if (result?.affectedRows === 0) {
        return ctx.json({ success: false, message: "No job post found with this ID" });
    }

    return ctx.json({ success: true, message: "Job post deleted successfully" });
});

export default jobFeedAdmin;
