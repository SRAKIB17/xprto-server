import { sanitize } from "@dbnx/mysql";
import { Router } from "tezx";
import { paginationHandler } from "tezx/middleware/pagination";
import { db, table_schema } from "../../../models/index.js";
const documentComments = new Router();

documentComments.delete('/reactions/:comment_id', async (ctx) => {
    const comment_id = ctx.req.params?.comment_id;
    const user_id = ctx.auth?.user_info?.user_id || '';

    if (!user_id) {
        return ctx.status(404).json({
            success: false,
            message: "Please login first",
        })
    }
    if (!comment_id) {
        return ctx.status(400).json({
            success: false,
            message: "Missing comment ID.",
        });
    }

    try {
        const { success, result } = await db
            .delete(table_schema.document_comment_reactions, {
                where: db.condition({
                    user_id,
                    comment_id,
                }),
            }).update(table_schema.document_comments, {
                setCalculations: {
                    reaction_count: `GREATEST(reaction_count - 1, 0)`
                },
                where: db.condition({
                    comment_id: comment_id
                })
            })
            .executeMultiple();

        if (success) {
            return ctx.json({
                success: true,
                message: "Your reaction has been removed successfully.",
                data: result,
            });
        } else {
            return ctx.status(404).json({
                success: false,
                message: "Reaction not found or could not be deleted.",
            },);
        }

    } catch (error) {
        console.error("Error deleting reaction:", error);
        return ctx.status(500).json({
            success: false,
            message: "Internal server error while removing the reaction.",
        },);
    }
});

documentComments.post('/reactions/:comment_id', async (ctx) => {
    const comment_id = ctx.req.params?.comment_id;
    const user_id = ctx.auth?.user_info?.user_id || '';
    const body = await ctx.req.json();
    const reaction = body?.reaction || 'love'; // fallback to default
    if (!user_id) {
        return ctx.status(403).json({
            success: false,
            message: "Please login first",
        })
    }
    if (!comment_id || !user_id || !reaction) {
        return ctx.status(400).json({
            success: false,
            message: "Missing comment ID, or reaction type.",
        },);
    }

    try {
        const { success, result, error, errno } = await db.create(table_schema.document_comment_reactions, {
            user_id,
            comment_id,
            reaction,
        }).update(table_schema.document_comments, {
            setCalculations: {
                reaction_count: `reaction_count + 1`
            },
            where: db.condition({
                comment_id: comment_id
            })
        }).executeMultiple();

        if (success) {
            return ctx.json({
                success: true,
                message: "Reaction added successfully.",
                data: result,
            });
        } else {
            if (errno === 1062) {
                return ctx.status(409).json({
                    success: false,
                    message: "You already reacted to this comment.",
                },); // 409 = Conflict
            }

            return ctx.status(500).json({
                success: false,
                message: error || "Failed to add reaction.",
            },);
        }

    } catch (error) {
        console.error("Reaction error:", error);
        return ctx.status(500).json({
            success: false,
            message: "Internal server error while creating reaction.",
        },);
    }
});

documentComments.post('/:doc_id', async (ctx) => {
    const user_id = ctx.auth?.user_info?.user_id || '';
    const username = ctx?.auth?.user_info?.username || "";
    if (!user_id) {
        return ctx.status(403).json({
            success: false,
            message: "Please login first",
        })
    }
    const doc_id = Number(ctx.req.params.doc_id);
    if (!doc_id) {
        return ctx.status(400).json({ success: false, message: "Invalid document ID" });
    }

    const { parent_id = null, content } = await ctx.req.json();

    if (!content?.trim()) {
        return ctx.status(400).json({ success: false, message: "Content is required" });
    }

    try {
        if (parent_id) {
            const { success, result, error } = await db
                .create(table_schema.document_comments, {
                    user_id,
                    doc_id: doc_id,
                    parent_id,
                    content,
                }).update(table_schema.document_comments, {
                    setCalculations: {
                        reply_count: `reply_count + 1`
                    },
                    where: db.condition({ comment_id: parent_id })
                })
                .executeMultiple();
            if (!success) {
                return ctx.status(500).json({ success: false, message: "Comment failed to insert" },);
            }
            return ctx.json({ success: true, comment_id: result?.[0]?.insertId, username: username, type: parent_id ? "reply" : "comment" });
        }
        else {
            const { success, result, error } = await db
                .create(table_schema.document_comments, {
                    user_id,
                    doc_id: doc_id,
                    parent_id,
                    content,
                })
                .executeMultiple();
            if (!success) {
                return ctx.status(500).json({ success: false, message: "Comment failed to insert" },);
            };
            return ctx.json({ success: true, comment_id: result?.insertId, username: username, type: parent_id ? "reply" : "comment" });
        }
    } catch (error) {
        return ctx.status(500).json({ success: false, message: "Failed to post " + (parent_id ? "reply" : "comment") });
    }
});

documentComments.get('/:doc_id/:parent_id?', paginationHandler({
    countKey: 'count',
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
        let { result } = await db.findAll(table_schema.document_comments, {
            joins: [
                {
                    table: table_schema.user_details,
                    type: "LEFT JOIN",
                    on: "document_comments.user_id = user_details.user_id"
                },
                {
                    type: "LEFT JOIN",
                    table: table_schema.document_comment_reactions,
                    on: `document_comment_reactions.comment_id = document_comments.comment_id AND document_comment_reactions.user_id = ${sanitize(user_id)}`
                }
            ],
            columns: {
                extra: [
                    ...(user_id ? [
                        `CASE WHEN document_comment_reactions.user_id = ${sanitize(user_id)} THEN TRUE ELSE FALSE END as is_react`,
                    ] : []),
                ],
                document_comments: ['*'],
                user_details: ['username', 'fullname', 'status', 'avatar_url', 'updated_at as _updated_at']
            },
            sort: { "document_comments.created_at": -1 },
            where: condition,
            limitSkip: {
                limit: pagination.limit,
                skip: pagination.offset
            }
        }).findOne(table_schema.document_comments, {
            where: condition,
            columns: ['count(*) as count'],
        }).executeMultiple();

        return {
            data: result?.[0] || [],
            count: result?.[1]?.[0]?.count || 0
        }
    }
}), async (ctx) => {
    return ctx.json(ctx.body);
})


documentComments.put('/delete/:comment_id', async (ctx) => {
    const comment_id = Number(ctx.req.params?.comment_id);
    const user_id = ctx.auth?.user_info?.user_id || '';

    let { parent_id, reply_count, doc_id } = await ctx.req.json();

    if (!user_id) {
        return ctx.status(401).json({ success: false, message: "Unauthorized" },);
    }

    if (!comment_id) {
        return ctx.status(400).json({ success: false, message: "Invalid comment ID" },);
    }

    try {
        let ex = db
            .delete(table_schema.document_comments, {
                where: db.condition({ user_id, comment_id })
            });
        if (parent_id) {
            ex = ex.update(table_schema.document_comments, {
                setCalculations: {
                    reply_count: `GREATEST(reply_count - 1, 0)`
                },
                where: db.condition({ user_id, comment_id: parent_id })
            });
        }

        let { success, error, } = await ex.executeMultiple();


        if (!success) {
            return ctx.status(500).json({ success: false, message: error || "Failed to delete comment" },);
        }
        return ctx.json({ success: true, message: "Comment deleted successfully" });
    } catch (err: any) {
        console.error("Comment delete error:", err);
        return ctx.status(500).json({ success: false, message: "Something went wrong" },);
    }
});

documentComments.put('/update/:comment_id', async (ctx) => {
    const user_id = ctx.auth?.user_info?.user_id || '';
    const username = ctx?.auth?.user_info?.username || "";
    if (!user_id) {
        return ctx.status(401).json({ success: false, message: "Unauthorized" },);
    }

    const comment_id = Number(ctx.req.params.comment_id);
    if (!comment_id) {
        return ctx.status(400).json({ success: false, message: "Invalid comment ID" },);
    }

    const { content } = await ctx.req.json();

    if (!content?.trim()) {
        return ctx.status(400).json({ success: false, message: "Content is required" },);
    }
    try {
        const { success, result, error } = await db
            .update(table_schema.document_comments, {
                values: {
                    content,
                },
                where: db.condition({ user_id, comment_id })
            })
            .executeMultiple();
        if (!success) {
            return ctx.status(500).json({ success: false, message: "Comment failed to update" },);
        }
        return ctx.json({ success: true, comment_id: result?.[0]?.insertId, username: username, });
    } catch (error) {
        return ctx.status(500).json({ success: false, message: "Failed to reply comment" },);
    }
});


export { documentComments };
