import { find, sanitize } from "@tezx/sqlx/mysql";
import { Router } from "tezx";
import { paginationHandler } from "tezx/middleware";
import { dbQuery, TABLES } from "../../../../models";

const myTrainers = new Router({
    basePath: '/my-trainers'
});

myTrainers.get('/all', async (ctx) => {
    const { search } = ctx?.req.query;

    const { user_id } = ctx.auth?.user_info || {};
    const { role } = ctx.auth ?? {};
    if (!user_id || role !== 'client') {
        return ctx.status(401).json({ success: false, message: "Unauthorized" });
    }
    const client_id = sanitize(user_id);

    let condition = `br.client_id = ${client_id} OR ass.client_id = ${client_id}`

    if (search) {
        condition += ` AND tr.fullname LIKE "%${search}%"`;
    }
    const sql = find(`${TABLES.TRAINERS.trainers} as tr`, {
        joins: `
            LEFT JOIN ${TABLES.TRAINERS.BOOKING_REQUESTS} as br ON tr.trainer_id = br.trainer_id AND br.status = 'completed'
            LEFT JOIN ${TABLES.TRAINERS.services} as sv ON sv.service_id = br.service_id
            LEFT JOIN ${TABLES.TRAINERS.WEEKLY_SLOTS.WEEKLY_SLOTS} as wsl ON wsl.trainer_id = tr.trainer_id OR wsl.replacement_trainer_id = tr.trainer_id
            LEFT JOIN ${TABLES.GYMS.SESSIONS} as ss ON ss.session_id = wsl.session_id
            LEFT JOIN ${TABLES.CLIENTS.SESSION_ASSIGNMENT_CLIENTS} as ass ON ass.session_id = ss.session_id
            `,
        groupBy: 'tr.trainer_id',
        columns: `
             DISTINCT tr.trainer_id,
              sv.package_name,
              ss.service_name,
              sv.title,
              sv.images,
              tr.fullname,
              tr.avatar,
              tr.bio,
              tr.gender,
              tr.badge,
              tr.verified,
              tr.specialization
            `,
        where: condition
    })

    const { success, result, error } = await dbQuery<any[]>(sql);
    if (!success) {
        return ctx.json({ result: [] });
    }

    return ctx.json({
        result: result,
    });
});

myTrainers.get('/', paginationHandler({
    getDataSource: async (ctx, { page, limit, offset }) => {
        const { search } = ctx?.req.query;

        // only completed bookings

        const { user_id } = ctx.auth?.user_info || {};
        const { role } = ctx.auth ?? {};
        if (!user_id || role !== 'client') {
            return ctx.status(401).json({ success: false, message: "Unauthorized" });
        }
        const client_id = sanitize(user_id);
        let condition = `br.client_id = ${client_id} OR ass.client_id = ${client_id}`

        if (search) {
            condition += ` AND tr.fullname LIKE "%${search}%"`;
        }

        const sql = find(`${TABLES.TRAINERS.trainers} as tr`, {
            joins: `
            LEFT JOIN ${TABLES.TRAINERS.BOOKING_REQUESTS} as br ON tr.trainer_id = br.trainer_id AND br.status = 'completed'
            LEFT JOIN ${TABLES.TRAINERS.services} as sv ON sv.service_id = br.service_id
            LEFT JOIN ${TABLES.TRAINERS.WEEKLY_SLOTS.WEEKLY_SLOTS} as wsl ON wsl.trainer_id = tr.trainer_id OR wsl.replacement_trainer_id = tr.trainer_id
            LEFT JOIN ${TABLES.GYMS.SESSIONS} as ss ON ss.session_id = wsl.session_id
            LEFT JOIN ${TABLES.CLIENTS.SESSION_ASSIGNMENT_CLIENTS} as ass ON ass.session_id = ss.session_id
            `,
            groupBy: 'tr.trainer_id',
            limitSkip: { limit, skip: offset },
            columns: `
             DISTINCT tr.trainer_id,
              sv.package_name,
              ss.service_name,
              sv.title,
              sv.images,
              tr.fullname,
              tr.avatar,
              tr.bio,
              tr.gender,
              tr.badge,
              tr.verified,
              tr.specialization
            `,
            where: condition,
        })

        // total unique trainers count
        const countSql = find(`${TABLES.TRAINERS.trainers} as tr`, {
            joins: `
            LEFT JOIN ${TABLES.TRAINERS.BOOKING_REQUESTS} as br ON tr.trainer_id = br.trainer_id AND br.status = 'completed'
            LEFT JOIN ${TABLES.TRAINERS.services} as sv ON sv.service_id = br.service_id
            LEFT JOIN ${TABLES.TRAINERS.WEEKLY_SLOTS.WEEKLY_SLOTS} as wsl ON wsl.trainer_id = tr.trainer_id OR wsl.replacement_trainer_id = tr.trainer_id
            LEFT JOIN ${TABLES.GYMS.SESSIONS} as ss ON ss.session_id = wsl.session_id
            LEFT JOIN ${TABLES.CLIENTS.SESSION_ASSIGNMENT_CLIENTS} as ass ON ass.session_id = ss.session_id
            `,
            groupBy: 'tr.trainer_id',
            columns: `COUNT( DISTINCT tr.trainer_id) as count`,
            where: `br.client_id = ${client_id} OR ass.client_id = ${client_id}`
        })
        const { success, result, error } = await dbQuery<any[]>(`${sql} ${countSql}`);
        if (!success) {
            return { data: [], total: 0 };
        }

        return {
            data: result?.[0],              // unique trainers list
            total: result?.[1]?.[0]?.count  // total unique trainers
        } as any;
    }
}));
export default myTrainers;
