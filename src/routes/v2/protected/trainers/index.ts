import { Router } from "tezx";
import { AuthorizationBasicAuthUser } from "../../../v1/auth/basicAuth.js";
import xprtoTrainer from "./xprto/index.js";

const trainerV2 = new Router();
trainerV2.use(AuthorizationBasicAuthUser());
trainerV2.use((ctx, next) => {
    let { role } = ctx.auth ?? {};
    if (role !== 'trainer') {
        throw new Error("Unauthorize");
    }
    return next();
})
trainerV2.use(`/xprto`, xprtoTrainer)
export default trainerV2;