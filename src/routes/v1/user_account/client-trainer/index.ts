import { Router, TezXError } from "tezx";
import trainerBookingRequest from "./my-bookings";

// import user_account_document_flag from "./flag-document.js";
const trainerClientModule = new Router({
    basePath: "/client-trainer"
});
trainerClientModule.use((ctx, next) => {
    if (ctx.auth?.role === 'trainer' || ctx.auth?.role === 'client') {
        return next();
    }
    throw new TezXError("unauthorized");
})
trainerClientModule.use(trainerBookingRequest)

export default trainerClientModule;

