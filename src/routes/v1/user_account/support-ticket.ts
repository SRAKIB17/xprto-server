// import { mysql_datetime, sanitize } from "@dbnx/mysql";
// import fs, { existsSync, renameSync } from "node:fs";
// import path from "node:path";
// import sharp from "sharp";
// import { Router } from "tezx";
// import { useFormData } from "tezx/helper";
// import { paginationHandler } from "tezx/middleware/pagination";
// import { support_email } from "../../../config.js";
// import { sendEmail } from "../../../email/mailer.js";
// import { db, table_schema } from "../../../models/index.js";
// import { wrappedCryptoToken } from "../../../utils/crypto.js";
// import { AuthorizationMiddlewareUser } from "../auth/basicAuth.js";
// import user_account_bookmark from "./bookmark.js";

import { find, insert, mysql_datetime, sanitize, update } from "@tezx/sqlx/mysql";
import path from "node:path";
import { Router } from "tezx";
import { paginationHandler } from "tezx/middleware";
import { dbQuery, TABLES } from "../../../models/index.js";
import { CtxAuth } from "../../../types.js";
import { copyFile } from "../../../utils/fileExists.js";

// import user_account_document_flag from "./flag-document.js";
const support_tickets = new Router({
    basePath: '/support-tickets'
});

support_tickets.get(
    "/",
    paginationHandler({
        getDataSource: async (ctx, { page, limit, offset }) => {
            const { role } = (ctx.auth || {}) as CtxAuth;
            const { user_id, username, hashed, salt, email } = ctx.auth?.user_info || {};
            let condition = ``;
            const { status, priority } = ctx.req?.query;
            if (role === 'trainer') condition = `support_tickets.trainer_id = ${user_id}`;
            if (role === 'client') condition = `support_tickets.client_id = ${user_id}`;
            if (role === 'gym') condition = `support_tickets.gym_id = ${user_id}`;
            if (priority) {
                condition += ` AND support_tickets.priority = ${sanitize(priority)}`;
            }
            if (status) {
                condition += ` AND support_tickets.status = ${sanitize(status)}`;
            }

            let sql = find(TABLES.SUPPORT_TICKETS.SUPPORT_TICKETS, {
                sort: {
                    "support_tickets.updated_at": -1
                },
                joins: [
                    {
                        type: "LEFT JOIN",
                        on: `support_tickets.trainer_id = trainers.trainer_id`,
                        table: TABLES.TRAINERS.trainers
                    },
                    {
                        type: "LEFT JOIN",
                        on: `support_tickets.client_id = clients.client_id`,
                        table: TABLES.CLIENTS.clients
                    },
                    {
                        type: "LEFT JOIN",
                        on: `support_tickets.gym_id = gyms.gym_id`,
                        table: TABLES.GYMS.gyms
                    },
                ],
                columns: `
        support_tickets.*,
        trainers.fullname AS trainer_name,
        clients.fullname AS client_name,
        gyms.gym_name AS gym_name
      `,
                limitSkip: {
                    limit: limit,
                    skip: offset
                },
                where: condition,
            })
            let count = find(TABLES.SUPPORT_TICKETS.SUPPORT_TICKETS, {
                columns: 'count(*) as count',
                where: condition,
            })
            const { success, result, error } = await dbQuery<any[]>(`${sql}${count}`);
            if (!success) {
                return {
                    data: [],
                    total: 0
                }
            }
            return {
                data: result?.[0],
                total: result?.[1]?.[0]?.count
            }
        },
    })
);

support_tickets.get('/:ticket_id', async (ctx) => {
    const ticket_id = Number(ctx.req.params?.ticket_id);
    const { role, user_info } = ctx.auth || {};
    const user_id = user_info?.user_id;

    if (!ticket_id) {
        return ctx.json({ success: false, message: "Ticket ID is required" });
    }

    try {
        // Main condition: ticket_id
        let condition = `support_tickets.ticket_id = ${ticket_id}`;

        // Role-wise filter (exclude own tickets for unauthorized access)
        if (role === 'trainer') condition += ` AND support_tickets.trainer_id = ${user_id}`;
        if (role === 'client') condition += ` AND support_tickets.client_id = ${user_id}`;
        if (role === 'gym') condition += ` AND support_tickets.gym_id = ${user_id}`;

        // Fetch messages
        const sqlMessages = find(TABLES.SUPPORT_TICKETS.SUPPORT_MESSAGES, {
            where: condition,
            joins: [
                {
                    on: 'support_messages.ticket_id = support_tickets.ticket_id',
                    table: TABLES.SUPPORT_TICKETS.SUPPORT_TICKETS
                }
            ],
            columns: "support_messages.*",
            sort: { "support_messages.created_at": 1 } // Oldest first
        });

        const { success, result, error } = await dbQuery(sqlMessages);

        if (!success) {
            return ctx.json({ success: false, message: error || "Failed to fetch messages", data: [] });
        }

        return ctx.json({ success: true, data: result || [] });
    } catch (err) {
        return ctx.json({ success: false, message: "Internal server error" });
    }
});

support_tickets.post('/:ticket_id/reply', async (ctx) => {
    const ticket_id = Number(ctx.req.params?.ticket_id);
    const { role, user_info } = ctx.auth || {};
    const user_id = user_info?.user_id;

    if (!ticket_id) {
        return ctx.json({ success: false, message: "Ticket ID is required" });
    }

    try {
        const { message, attachments, status } = await ctx.req.json();
        console.log(status)
        let finalAttachments: string[] = [];

        if (Array.isArray(attachments)) {
            for (const att of attachments) {
                // ধরে নিচ্ছি att হচ্ছে client থেকে আসা temp path বা file name
                const fileName = path.basename(att);
                const storage_path = path.join(
                    path.resolve(),
                    "uploads",
                    "attachments",
                    "support-tickets",
                    fileName
                );
                let check = await copyFile(att, storage_path);
                if (check) {
                    finalAttachments.push(`/${fileName}`);
                }

            }
        }
        let post = insert(TABLES.SUPPORT_TICKETS.SUPPORT_MESSAGES, {
            ticket_id: ticket_id,
            message: message,
            sender_role: role,
            attachments: finalAttachments.length > 0 ? JSON.stringify(finalAttachments) : undefined,
            sender_id: user_id,
        });
        let upda = update(TABLES.SUPPORT_TICKETS.SUPPORT_TICKETS, {
            values: {
                ...(status ? { status: status } : {}),
                updated_at: mysql_datetime(),
            },
            where: `ticket_id = ${ticket_id}`
        })
        const { success, result, error } = await dbQuery(`${post}${upda}`
        );

        if (!success) {
            return ctx.json({ success: false, message: error || "Failed to create message", data: [] });
        }

        return ctx.json({ success: true, status: status, data: result || [] });
    } catch (err) {
        console.error(err);
        return ctx.json({ success: false, message: "Internal server error" });
    }
});

support_tickets.put('/:ticket_id/status', async (ctx) => {
    const ticket_id = Number(ctx.req.params?.ticket_id);
    const { role, user_info } = ctx.auth || {};
    const user_id = user_info?.user_id;

    if (!ticket_id) {
        return ctx.json({ success: false, message: "Ticket ID is required" });
    }

    try {
        const { status } = await ctx.req.json();
        // Main condition: ticket_id
        let condition = `ticket_id = ${ticket_id}`;
        // Role-wise filter (exclude own tickets for unauthorized access)
        if (role === 'trainer') condition += ` AND trainer_id = ${user_id}`;
        if (role === 'client') condition += ` AND client_id = ${user_id}`;
        if (role === 'gym') condition += ` AND gym_id = ${user_id}`;

        // Fetch messages
        const sqlMessages = update(TABLES.SUPPORT_TICKETS.SUPPORT_TICKETS, {
            where: condition,
            values: {
                status: status,
                updated_at: mysql_datetime()
            }
        });
        const { success, result, } = await dbQuery(sqlMessages);
        if (!success) {
            return ctx.json({ success: false, message: "Failed to close ticket", data: [] });
        }

        return ctx.json({ success: true, data: result || [] });
    } catch (err) {
        return ctx.json({ success: false, message: "Internal server error" });
    }
});
export default support_tickets;