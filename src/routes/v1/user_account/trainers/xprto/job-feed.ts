import { destroy, find, insert, mysql_date, mysql_datetime, sanitize, SortType, update } from "@tezx/sqlx/mysql";
import { Router } from "tezx";
import { paginationHandler } from "tezx/middleware";
import { DirectoryServe, filename } from "../../../../../config.js";
import { dbQuery } from "../../../../../models/index.js";
import { TABLES } from "../../../../../models/table.js";
import { copyFile, safeUnlink } from "../../../../../utils/fileExists.js";

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
            const { user_id, username, hashed, salt, email } = ctx.auth?.user_info || {};
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
                columns: `jp.*,
                g.gym_name as gym_name,
                g.lat as gym_lat,
                g.lng as gym_lng,
                g.district as gym_district,
                g.state as gym_state,
                g.address as gym_address,
                g.logo_url as gym_logo,
                g.country as gym_country`,
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
        if ((role === 'gym' || role === 'admin') && !status) {
            condition += " AND jp.status IN ('draft', 'published', 'closed', 'archived')"
        }
        else {
            condition += ` AND jp.status = "published"`
        }

        if (role === 'gym') {
            condition += ` AND jp.gym_id = ${sanitize(userId)}`;
        }

        let sql = find(`${TABLES.GYMS.job_posts} as jp`, {
            joins: `LEFT JOIN ${TABLES.GYMS.gyms} as g ON jp.gym_id = g.gym_id`,
            columns: `jp.*,
                g.gym_name as gym_name,
                g.lat as gym_lat,
                g.lng as gym_lng,
                g.district as gym_district,
                g.state as gym_state,
                g.address as gym_address,
                g.logo_url as gym_logo,
                g.country as gym_country`,

            where: `{condition}`,
        });

    } catch (err) {
        return ctx.json({ success: false, message: "Internal server error" });
    }
});

// xprtoJobFeed.put('/:id/publish', async (ctx) => {
//     const { id } = ctx.req.params;
//     const { role, user_info } = ctx.auth || {};
//     const userId = user_info?.user_id;
//     if (!id) {
//         return ctx.json({ success: false, message: "Service ID is required" });
//     }
//     try {
//         const sql = update(TABLES.TRAINERS.services, {
//             values: {
//                 status: 'active',
//             },
//             where: `service_id = ${sanitize(id)} AND trainer_id = ${userId}`
//         })
//         const { success } = await dbQuery(sql);
//         if (success) {
//             return ctx.json({ success: true, message: "Service publish successfully. Wait for approval" });
//         } else {
//             return ctx.json({ success: false, message: "Failed to publish service" });
//         }
//     } catch (err) {
//         return ctx.json({ success: false, message: "Internal server error" });
//     }
// });

// xprtoJobFeed.put('/add-update', async (ctx) => {
//     const { role, user_info } = ctx.auth || {};
//     const userId = user_info?.user_id;
//     if (!userId) return ctx.json({ success: false, message: "Unauthorized" });

//     const body = await ctx.req.json();

//     const {
//         title, description, duration_minutes, package_name, package_features, price, discount,
//         delivery_mode, requirements, video, images, certificates, faqs, mode, status, service_id,
//         per_unit, recurrence_days, recurrence_type, time_from
//     } = body;

//     let finalVideo = undefined;
//     // Parse arrays and JSON fields
//     if (video) {
//         if (await copyFile(video, DirectoryServe.myServices.video(video), true)) {
//             finalVideo = filename(video);
//         }
//     }
//     let finalImages = [];
//     if (Array.isArray(images)) {
//         for (const img of images) {
//             if (await copyFile(img, DirectoryServe.myServices.images(img), true)) {
//                 finalImages.push(filename(img));
//             }
//         }
//     }
//     let finalAttachments = [];
//     if (Array.isArray(certificates)) {
//         for (const cert of certificates) {
//             if (await copyFile(cert, DirectoryServe.myServices.images(cert), true)) {
//                 finalAttachments.push(filename(cert));
//             }
//         }
//     }
//     const json = {
//         title,
//         time_from,
//         trainer_id: userId,
//         description,
//         per_unit,
//         recurrence_days: Array.isArray(recurrence_days) && recurrence_days?.length ? JSON.stringify(recurrence_days) : undefined,
//         recurrence_type,
//         duration_minutes: duration_minutes || undefined,
//         package_name: package_name || undefined,
//         package_features: Array.isArray(package_features) ? JSON.stringify(package_features) : undefined,
//         price,
//         discount: discount || "0",
//         delivery_mode,
//         verify_status: 'pending',
//         requirements: requirements || undefined,
//         video: finalVideo || undefined,
//         images: finalImages.length ? JSON.stringify(finalImages) : undefined,
//         attachments: finalAttachments.length ? JSON.stringify(finalAttachments) : undefined,
//         faqs: Array.isArray(faqs) ? JSON.stringify(faqs.map(r => ({
//             question: r?.question,
//             answer: r?.answer
//         })).filter(Boolean)) : undefined,
//         updated_at: mysql_datetime(),
//         status: status === 'draft' ? 'draft' : 'active',
//     };

//     try {
//         if (mode === 'edit' && service_id) {
//             // Update existing service
//             const updateSql = update(TABLES.TRAINERS.services, {
//                 values: json,
//                 where: `service_id = ${sanitize(service_id)} AND trainer_id = ${sanitize(userId)}`
//             })
//             const { success } = await dbQuery(updateSql);
//             return ctx.json({ success, message: success ? "Service updated successfully" : "Failed to update service" });
//         } else {
//             const insertSql = insert(TABLES.TRAINERS.services, json)
//             const { success, result: { insertId } } = await dbQuery<any>(insertSql);
//             return ctx.json({ success, service_id: insertId, message: success ? "Service created successfully" : "Failed to create service" });
//         }
//     } catch (err) {
//         return ctx.json({ success: false, message: "Internal server error" });
//     }
// });

export default xprtoJobFeed;