import { Router } from "tezx";
import clientFeedback from "./feedback.js";

// import user_account_document_flag from "./flag-document.js";
const trainers = new Router({
    basePath: "/trainers"
});
trainers.use(clientFeedback)



export default trainers;