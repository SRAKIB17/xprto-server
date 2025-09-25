import { Router } from "tezx";
import { db, table_schema } from "../../../models/index.js";

const license = new Router();

// 🔸 CREATE a new license
license.post("/", async (ctx) => {

    const {
        license_name,
        description = null,
        url = null
    } = await ctx.req.json();

    if (!license_name) {
        return ctx.status(400).send({ success: false, message: "License name is required" },);
    }

    const { success, result, error } = await db.create(table_schema.doc_licenses, {
        license_name,
        description,
        url,
    }).execute();
    if (!success) {
        return ctx.status(500).send({ success: false, message: "Failed to create license" });
    }

    return ctx.send({ success: true, message: "License created", insertId: result?.insertId });
});

// 🔸 UPDATE license
license.put("/:license_id", async (ctx) => {
    const license_id = ctx.req.params.license_id;
    const {
        license_name,
        description = null,
        url = null
    } = await ctx.req.json();

    if (!license_name) {
        return ctx.status(400).send({ success: false, message: "License name is required" },);
    }

    const { success, result, error } = await db.update(table_schema.doc_licenses, {
        values: {
            license_name,
            description,
            url,
        },
        where: db.condition({ license_id }),
    }).execute();;

    if (!success || result?.affectedRows === 0) {
        return ctx.status(500).send({ success: false, message: "Update failed or license not found" });
    }
    return ctx.send({ success: true, message: "License updated" });
});

// 🔸 DELETE license
license.delete("/:license_id", async (ctx) => {
    const license_id = ctx.req.params.license_id;

    const { success, result, error } = await db.delete(table_schema.doc_licenses, {
        where: db.condition({ license_id }),
    }).execute();

    if (!success || result?.affectedRows === 0) {
        return ctx.status(500).send({ success: false, message: "Delete failed or license not found" });
    }

    return ctx.send({ success: true, message: "License deleted" });
});

export { license };
