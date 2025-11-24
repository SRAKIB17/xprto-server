import { Router } from "tezx";
import { AuthorizationBasicAuthUser } from "../../../v1/auth/basicAuth.js";
import myGym from "./my-gym.js";
import myTrainers from "./my-trainers.js";

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
clientV2.use(myTrainers);
export default clientV2;