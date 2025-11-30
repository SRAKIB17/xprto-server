import { Router } from "tezx";
import { AuthorizationBasicAuthUser } from "../../../v1/auth/basicAuth.js";

const gymV2 = new Router();
gymV2.use(AuthorizationBasicAuthUser());

gymV2.use((ctx, next) => {
    let { role } = ctx.auth ?? {};
    if (role !== 'trainer') {
        throw new Error("Unauthorize");
    }
    return next();
});

export default gymV2;