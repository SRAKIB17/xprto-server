import { Router } from "tezx";
import { contactRequest } from "./contact-request";


const support = new Router()
support.addRouter('/contact-request', contactRequest);
// documents.addRouter('/flagged', flagged);

// v1.addRouter('/documents', documents)
// v1.addRouter('/auth', auth);
// v1.addRouter('/users', users);
// v1.addRouter('/account', user_account)

export { support };
