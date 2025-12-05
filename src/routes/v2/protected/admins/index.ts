import { Router } from "tezx";
import { AuthorizationBasicAuthUser } from "../../../v1/auth/basicAuth.js";
import clientAdmin from "./clients/index.js";
import createTransaction from "./create-transaction.js";
import gymAdmin from "./gyms/index.js";
import pushNotification from "./push-notification.js";
import trainerAdmin from "./trainers/index.js";
import payoutHistory from "./payout-history.js";
import adminList from "./admins/index.js";

const adminV2 = new Router();
adminV2.use(AuthorizationBasicAuthUser());

adminV2.use((ctx, next) => {
    let { role } = ctx.auth ?? {};

    if (role !== 'admin') {
        throw new Error("Unauthorize");
    }
    return next();
});
adminV2.use('/notifications', pushNotification);
adminV2.use('/gyms', gymAdmin);
adminV2.use('/trainers', trainerAdmin);
adminV2.use('/clients', clientAdmin);
adminV2.use('/admins-list', adminList);
adminV2.use(createTransaction);
adminV2.use(payoutHistory)

export default adminV2;