import { find, sanitize } from "@tezx/sqlx/mysql";
import { Router } from "tezx";
import { dbQuery, TABLES } from "../../../../../models/index.js";

const trainerAdmin = new Router();

trainerAdmin.get("/:trainer_id/documents", async (ctx) => {
    const { trainer_id } = ctx.req.params;
    const { success, result } = await dbQuery(
        find(TABLES.USER_DOCUMENTS, {
            where: `user_id = ${sanitize(trainer_id)} AND user_type = "trainer"`,
        })
    );
    return ctx.json({ success, data: result });
});


export default trainerAdmin;