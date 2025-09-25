import { Router } from "tezx";
import { db, table_schema } from "../../../../models/index.js";
import { slug } from "../../../../utils/documents.js";

const category = new Router();
// CREATE TABLE
// doc_categories(
//     cat_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
//     category VARCHAR(255) UNIQUE NOT NULL,
//     slug VARCHAR(250) UNIQUE NOT NULL,
//     description TEXT,
//     category_thumbnail TEXT DEFAULT NULL, --Optional: URL for category icon
//         parent_id INT UNSIGNED DEFAULT NULL, --For nested categories / subcategories
//         created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
//     updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
//         FOREIGN KEY(parent_id) REFERENCES doc_categories(cat_id) ON DELETE SET NULL
//     );

category.post("/", async (ctx) => {
    const {
        category,
        cat_slug,
        parent_id = null,
        category_thumbnail = null,
        description = null,
    } = await ctx.req.json();

    if (!category) {
        return ctx.status(500).send({ success: false, message: "Category name is required" });
    }

    const { success, result, error } = await db.create(table_schema.doc_categories, {
        category,
        description,
        parent_id,
        slug: cat_slug ? cat_slug?.trim() : slug(category),
        category_thumbnail
    }).execute();
    if (!success) {
        return ctx.status(500).send({ success: false, message: "Failed to create category" });
    }

    return ctx.send({ success: true, message: "Category created", insertId: result?.insertId });
});

category.put("/:cat_id", async (ctx) => {
    const cat_id = ctx.req.params.cat_id;
    const {
        category,
        cat_slug,
        parent_id = null,
        category_thumbnail = null,
        description = null,
    } = await ctx.req.json();

    if (!category) {
        return ctx.status(400).send({ success: false, message: "Category name is required" });
    }

    const { success, result, error } = await db.update(table_schema.doc_categories, {
        values: {
            category,
            description,
            parent_id,
            slug: cat_slug ? cat_slug?.trim() : slug(category),
            category_thumbnail
        },
        where: db.condition({ cat_id }),
    }).execute();;

    if (!success || result?.affectedRows === 0) {
        return ctx.status(500).send({ success: false, message: "Update failed or category not found" });
    }
    return ctx.send({ success: true, message: "Category updated" });
});

// 🔸 DELETE category
category.delete("/:cat_id", async (ctx) => {
    const cat_id = ctx.req.params.cat_id;

    const { success, result, error } = await db.delete(table_schema.doc_categories, {
        where: db.condition({ cat_id }),
    }).execute();

    if (!success || result?.affectedRows === 0) {
        return ctx.status(500).send({ success: false, message: "Delete failed or category not found" });
    }

    return ctx.send({ success: true, message: "Category deleted" });
});

export { category };
