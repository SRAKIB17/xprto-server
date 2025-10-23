import { find, insert, sanitize, SortType } from "@tezx/sqlx/mysql";
import { Router } from "tezx";
import { paginationHandler } from "tezx/middleware";
import { DirectoryServe, filename } from "../../../../../config.js";
import { dbQuery } from "../../../../../models/index.js";
import { TABLES } from "../../../../../models/table.js";
import { copyFile } from "../../../../../utils/fileExists.js";
import { performWalletTransaction } from "../../../../../utils/createWalletTransaction.js";
import { generateTxnID } from "../../../../../utils/generateTxnID.js";
import { generateUUID } from "tezx/helper";

// import user_account_document_flag from "./flag-document.js";
const xprtoJobFeed = new Router({
    basePath: '/xprto/job-feed'
});
xprtoJobFeed.get(
    "/",
    paginationHandler({
        getDataSource: async (ctx, { page, limit, offset }) => {
            const { role } = ctx.auth || {};
            const { search, verify, mode, status } = ctx?.req.query;
            const { user_id, username, hashed, salt, } = ctx.auth?.user_info || {};
            let condition = "";

            if ((role === 'gym' || role === 'admin') && !status) {
                condition = "jp.status IN ('draft', 'published', 'closed', 'archived')"
            }
            else {
                condition = `jp.status = "published"`
            }

            if (role === 'gym') {
                condition += ` AND jp.gym_id = ${sanitize(user_id)}`;
            }
            if (status) {
                condition += ` AND jp.status = ${sanitize(status)}`;
            }


            if (search) {
                // condition += ` AND MATCH(title, description, subtitle) AGAINST (${sanitize(search)} IN NATURAL LANGUAGE MODE)`;
            }

            let sort = {
                created_at: -1
            } as SortType<any>

            let sql = find(`${TABLES.GYMS.job_posts} as jp`, {
                sort: sort,
                joins: `LEFT JOIN ${TABLES.GYMS.gyms} as g ON jp.gym_id = g.gym_id`,
                columns: `
            jp.job_id,
            jp.gym_id,
            jp.posted_by,
            jp.available_slots,
            jp.vacancies,
            jp.title,
            jp.subtitle,
            jp.requirements,
            jp.responsibilities,
            jp.qualifications,
            jp.experience_required,
            jp.min_experience_years,
            jp.job_type,
            jp.employment_place,
            jp.gender_preference,
            jp.salary_type,
            jp.salary,
            jp.salary_min,
            jp.salary_max,
            jp.salary_unit,
            jp.currency,
            jp.start_date,
            jp.tags,
            jp.category,
            jp.location,
            jp.city,
            jp.state,
            jp.video,
            jp.images,
            jp.attachments,
            jp.faqs,
            jp.benefits,
            jp.extra,
            jp.visibility,
            jp.status,
            jp.priority,
            jp.created_at,
            jp.updated_at,
            g.gym_name as gym_name,
            g.lat as gym_lat,
            g.lng as gym_lng,
            g.district as gym_district,
            g.state as gym_state,
            g.address as gym_address,
            g.logo_url as gym_logo,
            g.country as gym_country
            `,
                limitSkip: {
                    limit: limit,
                    skip: offset
                },
                where: condition,
            })
            let count = find(`${TABLES.GYMS.job_posts} as jp`, {
                columns: 'count(*) as count',
                joins: `LEFT JOIN ${TABLES.GYMS.gyms} as g ON jp.gym_id = g.gym_id`,
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

xprtoJobFeed.get('/:id', async (ctx) => {
    const { id } = ctx.req.params;
    const { role, user_info } = ctx.auth || {};
    const userId = user_info?.user_id;
    const { images, video } = await ctx.req.json();

    if (!id) {
        return ctx.json({ success: false, message: "Service ID is required" });
    }
    try {
        let condition = `jp.job_id = ${sanitize(id)}`;
        if ((role === 'gym' || role === 'admin')) {
            condition += " AND jp.status IN ('draft', 'published', 'closed', 'archived')"
        }
        else {
            condition += ` AND jp.status = "published"`
        }

        if (role === 'gym') {
            condition += ` AND jp.gym_id = ${sanitize(userId)}`;
        }

        const joinsArr = [
            `LEFT JOIN ${TABLES.GYMS.gyms} as g ON jp.gym_id = g.gym_id`,
            `LEFT JOIN ${TABLES.TRAINERS.job_applications} as jt ON jt.job_id = jp.job_id`,
        ];

        let sql = find(`${TABLES.GYMS.job_posts} as jp`, {
            joins: joinsArr.join(' '),
            groupBy: `jp.job_id`,
            columns: `jp.*,
            g.gym_name as gym_name,
            g.lat as gym_lat,
            g.lng as gym_lng,
            g.district as gym_district,
            g.about as gym_about,
            g.state as gym_state,
            g.address as gym_address,
            g.logo_url as gym_logo,
            g.country as gym_country,
            CASE WHEN jt.id IS NOT NULL AND jt.trainer_id = ${sanitize(userId)} THEN 'applied' ELSE 'not_applied' END as application_status,
            COUNT(jt.id) as total_applications
            `,
            where: condition
        });
        console.log(sql);
        return ctx.json(await dbQuery<any>(sql));

    } catch (err) {
        return ctx.json({ success: false, message: "Internal server error" });
    }
});

xprtoJobFeed.post('/:id/apply', async (ctx) => {
    const { id } = ctx.req.params;
    const { role, user_info } = ctx.auth || {};
    const userId = user_info?.user_id;
    if (!id) {
        return ctx.json({ success: false, message: "Job id is required" });
    }

    try {
        const { cover_letter, attachment, notes, amount,
            expected_salary,
            expected_salary_unit,
        } = await ctx.req.json();
        let finalAttachments: string[] = [];

        if (Array.isArray(attachment)) {
            for (const att of attachment) {
                // ধরে নিচ্ছি att হচ্ছে client থেকে আসা temp path বা file name
                const fileName = filename(att);
                let check = await copyFile(att, DirectoryServe.jobAttachments(fileName));
                if (check) {
                    finalAttachments.push(`/${fileName}`);
                }
            }
        }
        const sql = insert(TABLES.TRAINERS.job_applications, {
            job_id: id,
            expected_salary,
            expected_salary_unit,
            notes,
            cover_letter,
            attachment: finalAttachments.length > 0 ? JSON.stringify(finalAttachments) : undefined,
            trainer_id: userId
        })
        let txn_id = generateTxnID("JOB");

        const { success, error } = await dbQuery(sql);
        if (success) {
            await performWalletTransaction({
                role: role,
                user_id: userId,
            }, {
                amount: amount,
                type: 'payment',
                payment_method: "wallet",
                external_txn_id: txn_id,
                idempotency_key: generateUUID(),
                note: "Payment Job application",
                reference_type: "job_application"
            })

            return ctx.json({ success: true, message: "Successfully applied to the job" });
        } else {
            return ctx.json({ success: false, message: "Failed to apply to the job" });
        }
    } catch (err) {
        return ctx.json({ success: false, message: "Internal server error" });
    }
});

xprtoJobFeed.get(
    "/my-applications",
    paginationHandler({
        getDataSource: async (ctx, { page, limit, offset }) => {
            const { role } = ctx.auth || {};
            if (role === 'trainer') {

                const { search, verify, mode, status, job_id } = ctx?.req.query;
                const { user_id, username, hashed, salt, } = ctx.auth?.user_info || {};
                let condition = "";
                if ((role === 'gym' || role === 'admin')) {
                    condition = "jp.status IN ('draft', 'published', 'closed', 'archived')"
                }
                else {
                    condition = `jp.status = "published"`
                }

                if (status) {
                    condition += ` AND jt.status = ${sanitize(status)}`;
                }
                if (role === 'gym') {
                    condition += ` AND jp.gym_id = ${sanitize(user_id)}`;
                }
                if (job_id) {
                    condition += ` AND jt.job_id = ${sanitize(job_id)}`;
                }

                let sort = {
                    applied_at: -1
                } as SortType<any>

                let sql = find(`${TABLES.GYMS.job_posts} as jp`, {
                    sort: sort,
                    joins: `LEFT JOIN ${TABLES.GYMS.gyms} as g ON jp.gym_id = g.gym_id RIGHT JOIN ${TABLES.TRAINERS.job_applications} as jt ON jt.job_id = jp.job_id AND jt.trainer_id = ${sanitize(user_id)}`,
                    limitSkip: {
                        limit: limit,
                        skip: offset
                    },
                    columns: `jt.*,
            jp.job_id,
            jp.gym_id,
            jp.posted_by,
            jp.available_slots,
            jp.vacancies,
            jp.title,
            jp.subtitle,
            jp.requirements,
            jp.responsibilities,
            jp.qualifications,
            jp.experience_required,
            jp.min_experience_years,
            jp.job_type,
            jp.employment_place,
            jp.gender_preference,
            jp.salary_type,
            jp.salary,
            jp.salary_min,
            jp.salary_max,
            jp.salary_unit,
            jp.currency,
            jp.start_date,
            jp.tags,
            jp.category,
            jp.location,
            jp.city,
            jp.state,
            jp.video,
            jp.images,
            jp.attachments,
            jp.faqs,
            jp.benefits,
            jp.extra,
            jp.visibility,
            jp.priority,
            jp.created_at,
            jp.updated_at,
            g.gym_name as gym_name,
            g.lat as gym_lat,
            g.lng as gym_lng,
            g.district as gym_district,
            g.state as gym_state,
            g.address as gym_address,
            g.logo_url as gym_logo,
            g.country as gym_country
                    `,
                    where: condition,
                })
                let count = find(`${TABLES.GYMS.job_posts} as jp`, {
                    columns: 'count(*) as count',
                    joins: `LEFT JOIN ${TABLES.GYMS.gyms} as g ON jp.gym_id = g.gym_id RIGHT JOIN ${TABLES.TRAINERS.job_applications} as jt ON jt.job_id = jp.job_id AND jt.trainer_id = ${sanitize(user_id)}`,
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
            }
            else {
                return {
                    data: [],
                    total: 0
                }
            }
        },
    })
);

export default xprtoJobFeed;