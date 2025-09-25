import { Router } from "tezx";
import { AuthorizationMiddlewareAdmin } from "./auth/basicAuth.js";
import { adminAuth } from "./auth/index.js";
import { documents } from "./documents/index.js";
import { license } from "./license.js";
import { usersManagement } from "./users/index.js";
import { support } from "./support/index.js";
// console.log(version)

const admin = new Router()
admin.addRouter('/auth', adminAuth);
admin.use("/check", AuthorizationMiddlewareAdmin());
admin.addRouter('/check/license', license);
admin.addRouter('/check/documents', documents);
admin.addRouter('/check/users', usersManagement);
admin.addRouter('/check/support', support);
// v1.addRouter('/documents', documents)
// v1.addRouter('/auth', auth);
// v1.addRouter('/users', users);
// v1.addRouter('/account', user_account)

export { admin };
