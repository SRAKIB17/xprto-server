import { Router } from "tezx";
import BADGE from "./badge_verification.js";
import KYC from "./kyc_verification.js";


// import user_account_document_flag from "./flag-document.js";
const xprtoTrainersVerifications = new Router({
    basePath: "/xprto/verifications"
});

xprtoTrainersVerifications.use(KYC);
xprtoTrainersVerifications.use(BADGE);
// xprtoTrainersVerifications.use(myServices);



export default xprtoTrainersVerifications;