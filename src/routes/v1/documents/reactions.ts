import { Router } from "tezx";
import { db, table_schema } from "../../../models/index.js";

const documentReactions = new Router();

documentReactions.delete('/:doc_id', async (ctx) => {
    const doc_id = ctx.req.params?.doc_id;
    const user_id = ctx.auth?.user_info?.user_id || '';

    if (!user_id) {
        return ctx.status(401).json({
            success: false,
            message: "Please login to remove your reaction.",
        },);
    }
    if (!doc_id) {
        return ctx.status(400).json({
            success: false,
            message: "Missing document ID.",
        });
    }

    try {
        const { success, result } = await db
            .delete(table_schema.document_reactions, {
                where: db.condition({
                    user_id,
                    doc_id,
                }),
            }).update(table_schema.documents, {
                setCalculations: {
                    reaction_count: `GREATEST(reaction_count - 1, 0)`

                },
                where: db.condition({
                    doc_id: doc_id
                })
            }).update(table_schema.user_details, {
                joins: [
                    {
                        table: table_schema.documents,
                        on: 'documents.user_id = user_details.user_id'
                    }
                ],
                setCalculations: {
                    "user_details.reaction_count": `GREATEST(user_details.reaction_count - 1, 0)`
                },
                where: db.condition({ doc_id })
            })
            .executeMultiple();

        if (success) {
            return ctx.status(400).json({
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

documentReactions.post('/:doc_id', async (ctx) => {
    const doc_id = ctx.req.params?.doc_id;
    const user_id = ctx.auth?.user_info?.user_id || '';
    const body = await ctx.req.json();
    const reaction = body?.reaction || 'love'; // fallback to default

    if (!user_id) {
        return ctx.status(401).json({
            success: false,
            message: "Please login to add your reaction."
        },);
    }
    if (!doc_id || !user_id || !reaction) {
        return ctx.status(400).json({
            success: false,
            message: "Missing document ID, or reaction type.",
        },);
    }

    try {
        const { success, result, error, errno } = await db.create(table_schema.document_reactions, {
            user_id,
            doc_id,
            reaction,
        }).update(table_schema.documents, {
            setCalculations: {
                reaction_count: `reaction_count + 1`
            },
            where: db.condition({
                doc_id: doc_id
            })
        })
            .update(table_schema.user_details, {
                joins: [
                    {
                        table: table_schema.documents,
                        on: 'documents.user_id = user_details.user_id'
                    }
                ],
                setCalculations: {
                    "user_details.reaction_count": `user_details.reaction_count + 1`
                },
                where: db.condition({ doc_id })
            })
            .executeMultiple();

        if (success) {
            return ctx.status(400).json({
                success: true,
                message: "Reaction added successfully.",
                data: result,
            });
        } else {
            if (errno === 1062) {
                return ctx.status(409).json({
                    success: false,
                    message: "You already reacted to this document.",
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




export { documentReactions };
