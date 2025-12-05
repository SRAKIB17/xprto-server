import { find } from "@tezx/sqlx/mysql";
import { Router } from "tezx";
import { dbQuery, TABLES } from "../../../../../models/index.js";

const adminList = new Router();
adminList.get('/', async (ctx) => {
    const sql = find(`${TABLES.ADMIN.admin} as us`, {
        joins: `
           LEFT JOIN ${TABLES.ADMIN.ROLE_PERMISSIONS} as r ON r.admin_id = us.admin_id
                           LEFT JOIN ${TABLES.ADMIN.PERMISSIONS} as p ON p.permission_id = r.permission_id           
         `,
        columns: `
                    us.*, 
                JSON_ARRAYAGG(
                    JSON_OBJECT(
                        'permission_id', p.permission_id,
                        'permission_key', p.permission_key,
                        'can_view', r.can_view,
                        'can_create', r.can_create,
                        'can_update', r.can_update,
                        'can_delete', r.can_update
                    )
                ) AS permissions
                        `,
        groupBy: 'us.admin_id',
    });

    return ctx.json(await dbQuery(sql))
})

export default adminList;