import { Router } from "tezx";
import auth from "./auth/index.js";

const v1 = new Router({
    basePath: "/v1"
})
// v1.addRouter('/admin', admin);
// v1.addRouter('/public', pricing);
// v1.addRouter('/documents', documents)
v1.addRouter('/auth', auth);
// v1.addRouter('/users', users);
// v1.addRouter('/account', user_account);
// v1.addRouter('/public/site', publicData)
// v1.addRouter('/sitemap', sitemap)
// v1.use(liveSupport);

export { v1 };
