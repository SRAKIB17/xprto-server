import { Router } from "tezx";
import clientsBookingTrainerGym from "./booking/index.js";
import clientFeedback from "./feedback.js";
import clientPlans from "./plans/index.js";
import gymSessions from "./gym-session.js";

// import user_account_document_flag from "./flag-document.js";
const clients = new Router({
    basePath: "/clients"
});

clients.use(clientFeedback);
clients.use(clientPlans);
clients.use(clientsBookingTrainerGym);
clients.use(gymSessions);
export default clients;