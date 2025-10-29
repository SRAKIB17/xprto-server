import { Router } from "tezx";
import auth from "./auth/index.js";
import user_account from "./user_account/index.js";
import tempUpload from "./upload.js";
import appsData from "./apps.js";
import gateway from "./gateway/index.js";
import publicApi from "./public/index.js";

const v1 = new Router({
    basePath: "/v1"
})

v1.addRouter('/auth', auth);
v1.use(publicApi);
v1.addRouter('/account', user_account);
v1.use(tempUpload);
v1.use(appsData)
v1.use(gateway);


export { v1 };
