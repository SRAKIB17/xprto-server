import { Router } from "tezx";
import { AuthorizationBasicAuthUser } from "../../../v1/auth/basicAuth.js";
import gymMembershipPlans from "./membership-plans.js";
import pushNotification from "./push-notification.js";
import gymTrainers from "./trainers/index.js";
import gymDocuments from "./gym-document.js";
import createTransaction from "./create-transaction.js";

const gymV2 = new Router();
gymV2.use(AuthorizationBasicAuthUser());

gymV2.use((ctx, next) => {
    let { role } = ctx.auth ?? {};

    if (role !== 'gym') {
        throw new Error("Unauthorize");
    }
    return next();
});
gymV2.use(gymMembershipPlans);
gymV2.use('/notifications', pushNotification);
gymV2.use('trainers', gymTrainers);
gymV2.use(createTransaction);
gymV2.use(gymDocuments);
export default gymV2;