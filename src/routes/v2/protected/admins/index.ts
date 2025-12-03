import { Router } from "tezx";
import { AuthorizationBasicAuthUser } from "../../../v1/auth/basicAuth.js";
import gymAdmin from "./gyms/index.js";
import pushNotification from "./push-notification.js";
import trainerAdmin from "./trainers/index.js";

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

export default adminV2;