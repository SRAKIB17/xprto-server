import { Router } from "tezx";
import { encrypt } from "../../utils/encrypted.js";

const appsData = new Router({
    basePath: '/apps-data'
});
export let appsDataAmountEtc = {
    membership_plan_percent: {
        amount: 100,
        currency: "INR"
    },
    withdraw: {
        trainer: {
            fee_percentage: 10,
            currency: "INR",
        },
        client: {
            fee_percentage: 10,
            currency: "INR",
        }
    },
    cancel_booking_rules: [
        { hours_before: 2, refund_percent: 100, charge_percent: 0 },
        { hours_before: 12, refund_percent: 75, charge_percent: 25 },
        { hours_before: 4, refund_percent: 50, charge_percent: 50 },
        { hours_before: 0, refund_percent: 0, charge_percent: 100 }
    ],
    job_apply: {
        amount: 400,
    },
    assured_amount: {
        currency: "INR",
        amount: 1000
    },
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
        apps: appsDataAmountEtc
    });
});
export default appsData;