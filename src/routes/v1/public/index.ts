import { Router } from "tezx";
import trainersList from "./trainers.js";

const publicApi = new Router({
    basePath: 'public'
});

publicApi.use('/trainers', trainersList)
// publicData.addRouter('/help-center', helpCenter)
// publicData.addRouter('/about-us', aboutUs);
// publicData.addRouter('/contact-us', contactUs);
// publicData.addRouter('/term-of-service', tos);
// publicData.addRouter('/privacy-policy', privacy);
// publicData.addRouter('/cookie-policy', cookie);

export default publicApi;
