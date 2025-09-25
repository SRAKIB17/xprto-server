import { Router } from "tezx";
import { users } from "./users";


const usersManagement = new Router()
usersManagement.addRouter('/', users);
// documents.addRouter('/flagged', flagged);

// v1.addRouter('/documents', documents)
// v1.addRouter('/auth', auth);
// v1.addRouter('/users', users);
// v1.addRouter('/account', user_account)

export { usersManagement };
