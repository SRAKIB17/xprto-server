import { Router } from "tezx";
import membershipGymTrainer from "./gym-trainer.js";

// import user_account_document_flag from "./flag-document.js";
const membershipJoinGTC = new Router({
    basePath: "/memberships"
});
membershipJoinGTC.use(membershipGymTrainer)

export default membershipJoinGTC;

