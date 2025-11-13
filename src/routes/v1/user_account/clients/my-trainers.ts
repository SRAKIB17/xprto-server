import { find } from "@tezx/sqlx/mysql";
import { Router } from "tezx";
import { paginationHandler } from "tezx/middleware";
import { dbQuery, TABLES } from "../../../../models";

const myTrainers = new Router({
    basePath: '/my-trainers'
});

myTrainers.get('/', paginationHandler({
    getDataSource: async (ctx, { page, limit, offset }) => {
        const { search } = ctx?.req.query;

        // only completed bookings
        let condition = `br.status = 'completed'`;

        if (search) {
            condition += ` AND tr.fullname LIKE "%${search}%"`;
        }

        // sort by latest booking
        const sortObj: any = { "latest_booking_id": -1 };

        // main SQL: unique trainers with latest booking info
        const sql = find(`${TABLES.TRAINERS.trainers} as tr`, {
            columns: `
                br.trainer_id,
                MAX(br.booking_id) as latest_booking_id,
                sv.package_name,
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
            joins: `
                LEFT JOIN ${TABLES.TRAINERS.BOOKING_REQUESTS} as br ON tr.trainer_id = br.trainer_id
                LEFT JOIN ${TABLES.TRAINERS.services} as sv ON sv.service_id = br.service_id
            `,
            where: condition,
            groupBy: 'br.trainer_id',
            sort: sortObj,
            limitSkip: { limit, skip: offset },
        });

        // total unique trainers count
        const countSql = find(`${TABLES.TRAINERS.trainers} as tr`, {
            columns: 'COUNT(DISTINCT br.trainer_id) as count',
            joins: `
                LEFT JOIN ${TABLES.TRAINERS.BOOKING_REQUESTS} as br ON tr.trainer_id = br.trainer_id
            `,
            where: condition,
        });

        const { success, result, error } = await dbQuery<any[]>(`${sql} ${countSql}`);
        console.log(error)
        if (!success) {
            return { data: [], total: 0 };
        }

        return {
            data: result?.[0],              // unique trainers list
            total: result?.[1]?.[0]?.count  // total unique trainers
        };
    }
}));

export default myTrainers;
