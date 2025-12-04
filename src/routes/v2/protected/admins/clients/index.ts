import { find, sanitize } from "@tezx/sqlx/mysql";
import { Router } from "tezx";
import { dbQuery, TABLES } from "../../../../../models/index.js";

const clientAdmin = new Router();

clientAdmin.get("/:client_id/documents", async (ctx) => {
    const { client_id } = ctx.req.params;
    const { success, result } = await dbQuery(
        find(TABLES.USER_DOCUMENTS, {
            where: `user_id = ${sanitize(client_id)} AND user_type = "client"`,
        })
    );
    return ctx.json({ success, data: result });
});


export default clientAdmin;