import { Router, TezXError } from "tezx";
import clientFeedback from "./feedback.js";
import myServices from "./my_services.js";
import xprtoTrainersVerifications from "./xprto/verification.js";

// import user_account_document_flag from "./flag-document.js";
const trainers = new Router({
    basePath: "/trainers"
});
trainers.use((ctx, next) => {
    if (ctx.auth?.role === 'trainer') {
        return next();
    }
    throw new TezXError("unauthorized");
})
trainers.use(xprtoTrainersVerifications);
trainers.use(clientFeedback);
trainers.use(myServices);


export default trainers;

