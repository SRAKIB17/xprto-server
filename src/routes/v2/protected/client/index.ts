import { Router } from "tezx";
import { AuthorizationBasicAuthUser } from "../../../v1/auth/basicAuth.js";
import myGym from "./my-gym.js";
import myTrainers from "./my-trainers.js";
import clientMembership from "./membership.js";
import sessionClientAttendance from "./session/attendance.js";

const clientV2 = new Router();
clientV2.use(AuthorizationBasicAuthUser());
clientV2.use((ctx, next) => {
    let { role } = ctx.auth ?? {};
    if (role !== 'client') {
        throw new Error("Unauthorize");
    }
    return next();
})
clientV2.use(myGym);
clientV2.use(clientMembership);
clientV2.use(myTrainers);
clientV2.use('/session/attendance', sessionClientAttendance);
export default clientV2;