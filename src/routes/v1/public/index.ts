import { Router } from "tezx";
import { aboutUs } from "./site/about-us.js";
import { contactUs } from "./site/contact-us.js";
import { helpCenter } from "./site/help-center.js";
import { privacy } from "./site/privac-policy.js";
import { tos } from "./site/tos.js";
import { cookie } from "./site/cookie-policy.js";
const publicData = new Router();



publicData.addRouter('/help-center', helpCenter)
publicData.addRouter('/about-us', aboutUs);
publicData.addRouter('/contact-us', contactUs);
publicData.addRouter('/term-of-service', tos);
publicData.addRouter('/privacy-policy', privacy);
publicData.addRouter('/cookie-policy', cookie);

export { publicData };
