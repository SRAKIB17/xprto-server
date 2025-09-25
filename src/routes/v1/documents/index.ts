import { find, mysql_date, sanitize, SortType } from "@dbnx/mysql";
import { Router } from "tezx";
import { paginationHandler } from "tezx/middleware/pagination";
import { db, table_schema } from "../../../models/index.js";
import { AuthorizationMiddlewarePublic } from "../auth/basicAuth.js";
import { documentComments } from "./comments.js";
import { manipulateDoc } from "./manipulate.js";
import { documentReactions } from "./reactions.js";

const documents = new Router();

// documents.use(rateLimiter({
//     onError: (c, r, err) => {
//         return err.message as any
//     },
//     maxRequests: 1,
//     windowMs: 10_000,
// }))
documents.use(AuthorizationMiddlewarePublic())
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
                    'doc_uploaded_files.visibility': "PUBLIC",
                },
            };

            if (module == 'bookmark' && user_id) {
                condition.$and['document_bookmarks.user_id'] = user_id;
            }
            else {
                if (visibility && ['user', "private"].includes(visibility?.toLowerCase()) && user_id) {
                    condition.$and['documents.user_id'] = user_id;
                    condition.$and['doc_uploaded_files.visibility'] = ['PUBLIC', 'PRIVATE', 'UNLISTED', 'RESTRICTED'];
                }
                if ((!visibility || visibility?.toLowerCase() == 'public') && username) {
                    condition.$and['user_details.username'] = username;
                }
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
            console.log(error, user_id)
            return {
                data: result?.[0] || [],
                count: result?.[1]?.[0]?.count || 0
            }
        }
    }), (ctx) => {
        return ctx.json(ctx.body);
    }
);
documents.get("/licenses", async (ctx) => {
    let { result } = await db.findAll(table_schema.doc_licenses, {
        columns: [
            "license_id",
            "license_name",
            "description",
            "url"
        ]
    }).execute();
    return ctx.json(result);
})
documents.get("/category", async (ctx) => {
    let { all } = ctx.req.query;
    let { result } = await db.findAll(table_schema.doc_categories, {
        where: all ? "" : 'parent_id IS NULL',
        columns: [
            "cat_id",
            "category",
            "slug as cat_slug",
            "category_thumbnail",
            "parent_id",
        ]
    }).execute();

    return ctx.json(result)
})
documents.get("/category/:cat_slug", async (ctx) => {
    let cat_slug = ctx.req.params?.cat_slug;
    let { result } = await db.findAll(table_schema.doc_categories, {
        where: `slug = ${sanitize(cat_slug)}`,
        columns: [
            "cat_id",
            "category",
            "slug as cat_slug",
            "category_thumbnail",
            "parent_id",
        ]
    }).execute();

    return ctx.json(result?.[0])
})

documents.get('/:slug', async (ctx) => {
    const slug = ctx.req.params?.slug
    let user_id = ctx.auth?.user_info?.user_id || '';
    // let user_id = ctx.auth?.user_info?.user_id || '';
    // // ! FOR 
    let { visibility } = ctx.req.query;

    let condition: any = {
        $and: {
            "documents.slug": slug,
            'doc_uploaded_files.visibility': "PUBLIC",
        },

    };

    if (visibility && ['user', "private"].includes(visibility?.toLowerCase()) && user_id) {
        condition.$and['documents.user_id'] = user_id;
        condition.$and['doc_uploaded_files.visibility'] = ['PUBLIC', 'PRIVATE', 'UNLISTED', 'RESTRICTED'];
    }

    if (user_id) {
        condition = {
            ...condition,
            $or: {
                $and: {
                    'documents.slug': slug,
                    'documents.user_id': user_id,
                    "doc_uploaded_files.visibility": ['PUBLIC', 'PRIVATE', 'UNLISTED', 'RESTRICTED']
                }
            }
        }
    }

    let where = `${db.condition(condition, 'OR')}`;

    let { result, error, success } = await db.findAll(table_schema.documents, {
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
            // !new code
            {
                table: table_schema.document_comments,
                type: "LEFT JOIN",
                on: 'documents.doc_id = document_comments.doc_id'
            },
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
        columns: {
            doc_uploaded_files: [
                ...(user_id ? ['visibility', 'file_id'] : []),
                "file_size",
                "pages",
                "original_name",
                'thumbnail',
                "hash_sha256"
            ],
            doc_categories: ['slug as cat_slug', 'category', 'category_thumbnail'],
            doc_licenses: ['license_name'],
            user_details: ['fullname', 'username', 'blue_tick', 'avatar_url'],
            documents: ["*"],
            extra: [
                ...(user_id ? [
                    `(SELECT COUNT(*) FROM ${table_schema.user_follows} WHERE following_id = user_details.user_id AND follower_id = ${sanitize(user_id)}) as is_following`,
                    `CASE WHEN document_bookmarks.user_id = ${sanitize(user_id)} THEN TRUE  ELSE FALSE END as is_bookmark`,
                    `EXISTS(SELECT user_id FROM ${table_schema.document_reactions} WHERE user_id = ${sanitize(user_id)} AND doc_id = documents.doc_id) as is_react`,
                ] : []),
                // 'COALESCE(document_views.view_count, 0) AS view_count',// Getting the sum of views from subquery
                // 'COUNT(DISTINCT CASE WHEN document_reactions.reaction IS NOT NULL THEN document_reactions.reaction_id END) AS reaction_count', // Count of reactions
                'COUNT(DISTINCT CASE WHEN document_comments.comment_id IS NOT NULL THEN document_comments.comment_id END) AS comment_count', // Count of reactions
            ],
        },
        groupBy: [
            'doc_id',
            'document_bookmarks.user_id',
            "doc_uploaded_files.file_size",
            "doc_uploaded_files.pages",
            "doc_uploaded_files.original_name",
            "doc_uploaded_files.thumbnail",
            "doc_uploaded_files.visibility",
            "doc_uploaded_files.file_id",
            "doc_uploaded_files.hash_sha256",
        ],
        where: where
    })
        .findOne(table_schema.document_views, {
            joins: [
                {
                    table: table_schema.documents,
                    on: 'documents.doc_id = document_views.doc_id'
                }
            ],
            // setCalculations: {
            //     "document_views.view_count": `document_views.view_count + 1`
            // },
            where: db.condition({ "documents.slug": slug, "document_views.view_date": mysql_date() })
        }).executeMultiple();

    let doc = result?.[0]?.[0];
    if (!doc?.doc_id) {
        return ctx.json({ success: false, data: {} });
    }
    const view_count = result?.[1]?.[0];
    // const view_count = result?.[1];

    let sql = db.update(table_schema.documents, {
        values: {
            view_count: doc?.view_count + 1
        },
        where: db.condition({ slug: slug })
    }).update(table_schema.user_details, {
        setCalculations: {
            paper_views: `1 + paper_views`
        },
        where: db.condition({
            user_id: doc?.user_id
        })
    });
    if (!view_count?.doc_id) {
        sql = sql.create(table_schema.document_views, {
            doc_id: doc?.doc_id,
            view_count: 1 as any,
            view_date: mysql_date()
        })
    }
    else {
        sql = sql.update(table_schema.document_views, {
            values: {
                view_count: view_count?.view_count + 1
            },
            where: db.condition({ doc_id: doc?.doc_id, view_date: mysql_date() })
        })
    }
    await sql.executeMultiple();
    return await ctx.json({ success: success, data: doc || {} })
});

// const filePath = path.join(tempDir, `my-temp-${Date.now()}.txt`);

documents.get('/paper-of-the-day', async (ctx) => {
    let user_id = ctx.auth?.user_info?.user_id || ''

    let r = db.findOne(table_schema.document_views, {
        joins: [

            {
                table: table_schema.documents,
                type: 'LEFT JOIN',
                on: 'document_views.doc_id = documents.doc_id'
            },
            {
                table: table_schema.doc_uploaded_files,
                type: "LEFT JOIN",
                on: 'documents.doc_id = doc_uploaded_files.doc_id'
            },
            // {
            //     table: `(SELECT doc_id, SUM(view_count) AS view_count FROM ${table_schema.document_views} GROUP BY doc_id) AS document_total_views`, // Subquery for views
            //     type: "LEFT JOIN",
            //     on: 'documents.doc_id = document_total_views.doc_id'
            // },
            {
                table: table_schema.user_details,
                type: 'LEFT JOIN',
                on: 'documents.user_id = user_details.user_id'
            },
            {
                table: table_schema.document_bookmarks,
                type: 'LEFT JOIN',
                on: 'documents.doc_id = document_bookmarks.doc_id'
            }
        ],
        columns: {
            user_details: ['fullname', 'username', 'blue_tick', 'avatar_url'],
            doc_uploaded_files: ['pages', 'thumbnail'],
            documents: [
                "doc_id",
                "cat_id",
                "lang",
                'view_count',
                "type",
                "license_id",
                "title",
                "slug",
                "user_id",
                "tags",
                "can_download",
                "can_comment",
                "can_embed",
                "can_share",
                "created_at",
                "updated_at",
                "view_count",
            ],
            extra: [
                ...(user_id ? [
                    `CASE WHEN document_bookmarks.user_id = ${sanitize(user_id)} THEN TRUE  ELSE FALSE END as is_bookmark`,
                ] : []),
                // 'COALESCE(document_total_views.view_count, 0) AS view_count',// Getting the sum of views from subquery
            ]
        },
        // groupBy: ['documents.doc_id',],
        sort: {
            view_count: -1
        },
        where: `view_date = '2025-04-25'`
        // where: `view_date = CURDATE()`

    });
    // console.log(r.build())/
    let { error, result } = await r.execute();
    ctx.setHeader('Cache-Control', 'public, max-age=86400');  // 86400 seconds = 1 day
    return ctx.json(result?.[0] || {})
})


documents.use(manipulateDoc);
documents.use('/comments', documentComments);
documents.use('/reactions', documentReactions);
export default documents;
