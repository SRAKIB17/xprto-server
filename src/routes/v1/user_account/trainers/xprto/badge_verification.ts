import { find, insert, mysql_datetime, sanitize, update } from "@tezx/sqlx/mysql";
import { Router } from "tezx";
import { DirectoryServe, filename } from "../../../../../config.js";
import { dbQuery, TABLES } from "../../../../../models/index.js";
import { copyFile } from "../../../../../utils/fileExists.js";
import { AppNotificationToast } from "../../../../websocket/notification.js";

// import user_account_document_flag from "./flag-document.js";
const BADGE = new Router({
    basePath: "/badge"
});
BADGE.get("/:badge", async (ctx) => {
    const { user_id, email } = ctx.auth?.user_info || {};
    const { role } = ctx.auth || {};
    const { badge } = ctx.req.params;

    if (!user_id || !role) {
        return ctx.status(401).json({
            success: false,
            message: "Unauthorized. Please log in to continue."
        });
    }

    const { result: badge_result } = await dbQuery(
        find(TABLES.TRAINERS.badge_verification, {
            where: `trainer_id = ${user_id} AND apply_for = ${sanitize(badge)}`,
            limitSkip: { limit: 1 },
        })
    );

    if (badge_result?.length) {
        return ctx.json({
            success: true,
            message: "Badge already exists.",
            badge: badge_result[0]
        });
    }

    const { result, success, error } = await dbQuery<any>(
        insert(TABLES.TRAINERS.badge_verification, {
            trainer_id: user_id,
            apply_for: ["L1", "L2", "L3", "L4", "L5"].includes(badge) ? badge : "L1"
        })
    );

    if (!success) {
        AppNotificationToast(ctx, {
            message: "Could not create badge.",
            title: "Badge Creation Failed",
            type: "error"
        });
        return ctx.status(500).json({
            success: false,
            message: "An error occurred while creating badge. Please try again later."
        });
    }
    const { result: newBadge } = await dbQuery(
        find(TABLES.TRAINERS.badge_verification, {
            where: `badge_id = ${result.insertId}`,
            limitSkip: { limit: 1 },
        })
    );
    return ctx.json({
        success: true,
        message: "Badge created successfully.",
        badge: newBadge?.[0]
    });
});

BADGE.post("/:badge/apply", async (ctx) => {
    try {
        // --- Auth check ---
        const { user_id } = ctx.auth?.user_info || {};
        const { role } = ctx.auth || {};
        if (!user_id || !role) {
            return ctx.status(401).json({ message: "Unauthorized" });
        }

        // --- Request payload ---
        const { badge, attachments } = await ctx.req.json();
        if (!badge) {
            return ctx.status(400).json({ message: "Badge is required" });
        }

        // --- File copy & prepare docs ---
        let documents: string[] = [];
        if (Array.isArray(attachments)) {
            for (const file of attachments) {
                try {
                    const ok = await copyFile(file, DirectoryServe.verifications.BADGE(file), true);
                    if (ok) {
                        documents.push(filename(file));
                    }
                } catch (err) {
                    console.error("File copy failed:", err);
                }
            }
        }

        if (!documents?.length) {
            return ctx.status(404).json({ success: false, message: "Re-upload documents please!" })
        }
        // --- Update existing badge application ---
        const { success, error } = await dbQuery(
            update(TABLES.TRAINERS.badge_verification, {
                values: {
                    document_file: JSON.stringify(documents),
                    status: "in_review",
                    apply_for: badge,
                    updated_at: mysql_datetime(),
                },
                where: `trainer_id = ${sanitize(user_id)} AND apply_for = ${sanitize(badge)}`,
            })
        );
        if (!success) {
            return ctx.status(500).json({ success: false, message: "Failed to update badge application" });
        }

        // --- Fetch latest row ---
        const { result } = await dbQuery<any>(
            find(TABLES.TRAINERS.badge_verification, {
                where: `trainer_id = ${sanitize(user_id)} AND apply_for = ${sanitize(badge)}`,
                limitSkip: { limit: 1 },
            })
        );

        return ctx.json({
            success: true,
            badge: result?.[0] || null,
        });
    } catch (error) {
        return ctx.status(500).json({ success: false, message: "Server error", error: String(error) });
    }
});

BADGE.post("/assured", async (ctx) => {
    const { user_id, email } = ctx.auth?.user_info || {};
    const { role } = ctx.auth || {};
    const verified_for = "assured";
    if (!user_id || !role) {
        return ctx.status(401).json({ message: "Unauthorized" });
    }
    const {
        certificates,
        pvc
    } = await ctx.req.json()

    let documents = [];
    if (await copyFile(pvc, DirectoryServe.verifications.ASSURED(pvc), true)) {
        documents.push(filename(pvc))
    }
    if (Array.isArray(certificates)) {
        for (const file of certificates) {
            if (await copyFile(file, DirectoryServe.verifications.ASSURED(file), true)) {
                documents.push(filename(file))
            }
        }
    }
    if (Array.isArray(documents) && documents?.length < 2) {
        return ctx.status(400).json({ message: "Please upload documents again!" });
    }

    const { result: existingKYC } = await dbQuery<any>(
        find(TABLES.TRAINERS.kyc_verification, {
            where: `trainer_id = ${sanitize(user_id)} AND verified_for = ${sanitize(verified_for)}`,
            limitSkip: { limit: 1 },
        })
    );

    // // ---- Update old KYC ----
    const { success } = await dbQuery(
        update(TABLES.TRAINERS.kyc_verification, {
            values: {
                document_file: JSON.stringify(documents),
                status: "in_review",
                verified_for,
                updated_at: mysql_datetime(),
            },
            setCalculations: { attempts: "attempts + 1" },
            where: `trainer_id = ${sanitize(user_id)} AND kyc_id = ${existingKYC[0].kyc_id}`,
        })
    );

    if (!success) {
        return ctx.status(500).json({ message: "Failed to update XPRTO assured" });
    }

    let kycRow = (await dbQuery<any>(
        find(TABLES.TRAINERS.kyc_verification, {
            where: `kyc_id = ${existingKYC[0].kyc_id}`,
            limitSkip: { limit: 1 },
        })
    )).result?.[0];
    return ctx.json({ success: true, kyc: kycRow });
});

export default BADGE;