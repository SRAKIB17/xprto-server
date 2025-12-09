import { find, sanitize } from "@tezx/sqlx/mysql";
import { Router } from "tezx";
import { paginationHandler } from "tezx/middleware";
import { dbQuery, TABLES } from "../../../../models/index.js";
import { copyFile, removeFile } from "../../../../utils/fileExists.js";
import { DirectoryServe, filename } from "../../../../config.js";

const jobFeedGym = new Router();

/**
 * GET /job-posts
 * Fetch job posts with pagination
 * Optional query params: page, limit, status, gym_id, job_type, city
 */
jobFeedGym.get("/", paginationHandler({
    getDataSource: async (ctx, { page, limit, offset }) => {
        const { status, gym_id, job_type, city, gym_name, title } = ctx.req.query;
        let { role, user_info } = ctx.auth ?? {};
        const { user_id } = user_info ?? {};
        let conditions: string[] = [`j.gym_id = ${sanitize(user_id)}`];

        if (status) conditions.push(`j.status = ${sanitize(status)}`);
        if (title) conditions.push(`j.title = ${sanitize(title)}`)
        if (gym_id) conditions.push(`j.gym_id = ${sanitize(gym_id)}`);
        if (job_type) conditions.push(`j.job_type = ${sanitize(job_type)}`);
        const whereClause = conditions.length ? `${conditions.join(" AND ")}` : "";
        let findSql = find(`${TABLES.GYMS.job_posts} as j`, {
            joins: `LEFT JOIN ${TABLES.GYMS.gyms} as g ON g.gym_id = j.gym_id`,
            where: whereClause,
            limitSkip: {
                limit, skip: offset
            },
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

jobFeedGym.get("/applications/:job_id",
    paginationHandler({
        getDataSource: async (ctx, { page, limit, offset }) => {
            const { role, user_info } = ctx.auth ?? {};
            const { user_id } = user_info ?? {};
            const job_id = ctx.req.params.job_id;

            let conditions: string[] = [
                `j.gym_id = ${sanitize(user_id)}`,
                `ja.job_id = ${sanitize(job_id)}`
            ];

            const whereClause = conditions.join(" AND ");

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
jobFeedGym.put(
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

export default jobFeedGym;
