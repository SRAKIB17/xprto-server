import { Router, TezXError } from "tezx";
import clientsBookingTrainerGym from "./booking/index.js";
import clientFeedback from "./feedback.js";
import myTrainers from "./my-trainers.js";
import clientPlans from "./plans/index.js";

// import user_account_document_flag from "./flag-document.js";
const clients = new Router({
    basePath: "/clients"
});
// clients.use((ctx, next) => {
//     if (ctx.auth?.role === 'client') {
//         return next();
//     }
//     throw new TezXError("unauthorized");
// })
clients.use(clientFeedback);
clients.use(clientPlans);
clients.use(clientsBookingTrainerGym);
clients.use(myTrainers);
export default clients;