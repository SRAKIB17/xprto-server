import { Router } from "tezx";
import { paginationHandler } from "tezx/middleware/pagination";
import { db, table_schema } from "../../../../models/index.js";

// document flagged
const contactRequest = new Router();
// // CREATE TABLE
// // doc_categories(
// //     cat_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
// //     category VARCHAR(255) UNIQUE NOT NULL,
// //     slug VARCHAR(250) UNIQUE NOT NULL,
// //     description TEXT,
// //     category_thumbnail TEXT DEFAULT NULL, --Optional: URL for category icon
// //         parent_id INT UNSIGNED DEFAULT NULL, --For nested categories / subcategories
// //         created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
// //     updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
// //         FOREIGN KEY(parent_id) REFERENCES doc_categories(cat_id) ON DELETE SET NULL
// //     );

// flagged.post("/", async (ctx) => {
//     const {
//         category,
//         cat_slug,
//         parent_id = null,
//         category_thumbnail = null,
//         description = null,
//     } = await ctx.req.json();

//     if (!category) {
//         return ctx.send({ success: false, message: "Category name is required" }, 400);
//     }

//     const { success, result, error } = await db.create(table_schema.doc_categories, {
//         category,
//         description,
//         parent_id,
//         slug: cat_slug ? cat_slug?.trim() : slug(category),
//         category_thumbnail
//     }).execute();
//     if (!success) {
//         return ctx.send({ success: false, message: "Failed to create category" }, 500);
//     }

//     return ctx.send({ success: true, message: "Category created", insertId: result?.insertId });
// });

// flagged.put("/:cat_id", async (ctx) => {
//     const cat_id = ctx.req.params.cat_id;
//     const {
//         category,
//         cat_slug,
//         parent_id = null,
//         category_thumbnail = null,
//         description = null,
//     } = await ctx.req.json();

//     if (!category) {
//         return ctx.send({ success: false, message: "Category name is required" }, 400);
//     }

//     const { success, result, error } = await db.update(table_schema.doc_categories, {
//         values: {
//             category,
//             description,
//             parent_id,
//             slug: cat_slug ? cat_slug?.trim() : slug(category),
//             category_thumbnail
//         },
//         where: db.condition({ cat_id }),
//     }).execute();;

//     if (!success || result?.affectedRows === 0) {
//         return ctx.send({ success: false, message: "Update failed or category not found" }, 500);
//     }
//     return ctx.send({ success: true, message: "Category updated" });
// });


contactRequest.get('/',
    paginationHandler({
        countKey: 'limit',
        maxLimit: 10,
        dataKey: 'data',
        getDataSource: async (ctx, pagination) => {

            let { result, error } = await db.findAll(table_schema.contact_requests, {
                joins: [
                    {
                        type: "LEFT JOIN",
                        table: table_schema.user_details,
                        on: "user_details.username = contact_requests.username"
                    },
                ],
                limitSkip: {
                    limit: pagination.limit,
                    skip: pagination.offset
                },
                sort: {
                    "contact_requests.id": -1
                },
                columns: {
                    contact_requests: ["*"],
                    user_details: ["account_type", "avatar_url", "fullname", "username"]
                }
            }).findOne(table_schema.contact_requests, {
                joins: [
                    {
                        type: "LEFT JOIN",
                        table: table_schema.user_details,
                        on: "user_details.username = contact_requests.username"
                    },
                ],
                aggregates: [
                    {
                        COUNT: 'contact_requests.id',
                        alias: 'count',
                    }
                ],
            }).executeMultiple();

            return {
                data: result?.[0] || [],
                limit: result?.[1]?.[0]?.count || 0
            }
        }
    }), async (ctx) => {
        return ctx.json(ctx.body);
    })


contactRequest.get('/:slug',
    async (ctx) => {
        let { slug } = ctx.req.params;
        let { result, error } = await db.findAll(table_schema.documents, {
            joins: [
                {
                    table: table_schema.document_flags,
                    on: "documents.doc_id = document_flags.doc_id"
                },
                {
                    table: table_schema.doc_uploaded_files,
                    on: "documents.doc_id = doc_uploaded_files.doc_id"
                },
            ],
            where: db.condition({ "documents.slug": slug }),
            columns: {
                documents: [
                    "title",
                    "slug",
                    "doc_id",
                ],
                document_flags: ["*"],
                doc_uploaded_files: ["thumbnail"]
            },
        }).execute();
        console.log(slug)
        return ctx.json(result);
    })

// flagged.get("/:cat_id", async (ctx) => {
//     const cat_id = ctx.req.params.cat_id;

//     const { success, result, error } = await db.delete(table_schema.doc_categories, {
//         where: db.condition({ cat_id }),
//     }).execute();

//     if (!success || result?.affectedRows === 0) {
//         return ctx.send({ success: false, message: "Delete failed or category not found" }, 500);
//     }

//     return ctx.send({ success: true, message: "Category deleted" });
// });
export { contactRequest };
