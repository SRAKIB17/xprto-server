import { destroy, find, mysql_datetime, sanitize, update } from "@tezx/sqlx/mysql";
import { Router } from "tezx";
import { paginationHandler } from "tezx/middleware";
import { dbQuery } from "../../../../models/index.js";
import { TABLES } from "../../../../models/table.js";


// import user_account_document_flag from "./flag-document.js";
const myServices = new Router({
    basePath: '/my-services'
});
myServices.get(
    "/",
    paginationHandler({
        getDataSource: async (ctx, { page, limit, offset }) => {
            const { role } = ctx.auth || {};
            const { search, verify, mode } = ctx?.req.query;
            console.log(ctx?.req.query)
            const { user_id, username, hashed, salt, email } = ctx.auth?.user_info || {};
            let condition = `trainer_id = ${user_id}`
            if (search) {
                condition += ` AND MATCH(title, description, details) AGAINST (${sanitize(search)} IN NATURAL LANGUAGE MODE)`;
            }
            if (verify) {
                condition += ` AND verify_status = ${sanitize(verify)}`;
            }
            if (mode) {
                condition += ` AND delivery_mode = ${sanitize(mode)}`;
            }
            let sql = find(TABLES.TRAINERS.services, {
                sort: {
                    service_id: -1
                },
                limitSkip: {
                    limit: limit,
                    skip: offset
                },
                where: condition,
            })
            let count = find(TABLES.TRAINERS.services, {
                columns: 'count(*) as count',
                where: condition,
            })
            const { success, result } = await dbQuery<any[]>(`${sql}${count}`);
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

myServices.put('/:id/delete', async (ctx) => {
    const { id } = ctx.req.params;
    const { role, user_info } = ctx.auth || {};
    const userId = user_info?.user_id;
    const { images, video_url } = await ctx.req.json();

    // console.log(body)
    // if (!id) {
    //     return ctx.json({ success: false, message: "Service ID is required" });
    // }
    // try {
    //     // 2️⃣ Delete the notification
    //     const deleteSql = destroy(TABLES.TRAINERS.services, {
    //         where: `service_id = ${sanitize(id)} AND trainer_id = ${userId}`
    //     })
    //     const { success: delSuccess } = await dbQuery(deleteSql);
    //     if (delSuccess) {
    //         return ctx.json({ success: true, message: "Service deleted successfully" });
    //     } else {
    //         return ctx.json({ success: false, message: "Failed to delete service" });
    //     }
    // } catch (err) {
    return ctx.json({ success: false, message: "Internal server error" });
    // }
});

export default myServices;