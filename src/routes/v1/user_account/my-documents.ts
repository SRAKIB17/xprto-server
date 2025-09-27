import { Router } from "tezx";
import { dbQuery, TABLES } from "../../../models/index.js";
import { destroy, find, insert } from "@tezx/sqlx/mysql";
import { generateUUID } from "tezx/helper";

const my_documents = new Router({
    basePath: '/my-documents'
});

// ✅ Get documents
my_documents.get("/", async (ctx) => {
    const { user_id } = ctx.auth?.user_info || {};
    const { role } = ctx.auth ?? {};
    if (!user_id || !role) {
        return ctx.status(401).json({ success: false, message: "Unauthorized" });
    }
    const { success, result } = await dbQuery(
        find(TABLES.USER_DOCUMENTS, {
            where: `user_id = ${user_id} AND user_type = "${role}"`,
        })
    );
    return ctx.json({ success, data: result });
});

// ✅ Create document
my_documents.post("/", async (ctx) => {
    try {
        const { user_id } = ctx.auth?.user_info || {};
        const { role } = ctx.auth ?? {};
        if (!user_id || !role) {
            return ctx.status(401).json({ success: false, message: "Unauthorized" });
        }

        const body = await ctx.req.json();
        const {
            document_type,
            original_name,
            stored_name,
            storage_path,
            mime_type,
            size,
            metadata,
            checksum,
        } = body;

        const { success, result, error } = await dbQuery(
            insert(TABLES.USER_DOCUMENTS, {
                uuid: crypto.randomUUID?.() || generateUUID(), // fallback
                user_type: role,
                user_id,
                document_type,
                original_name,
                stored_name,
                storage_path,
                mime_type,
                size,
                metadata: metadata ? JSON.stringify(metadata) : null,
                checksum,
            })
        );

        if (!success) {
            return ctx.status(500).json({ success: false, message: "Insert failed", error });
        }

        return ctx.json({
            success: true,
            id: result?.insertId,
        });
    } catch (err) {
        return ctx.status(500).json({ success: false, message: "Server error", error: err?.message });
    }
});

// ✅ Delete document
my_documents.delete("/:id", async (ctx) => {
    try {
        const { user_id } = ctx.auth?.user_info || {};
        const { role } = ctx.auth ?? {};
        const { id } = ctx.req.params;

        if (!user_id || !role) {
            return ctx.status(401).json({ success: false, message: "Unauthorized" });
        }

        // defensive: ensure numeric id
        const docId = Number(id);
        if (isNaN(docId)) {
            return ctx.status(400).json({ success: false, message: "Invalid document id" });
        }

        const { success, error } = await dbQuery(
            destroy(TABLES.USER_DOCUMENTS, {
                where: `id = ${docId} AND user_id = ${user_id} AND user_type = "${role}"`,
            })
        );

        if (!success) {
            return ctx.status(404).json({
                success: false,
                message: "Document not found or unauthorized",
                error,
            });
        }

        return ctx.json({
            success: true,
            message: "Document deleted",
        });
    } catch (err) {
        return ctx.status(500).json({ success: false, message: "Server error", error: err?.message });
    }
});

export default my_documents;