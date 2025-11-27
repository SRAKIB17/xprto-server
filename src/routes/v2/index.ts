import { Router } from "tezx";
import clientV2 from "./protected/client/index.js";
import trainerV2 from "./protected/trainers/index.js";
const v2 = new Router({
    basePath: "/v2"
})

v2.addRouter('/protected/client', clientV2);
v2.addRouter("/protected/trainer", trainerV2);
export { v2 };
