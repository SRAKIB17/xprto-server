import { Router, TezXError } from "tezx";
import trainerBooking from "./trainer.js";
import gymsBooking from "./gyms.js";

// import user_account_document_flag from "./flag-document.js";
const clientsBookingTrainerGym = new Router({
    basePath: "/booking"
});
// clients.use((ctx, next) => {
//     if (ctx.auth?.role === 'client') {
//         return next();
//     }
//     throw new TezXError("unauthorized");
// })
clientsBookingTrainerGym.use(trainerBooking);
clientsBookingTrainerGym.use(gymsBooking);
export default clientsBookingTrainerGym;