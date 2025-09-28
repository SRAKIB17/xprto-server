import { Router } from "tezx";
import { encrypt } from "../../utils/encrypted.js";

const appsData = new Router({
    basePath: '/apps-data'
});
let apps = {
    kyc_amount: {
        amount: 200,
        currency: "INR"
    }
}
appsData.post("/", async (ctx) => {
    let body = await ctx.req.json();
    let data: any;
    if (!body?.install_id) data = encrypt(JSON.stringify(body), process.env.CRYPTO_KEY!);
    return ctx.json({
        token: data,
        apps
    });
});
export default appsData;