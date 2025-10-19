import { Router } from "tezx";
import { AuthorizationMiddlewareAdmin } from "./auth/basicAuth.js";
import { adminAuth } from "./auth/index.js";
import { documents } from "./documents/index.js";
import { license } from "./license.js";
import { support } from "./support/index.js";
import { usersManagement } from "./users/index.js";

const admin = new Router();
admin.addRouter('/auth', adminAuth);
admin.use("/check", AuthorizationMiddlewareAdmin());
admin.addRouter('/check/license', license);
admin.addRouter('/check/documents', documents);
admin.addRouter('/check/users', usersManagement);
admin.addRouter('/check/support', support);
export { admin };
