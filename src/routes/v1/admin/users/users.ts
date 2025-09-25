import { Router } from "tezx";
import { paginationHandler } from "tezx/middleware/pagination";
import { db, table_schema } from "../../../../models/index.js";

// document flagged
const users = new Router();
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


users.get('/',
    paginationHandler({
        countKey: 'limit',
        maxLimit: 10,
        dataKey: 'data',
        getDataSource: async (ctx, pagination) => {

            let { doc_id, parent_id } = ctx.req.params;
            const user_id = ctx.auth?.user_info?.user_id || '';
            let condition = db.condition({
                doc_id,
                parent_id: parent_id ? parent_id : {
                    isNull: true
                }
            });

            let { result, error } = await db.findAll(table_schema.user_details, {
                joins: [
                    // {
                    //     type: 'LEFT JOIN',
                    //     table: table_schema.user_follows,
                    //     on: 'user_details.user_id = user_follows.follower_id OR user_details.user_id = user_follows.following_id'
                    // },
                    {
                        type: 'LEFT JOIN',
                        table: table_schema.documents,
                        on: 'user_details.user_id = documents.user_id'
                    },
                ],
                limitSkip: {
                    limit: pagination.limit,
                    skip: pagination.offset
                },
                columns: {
                    user_details: [
                        "login_type",
                        "email_verified",
                        "account_type",
                        "verified_as",
                        "interest",
                        "user_id",
                        "fullname",
                        "username",
                        'blue_tick',
                        "status",
                        "avatar_url",
                        "college",
                        "department",
                        "instagram",
                        "twitter",
                        "github",
                        "company",
                        "job_role",
                        "linkedin",
                        "discord",
                        "bio",
                        "is_access_public",
                        "medium",
                        "total_followers",
                        "total_following",
                        "paper_views",
                        "reaction_count",
                        "registered_at",
                        "updated_at",
                    ],
                    extra: [
                        // 'COUNT(DISTINCT CASE WHEN user_follows.follower_id = user_details.user_id THEN user_follows.following_id END) AS total_following',
                        // 'COUNT(DISTINCT CASE WHEN user_follows.following_id = user_details.user_id THEN user_follows.follower_id END) AS total_followers',
                        // Subquery for total paper views for all the user's documents
                        // `(SELECT SUM(view_count) FROM ${table_schema.documents} WHERE user_id = user_details.user_id) AS paper_views`,
                        // Subquery for total reactions for all the user's documents
                        // `(SELECT SUM(reaction_count) FROM ${table_schema.documents} WHERE user_id = user_details.user_id) AS reaction_count`,
                        `COUNT(DISTINCT documents.doc_id) AS total_papers`, // Count total papers by user
                        `CONCAT(DAY(registered_at), ', ', MONTHNAME(registered_at), ', ', YEAR(registered_at)) AS joined`, // Format the join date,
                    ]
                },
                groupBy: ['user_details.user_id',], // Group by user_id to get user-level data
            }).findOne(table_schema.user_details, {
                aggregates: [
                    {
                        COUNT: 'user_id',
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


users.get('/:slug',
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
export { users };
