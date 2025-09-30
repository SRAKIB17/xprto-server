import { Router } from "tezx";
import KYC from "./kyc_verification";


// import user_account_document_flag from "./flag-document.js";
const xprtoTrainersVerifications = new Router({
    basePath: "/xprto/verifications"
});

xprtoTrainersVerifications.use(KYC);
// xprtoTrainersVerifications.use(myServices);



export default xprtoTrainersVerifications;