import { sanitize } from "@dbnx/mysql";
import { Router } from "tezx";
import { paginationHandler } from "tezx/middleware/pagination";
import { db, table_schema } from "../../../models/index.js";
import { AuthorizationMiddlewarePublic } from "../auth/basicAuth.js";

const users = new Router();

users.use(AuthorizationMiddlewarePublic())

users.get('/count', async (ctx) => {
    let { result } = await db.findOne(table_schema.user_details, {
        columns: ['COUNT(*) AS total_users'],
        where: 'status = "active" AND is_access_public = 1',
    }).execute();
    return ctx.json({
        success: true,
        message: 'Total users fetched successfully',
        count: result?.[0]?.total_users || 0
    });
})

users.get('/:username', async (ctx) => {
    let u = (ctx.req.params.username)?.toLowerCase();
    let user_id = ctx.auth?.user_info?.user_id || '';

    let username = u.indexOf('@') == 0 ? u.split('@')[1] : u;
    if (!username) {
        return ctx.json({ success: false, message: 'Username is required' });
    }
    let { result, error } = await db.findOne(table_schema.user_details, {
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
            {
                type: 'LEFT JOIN',
                table: table_schema.doc_uploaded_files,
                on: "doc_uploaded_files.doc_id = documents.doc_id"
            },
        ],
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
                ...(user_id ? [`(SELECT COUNT(*) FROM ${table_schema.user_follows} WHERE following_id = user_details.user_id AND follower_id = ${sanitize(user_id)}) as is_following`] : []),
                // 'COUNT(DISTINCT CASE WHEN user_follows.follower_id = user_details.user_id THEN user_follows.following_id END) AS total_following',
                // 'COUNT(DISTINCT CASE WHEN user_follows.following_id = user_details.user_id THEN user_follows.follower_id END) AS total_followers',
                // Subquery for total paper views for all the user's documents
                // `(SELECT SUM(view_count) FROM ${table_schema.documents} WHERE user_id = user_details.user_id) AS paper_views`,
                // Subquery for total reactions for all the user's documents
                // `(SELECT SUM(reaction_count) FROM ${table_schema.documents} WHERE user_id = user_details.user_id) AS reaction_count`,
                `COUNT(DISTINCT CASE WHEN doc_uploaded_files.visibility = 'PUBLIC' THEN documents.doc_id END) AS total_papers`, // Count total papers by user
                `CONCAT(DAY(registered_at), ', ', MONTHNAME(registered_at), ', ', YEAR(registered_at)) AS joined`, // Format the join date,
            ]
        },
        groupBy: ['user_details.user_id',], // Group by user_id to get user-level data
        where: `username = ${sanitize(username)}`,  // Ensure username is properly sanitized
    }).execute();
    if (result.length === 0) {
        return ctx.json({ success: false, message: 'User not found' });
    }
    else {
        let user = result[0];
        if (user?.status !== 'active') {
            return ctx.json({
                success: false,
                message: 'User account is not active',
            });
        }
        else if (user?.is_access_public || !!user_id) {
            return ctx.json({
                success: true, message: 'User found', data: user
            });
        }
        else {
            return ctx.json({
                success: false,
                redirect: true,
                is_access_public: user?.is_access_public,
                message: 'User profile is private',
            })
        }
    }
})


export default users;