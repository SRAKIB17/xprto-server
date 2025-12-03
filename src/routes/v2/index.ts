import { Router } from "tezx";
import adminV2 from "./protected/admins/index.js";
import clientV2 from "./protected/client/index.js";
import gymV2 from "./protected/gyms/index.js";
import trainerV2 from "./protected/trainers/index.js";
const v2 = new Router({
    basePath: "/v2"
})

v2.addRouter('/protected/client', clientV2);
v2.addRouter("/protected/trainer", trainerV2);
v2.addRouter('/protected/gym', gymV2);
v2.addRouter('/protected/admin', adminV2)
export { v2 };
