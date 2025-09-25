import { Router } from "tezx";

const pricing = new Router()
pricing.get("/pricing", (ctx) => {
    const pricingData = {
        plans: [
            {
                title: "Annual Plan",
                price: "₹129",
                period: "/month",
                billed: "Billed ₹1,548 every 12 months",
                popular: true,
                buttonText: "Get started",
            },
            {
                title: "Quarterly Plan",
                price: "₹229",
                period: "/month",
                billed: "Billed ₹687 every 3 months",
                popular: false,
                buttonText: "Get started",
            }
        ],
        additional: [
            {
                icon: '',
                title: "Student",
                description: "Discover Educational organizations and students can enjoy premium features for free.",
                linkText: "Apply now",
                linkHref: "#"
            },
            {
                icon: '',
                title: "Enterprise",
                description: "Get advanced security, ISO C2 reports, and priority support.",
                linkText: "Coming Soon",
                linkHref: "#"
            }
        ]
    };
    return ctx.json(pricingData)
})

export default pricing;