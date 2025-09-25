import { Router } from "tezx";
import { category } from "./category.js";
import { flagged } from "./flagged.js";
import { db, table_schema } from "../../../../models/index.js";
import path from "node:path";
import { existsSync, unlinkSync } from "node:fs";
import { paginationHandler } from "tezx/middleware/pagination";
import { sanitize, SortType } from "@dbnx/mysql";
// console.log(version)

const documents = new Router()
documents.addRouter('/category', category);
documents.addRouter('/flagged', flagged);

// v1.addRouter('/documents', documents)
// v1.addRouter('/auth', auth);
// v1.addRouter('/users', users);
documents.get('/',
    paginationHandler({
        countKey: 'count',
        queryKeyLimit: 'limit',
        maxLimit: 16,
        getDataSource: async (ctx, pagination) => {
            // console.log(ctx.auth, 4353)
            // query: show=randomly
            let user_id = ctx.auth?.user_info?.user_id || '';
            // ! FOR 
            let { type, categories, _q, visibility, username, cat_slug, module, sort } = ctx.req.query;

            let condition: any = {
                $and: {
                    'doc_uploaded_files.visibility': ['PUBLIC', 'PRIVATE', 'UNLISTED', 'RESTRICTED'],
                },
            };

            if (username) {
                condition.$and['user_details.username'] = username;
            }


            if (type) {
                condition.$and['documents.type'] = type;
            }

            if (cat_slug) {
                condition.$and['doc_categories.slug'] = cat_slug;
            }
            if (!cat_slug && categories) {
                condition.$and.category = categories?.split(",");
            }
            if (_q) {
                condition["$or"] = {
                    'doc_categories.category': { like: `%${_q}%` },
                    'user_details.username': { like: `%${_q}%` },
                    'documents.title': { like: `%${_q}%` },
                    'documents.summary': { like: `%${_q}%` },
                    'documents.lang': { like: `%${_q}%` },
                    'documents.type': { like: `%${_q}%` }, // optional - ENUM
                    'doc_uploaded_files.visibility': { like: `%${_q}%` }, // optional - ENUM
                    'doc_uploaded_files.original_name': { like: `%${_q}%` }, // optional - ENUM
                    'documents.tags': { like: `%${_q}%` }  // JSON field
                }
            }
            let where = db.condition({ ...condition });
            let sorting: SortType<['documents']> = {
                documents: {
                    created_at: -1
                }
            };
            switch (sort) {
                case 'a-to-z':
                    sorting.documents = {
                        title: 1
                    }
                    break;

                case 'z-to-a':
                    sorting.documents = {
                        title: -1
                    }
                    break;
                case 'last-paper-added':
                    sorting.documents = {
                        created_at: -1
                    };
                    break;
                default:
                    break;
            }
            let recommendationFollowing = !!(user_id && module == 'recommended')
            if (recommendationFollowing) {
                sorting.documents = {
                    created_at: -1
                }
            }
            let { result, error } = await db.findAll(table_schema.documents, {
                joins: [
                    // {
                    //     table: `(SELECT doc_id, SUM(view_count) AS view_count FROM ${table_schema.document_views} GROUP BY doc_id) AS document_views`, // Subquery for views
                    //     type: "LEFT JOIN",
                    //     on: 'documents.doc_id = document_views.doc_id'
                    // },
                    // {
                    //     table: table_schema.document_reactions,
                    //     type: "LEFT JOIN",
                    //     on: 'documents.doc_id = document_reactions.doc_id'
                    // },

                    {
                        table: table_schema.doc_categories,
                        type: "LEFT JOIN",
                        on: 'doc_categories.cat_id = documents.cat_id'
                    },
                    {
                        table: table_schema.doc_licenses,
                        type: "LEFT JOIN",
                        on: 'doc_licenses.license_id = documents.license_id'
                    },
                    {
                        table: table_schema.user_details,
                        type: "LEFT JOIN",
                        on: 'user_details.user_id = documents.user_id'
                    },
                    ...(
                        recommendationFollowing
                            ? [{
                                table: table_schema.user_follows,
                                type: "INNER JOIN",
                                on: `user_follows.following_id = user_details.user_id AND user_follows.follower_id = ${sanitize(user_id)}`
                            }]
                            : []
                    ),
                    {
                        table: table_schema.doc_uploaded_files,
                        type: "LEFT JOIN",
                        on: 'documents.doc_id = doc_uploaded_files.doc_id'
                    },
                    {
                        table: table_schema.document_bookmarks,
                        type: 'LEFT JOIN',
                        on: 'documents.doc_id = document_bookmarks.doc_id'
                    }
                ],
                columns: {
                    documents: [
                        "doc_id",
                        "cat_id",
                        "type",
                        "license_id",
                        "title",
                        "slug",
                        "user_id",
                        'view_count',
                        'reaction_count',
                        "tags",
                        "created_at",
                        "updated_at"
                    ],
                    extra: [
                        ...(user_id ? [
                            `CASE WHEN document_bookmarks.user_id = ${sanitize(user_id)} THEN TRUE ELSE FALSE END as is_bookmark`,
                        ] : []),

                        // 'COALESCE(document_views.view_count, 0) AS view_count',// Getting the sum of views from subquery
                        // 'COUNT(DISTINCT CASE WHEN document_reactions.reaction IS NOT NULL THEN document_reactions.reaction_id END) AS reaction_count', // Count of reactions
                    ],
                    doc_categories: ['slug as cat_slug', 'category', 'category_thumbnail'],
                    doc_licenses: ['license_name'],
                    user_details: ['fullname', 'username', 'blue_tick', 'avatar_url'],
                    doc_uploaded_files: ['pages', 'visibility', 'thumbnail'],
                },
                where: where,
                sort: sorting,
                groupBy: ['doc_id', 'document_bookmarks.user_id', "doc_uploaded_files.pages", "doc_uploaded_files.visibility", "doc_uploaded_files.thumbnail"],
                limitSkip: {
                    limit: pagination.limit,
                    skip: pagination.offset
                }
            }).findAll(table_schema.documents, {
                joins: [
                    {
                        table: table_schema.doc_categories,
                        type: "LEFT JOIN",
                        on: 'doc_categories.cat_id = documents.cat_id'
                    },
                    {
                        table: table_schema.doc_licenses,
                        type: "LEFT JOIN",
                        on: 'doc_licenses.license_id = documents.license_id'
                    },
                    {
                        table: table_schema.user_details,
                        type: "LEFT JOIN",
                        on: 'user_details.user_id = documents.user_id'
                    },
                    {
                        table: table_schema.doc_uploaded_files,
                        type: "LEFT JOIN",
                        on: 'documents.doc_id = doc_uploaded_files.doc_id'
                    },
                    {
                        table: table_schema.document_bookmarks,
                        type: 'LEFT JOIN',
                        on: 'documents.doc_id = document_bookmarks.doc_id'
                    }
                ],
                where: where,
                aggregates: [{ alias: 'count', COUNT: "*" }],
            }).executeMultiple();
            return {
                data: result?.[0] || [],
                count: result?.[1]?.[0]?.count || 0
            }
        }
    }), (ctx) => {
        return ctx.json(ctx.body);
    }
);


documents.delete('/:slug', async (ctx) => {
    const { slug } = ctx.req.params;


    // 1. Find the document and verify ownership
    const docRes = await db.findOne(table_schema.documents, {
        joins: [
            {
                table: table_schema.doc_uploaded_files,
                type: "LEFT JOIN",
                on: 'documents.doc_id = doc_uploaded_files.doc_id'
            }
        ],
        columns: [
            'documents.user_id',
            'documents.view_count',
            'documents.reaction_count',
            'documents.doc_id',
            'doc_uploaded_files.storage_path',
            'doc_uploaded_files.filename',
            'doc_uploaded_files.file_type',
            'doc_uploaded_files.thumbnail',
        ],
        where: db.condition({ 'documents.slug': slug }),
    }).execute();


    if (!docRes?.result?.length) {
        return ctx.status(404).json({ success: false, message: "Document not found" },);
    }
    const doc = docRes.result[0];
    const user_id = doc.user_id || '';

    // 2. Delete the document from the DB
    const { success } = await db.delete(table_schema.documents, {
        where: db.condition({ doc_id: Number(slug) }),
    }).update(table_schema.user_details, {
        where: db.condition({ user_id: user_id }),
        setCalculations: {
            reaction_count: `GREATEST(reaction_count - ${doc?.reaction_count}, 0)`,
            paper_views: `GREATEST(paper_views - ${doc?.view_count}, 0)`
        }
    }).executeMultiple();

    if (!success) {
        return ctx.status(500).json({ success: false, message: "Failed to delete document." },);
    }

    // 3. Attempt file cleanup
    const dir = path.resolve('uploads/documents', doc.file_type);
    const originalFile = path.join(dir, doc.filename);
    const convertedPdf = path.join(dir, 'converted', `${path.parse(doc.filename).name}.pdf`);

    try {
        if (existsSync(originalFile)) await unlinkSync(originalFile);
        let thumbnail = path.join(process.cwd(), "uploads", doc.thumbnail);
        if (existsSync(thumbnail)) unlinkSync(thumbnail);
    } catch (err: any) {
        console.warn("Failed to delete original file:", err.message);
    }

    try {
        if (doc.file_type !== 'pdf' && existsSync(convertedPdf)) {
            await unlinkSync(convertedPdf);
        }
    } catch (err: any) {
        console.warn("Failed to delete converted PDF:", err.message);
    }

    return ctx.status(400).json({ success: true, message: "Document deleted." });
});
export { documents };
