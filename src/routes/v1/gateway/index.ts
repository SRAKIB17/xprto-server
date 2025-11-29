import { Router } from "tezx";
import razorpay from "./razorpay/index.js";
const gateway = new Router({
    basePath: "gateway"
});

// !docs done
gateway.use(razorpay)

export default gateway;
