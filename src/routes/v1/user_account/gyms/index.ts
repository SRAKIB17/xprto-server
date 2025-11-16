import { Router } from "tezx";
import gymReviews from "./reviews";

// import user_account_document_flag from "./flag-document.js";
const gyms = new Router({
    basePath: "/gyms"
});
gyms.use(gymReviews)

export default gyms;

