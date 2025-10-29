import { Router } from "tezx";
import trainers from "./trainers.js";
const publicData = new Router();

publicData.use('/public', trainers)
// publicData.addRouter('/help-center', helpCenter)
// publicData.addRouter('/about-us', aboutUs);
// publicData.addRouter('/contact-us', contactUs);
// publicData.addRouter('/term-of-service', tos);
// publicData.addRouter('/privacy-policy', privacy);
// publicData.addRouter('/cookie-policy', cookie);

export { publicData };
