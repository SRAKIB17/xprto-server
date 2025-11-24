import { Router } from "tezx";
import nutritionPlans from "./nutrition_plans.js";
import workoutPlans from "./workout_plans.js";

// import user_account_document_flag from "./flag-document.js";
const clientPlans = new Router({
    basePath: "/plans"
});

clientPlans.use(nutritionPlans)
clientPlans.use(workoutPlans)

export default clientPlans;