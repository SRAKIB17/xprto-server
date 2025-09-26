import { Router } from "tezx";
import { notifications } from "./notification.js";

const websocket = new Router({
    basePath: "/websocket"
})
websocket.use(notifications)
// v1.addRouter('/admin', admin);
// v1.addRouter('/public', pricing);
// v1.addRouter('/documents', documents)
// websocket.addRouter('/auth', auth);
// v1.addRouter('/users', users);
// v1.addRouter('/account', user_account);
// v1.addRouter('/public/site', publicData)
// v1.addRouter('/sitemap', sitemap)
// v1.use(liveSupport);

export { websocket };
