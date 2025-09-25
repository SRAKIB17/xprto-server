import { Router } from "tezx";
import { db, table_schema } from "../../models/index.js";
import paginationHandler from "tezx/middleware/pagination.js";
import { SortType } from "@dbnx/mysql";

const sitemap = new Router();
sitemap.get('/users/count', async (ctx) => {
    let { result } = await db.findOne(table_schema.user_details, {
        columns: ['COUNT(*) AS total_users'],
        where: 'status = "active" AND is_access_public = 1',
    }).execute();
    5
    return ctx.json({
        success: true,
        message: 'Total users fetched successfully',
        count: result?.[0]?.total_users || 0
    });
})

sitemap.get('/users', paginationHandler({
    maxLimit: 1000,
    defaultLimit: 1000,
    countKey: 'total_users',
    queryKeyLimit: 'limit',
    queryKeyPage: 'page',
    dataKey: 'users',
    getDataSource: async (ctx, pagination) => {
        let { limit, offset, page } = pagination;
        let { result, success } = (await db.findAll(table_schema.user_details, {
            columns: [
                "username",
                "updated_at",
            ],
            where: 'status = "active" AND is_access_public = 1',
            limitSkip: {
                limit: limit,
                skip: offset,
            },
            sort: 'registered_at DESC',
        }).execute());
        if (success) {
            return {
                users: result?.map((r: any) => ({ username: r?.username, updated_at: r?.updated_at })).filter(Boolean) || []
            }
        }
        return {
            users: []
        }
    },
}), async (ctx) => {
    return ctx.json(ctx.body)
})

sitemap.get('/documents/count', async (ctx) => {
    let { result } = await db.findOne(table_schema.documents, {
        joins: [
            {
                table: table_schema.doc_uploaded_files,
                type: "LEFT JOIN",
                on: 'documents.doc_id = doc_uploaded_files.doc_id'
            },
        ],
        columns: ['COUNT(*) AS total_documents'],
        where: "doc_uploaded_files.visibility = 'PUBLIC'"
    }).execute();
    return ctx.json({
        success: true,
        message: 'Total document fetched successfully',
        count: result?.[0]?.total_documents || 0
    });
})


sitemap.get('/documents',
    paginationHandler({
        maxLimit: 1000,
        defaultLimit: 1000,
        countKey: 'total_documents',
        queryKeyLimit: 'limit',
        queryKeyPage: 'page',
        dataKey: 'documents',
        getDataSource: async (ctx, pagination) => {
            // console.log(ctx.auth, 4353)
            // query: show=randomly

            let { result, error } = await db.findAll(table_schema.documents, {
                joins: [
                    {
                        table: table_schema.doc_categories,
                        type: "LEFT JOIN",
                        on: 'doc_categories.cat_id = documents.cat_id'
                    },
                    {
                        table: table_schema.doc_uploaded_files,
                        type: "LEFT JOIN",
                        on: 'documents.doc_id = doc_uploaded_files.doc_id'
                    },
                ],
                columns: {
                    documents: [
                        "slug",
                        "updated_at"
                    ],
                    doc_uploaded_files: ['thumbnail'],
                    doc_categories: ['slug as cat_slug',],
                },
                where: `doc_uploaded_files.visibility = 'PUBLIC'`,
                limitSkip: {
                    limit: pagination.limit,
                    skip: pagination.offset
                }
            }).findOne(table_schema.documents, {
                joins: [
                    {
                        table: table_schema.doc_uploaded_files,
                        type: "LEFT JOIN",
                        on: 'documents.doc_id = doc_uploaded_files.doc_id'
                    },
                ],
                columns: ['COUNT(*) AS count'],
                where: "doc_uploaded_files.visibility = 'PUBLIC'"
            }).executeMultiple();
            return {
                documents: result?.[0] || [],
                total_documents: result?.[1]?.[0]?.count || 0
            }
        }
    }), (ctx) => {
        return ctx.json(ctx.body);
    }
);

export { sitemap }