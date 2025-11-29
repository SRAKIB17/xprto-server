import { find, insert, mysql_date, sanitize, SortType } from "@tezx/sqlx/mysql";
import { Router } from "tezx";
import { generateUUID } from "tezx/helper";
import { paginationHandler } from "tezx/middleware";
import { DirectoryServe, filename } from "../../../../../config.js";
import { dbQuery } from "../../../../../models/index.js";
import { TABLES } from "../../../../../models/table.js";
import { performWalletTransaction } from "../../../../../utils/createWalletTransaction.js";
import { copyFile } from "../../../../../utils/fileExists.js";
import { generateTxnID } from "../../../../../utils/generateTxnID.js";
import { sendNotification } from "../../../../../utils/sendNotification.js";

// import user_account_document_flag from "./flag-document.js";
const xprtoJobFeed = new Router({
    basePath: '/job-feed'
});

/**
 * ?search=
 * ?job_type=  'full_time', 'part_time',   'contract',  'freelance',  'internship',  'temporary'
 * ?gender_preference= ('any', 'male', 'female')
 * ?salary_type=    'per_session', 'per_month', 'commission', 'hourly'
 * ?experience_required = '1-3 years' or other some
 * ?category =category
 * ?priority=('low', 'medium', 'high') 
 * ?salary_min=
 * ?salary_max=
 * ?min_experience_years=
 * ?city=
 * ?state=
 * ?start_date=
 * ?lat_=
 * ?lng_=
 * ?distance_km=number
 */

/**
 * sort=:
rating_desc
rating_asc
salary_high
price_high
salary_low
price_low
newest
new_to_old
oldest
old_to_new
priority_high
distance_asc
nearest
 * 
 */

xprtoJobFeed.get(
    "/",
    paginationHandler({
        getDataSource: async (ctx, { page, limit, offset }) => {
            const { role } = ctx.auth || {};
            const {
                search,
                status,
                job_type,
                employment_place,
                gender_preference,
                salary_min,
                salary_max,
                salary_type,
                min_experience_years,
                experience_required,
                city,
                state,
                distance_km,
                priority,
                category,
                start_date,
                sort,
            } = ctx.req.query;

            const { user_id } = ctx.auth?.user_info || {};

            /** BASE CONDITION */
            let condition = `jp.status = "published"`;


            /** Filters */
            if (job_type) condition += ` AND jp.job_type = ${sanitize(job_type)}`;
            if (employment_place) condition += ` AND jp.employment_place = ${sanitize(employment_place)}`;
            if (gender_preference) condition += ` AND jp.gender_preference = ${sanitize(gender_preference)}`;
            if (salary_type) condition += ` AND jp.salary_type = ${sanitize(salary_type)}`;
            if (experience_required) condition += ` AND jp.experience_required = ${sanitize(experience_required)}`;
            if (category) condition += ` AND jp.category = ${sanitize(category)}`;
            if (priority) condition += ` AND jp.priority = ${sanitize(priority)}`;

            /** Number Filters */
            if (salary_min) condition += ` AND jp.salary >= ${sanitize(salary_min)}`;
            if (salary_max) condition += ` AND jp.salary <= ${sanitize(salary_max)}`;
            if (min_experience_years)
                condition += ` AND jp.min_experience_years >= ${sanitize(min_experience_years)}`;

            if (city) condition += ` AND jp.city LIKE ${sanitize("%" + city + "%")}`;
            if (state) condition += ` AND jp.state LIKE ${sanitize("%" + state + "%")}`;

            if (start_date) condition += ` AND jp.start_date >= ${mysql_date(start_date as string)}`;

            /** Geo Filters */
            const lat_ = ctx.req.query.lat_ ? Number(ctx.req.query.lat_) : null;
            const lng_ = ctx.req.query.lng_ ? Number(ctx.req.query.lng_) : null;
            // WHERE distance filter (must be raw formula, not alias)
            if (distance_km && lat_ && lng_) {
                condition += `
          AND (
            6371 * ACOS(
              COS(RADIANS(${lat_}))
              * COS(RADIANS(g.lat))
              * COS(RADIANS(g.lng) - RADIANS(${lng_}))
              + SIN(RADIANS(${lat_})) * SIN(RADIANS(g.lat))
            )
          ) <= ${distance_km}
        `;
            }
            /** Text search */
            if (search) {
                const s = JSON.stringify(`%${search}%`);
                condition += `
          AND (
            jp.title LIKE ${s}
            OR jp.subtitle LIKE ${s}
            OR jp.description LIKE ${s}
            OR jp.requirements LIKE ${s}
            OR jp.responsibilities LIKE ${s}
            OR jp.qualifications LIKE ${s}
          )
        `;
            }

            /** Sorting */
            const sortKey = (sort || "").toString();
            let sortObj: Record<string, 1 | -1> = { "jp.created_at": -1 };

            switch (sortKey) {
                case "rating_desc":
                    sortObj = { gym_rating: -1, "jp.created_at": -1 };
                    break;

                case "rating_asc":
                    sortObj = { gym_rating: 1, "jp.created_at": -1 };
                    break;

                case "salary_high":
                case "price_high":
                    sortObj = {
                        "jp.salary_max": -1,
                        "jp.salary": -1,
                        "jp.created_at": -1,
                    };
                    break;

                case "salary_low":
                case "price_low":
                    sortObj = {
                        "jp.salary_min": 1,
                        "jp.salary": 1,
                        "jp.created_at": -1,
                    };
                    break;

                case "oldest":
                case "old_to_new":
                    sortObj = { "jp.created_at": 1 };
                    break;

                case "newest":
                case "new_to_old":
                    sortObj = { "jp.created_at": -1 };
                    break;

                case "priority_high":
                    sortObj = { "jp.priority": -1, "jp.created_at": -1 };
                    break;

                case "nearest":
                case "distance_asc":
                    if (lat_ && lng_) sortObj = { distance_km: 1, "jp.created_at": -1 };
                    break;

                default:
                    sortObj = { "jp.created_at": -1 };
            }

            /** MAIN QUERY */
            const sql = find(`${TABLES.GYMS.job_posts} as jp`, {
                columns: `
          AVG(gr.rating) AS gym_rating,
          
          ${lat_ && lng_
                        ? `
          (
            6371 * ACOS(
              COS(RADIANS(${lat_}))
              * COS(RADIANS(g.lat))
              * COS(RADIANS(g.lng) - RADIANS(${lng_}))
              + SIN(RADIANS(${lat_})) * SIN(RADIANS(g.lat))
            )
          ) AS distance_km,
          `
                        : ""
                    }

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

          g.gym_name,
          g.lat AS gym_lat,
          g.lng AS gym_lng,
          g.district AS gym_district,
          g.state AS gym_state,
          g.address AS gym_address,
          g.logo_url AS gym_logo,
          g.country AS gym_country
        `,
                joins: `
          LEFT JOIN ${TABLES.GYMS.gyms} as g ON jp.gym_id = g.gym_id
          LEFT JOIN ${TABLES.FEEDBACK.GYM_TRAINER_CLIENT} as f ON f.gym_id = g.gym_id
          LEFT JOIN ${TABLES.FEEDBACK.GYM_TRAINER_CLIENT} as gr ON gr.gym_id = g.gym_id
        `,
                where: condition,
                sort: sortObj,
                limitSkip: {
                    limit: limit,
                    skip: offset,
                },
                groupBy: "jp.job_id", // FIXED 🚀
            });

            /** COUNT QUERY */
            const count = find(`${TABLES.GYMS.job_posts} as jp`, {
                columns: "COUNT(*) AS count",
                joins: `LEFT JOIN ${TABLES.GYMS.gyms} AS g ON jp.gym_id = g.gym_id`,
                where: condition,
            });

            const { success, result } = await dbQuery(`${sql}${count}`);
            console.log(sql)
            if (!success) {
                return {
                    data: [],
                    total: 0,
                };
            }

            return {
                data: result?.[0],
                total: result?.[1]?.[0]?.count,
            } as any;
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
            gym_id
        } = await ctx.req.json();
        let finalAttachments: string[] = [];

        if (Array.isArray(attachment)) {
            for (const att of attachment) {
                // ধরে নিচ্ছি att হচ্ছে client থেকে আসা temp path বা file name
                const fileName = filename(att);
                let check = await copyFile(att, DirectoryServe.jobAttachments(fileName), true);
                if (check) {
                    finalAttachments.push(`/${fileName}`);
                }
            }
        }
        let txn_id = generateTxnID("JOB");
        let { success } = await performWalletTransaction({
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

        const sql = insert(TABLES.TRAINERS.job_applications, {
            job_id: id,
            expected_salary,
            expected_salary_unit,
            notes,
            cover_letter,
            attachment: finalAttachments.length > 0 ? JSON.stringify(finalAttachments) : undefined,
            trainer_id: userId
        })

        if (success) {
            if (gym_id) {
                await sendNotification(
                    {
                        recipientId: gym_id,
                        recipientType: 'gym',

                        senderType: 'trainer', // or 'trainer' depending on your system
                        senderId: userId,

                        title: `New Job Application Received`,
                        message: `${user_info?.full_time} has applied for your job (#${id}). Expected Salary: ${expected_salary ? `${expected_salary} ${expected_salary_unit}` : 'Not specified'}.`,
                        type: 'alert',
                        action_url: `/job-feed`,
                        priority: 'high',
                        metadata: {
                            event: 'job_application',
                        },
                    },
                    'all'
                );
            }

            const { success, error } = await dbQuery(sql);
            return ctx.json({ success: success, message: "Successfully applied to the job" });
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