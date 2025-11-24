import { Router } from "tezx";
import gymsBooking from "./gyms.js";
import trainerBooking from "./trainer.js";

// import user_account_document_flag from "./flag-document.js";
const clientsBookingTrainerGym = new Router({
    basePath: "/booking"
});

clientsBookingTrainerGym.use(trainerBooking);
clientsBookingTrainerGym.use(gymsBooking);
export default clientsBookingTrainerGym;