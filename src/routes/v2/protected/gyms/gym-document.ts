import { destroy, find, insert } from "@tezx/sqlx/mysql";
import { Router } from "tezx";
import { generateUUID } from "tezx/helper";
import crypto from "node:crypto";
import path from "node:path";
import { dbQuery, TABLES } from "../../../../models/index.js";
import { copyFile, safeUnlink } from "../../../../utils/fileExists.js";

const gymDocuments = new Router({
    basePath: '/my-documents'
});

// ✅ Get documents
gymDocuments.get("/", async (ctx) => {
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

type NewDoc = {
    document_type: string;
    original_name: string;
    user_type: "client" | "gym" | "trainer" | "admin";
    stored_name: string;
    storage_path: string;
    mime_type: string;
    size: number;
    checksum?: string | null;
};

gymDocuments.post("/", async (ctx) => {
    try {
        const { user_id } = ctx.auth?.user_info || {};
        const { role } = ctx.auth ?? {};
        if (!user_id || !role) {
            return ctx.status(401).json({ success: false, message: "Unauthorized", documents: [], });
        }

        const body = await ctx.req.json();
        let incoming: NewDoc[] = Array.isArray(body) ? body : [body];

        // ✅ প্রতিটা incoming doc এর জন্য insert loop
        const results: any[] = [];

        for (const doc of incoming) {
            // file content hash করতে হলে ফাইলটা read করতে হবে
            // এখানে আমি ধরছি storage_path already accessible (e.g. local disk or S3)
            let checksum: string | null = null;

            try {
                const fileBuffer = await Bun.file(doc.storage_path).arrayBuffer();
                checksum = crypto.createHash("sha256").update(Buffer.from(fileBuffer)).digest("hex"); // 64 chars
            }
            catch (e) {
                checksum = null; // fallback
            }
            let storage_path = path.join(path.resolve(), `/uploads/documents/my-documents/${doc?.stored_name}`);
            let copy = await copyFile(doc?.storage_path, storage_path, true);
            if (!copy) {
                return ctx.status(500).json({
                    success: false,
                    message: "File copy failed",
                    documents: [],
                });
            }
            let insertData = {
                uuid: crypto.randomUUID?.() || generateUUID(),
                user_type: role,
                user_id,
                document_type: doc.document_type,
                original_name: doc.original_name,
                stored_name: doc.stored_name,
                storage_path: storage_path,
                mime_type: doc.mime_type,
                size: doc.size,
                checksum: checksum as any,
            }
            const { success, result, error } = await dbQuery<any>(
                insert(TABLES.USER_DOCUMENTS, insertData)
            );
            if (!success) {
                return ctx.status(500).json({
                    success: false,
                    message: "Insert failed",
                    error,
                });
            }
            results.push({
                success: true,
                ...doc,
                ...insertData,
                id: result?.insertId,
                checksum
            });
        }

        return ctx.json({
            success: true,
            documents: results,
        });
    } catch (err: any) {
        return ctx.status(500).json({
            documents: [],
            success: false,
            message: "Server error",
            error: err?.message,
        });
    }
});

// ✅ Delete document
gymDocuments.put("/:id", async (ctx) => {
    try {
        const { user_id } = ctx.auth?.user_info || {};
        const { role } = ctx.auth ?? {};
        const { id } = ctx.req.params;

        const body = await ctx.req.json();
        await safeUnlink(body?.storage_path)
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
    } catch (err: any) {
        return ctx.status(500).json({ success: false, message: "Server error", error: err?.message });
    }
});

export default gymDocuments;