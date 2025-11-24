import { Router } from "tezx";
import clientV2 from "./protected/client/index.js";
const v2 = new Router({
    basePath: "/v2"
})

v2.addRouter('/protected/client', clientV2);

export { v2 };
