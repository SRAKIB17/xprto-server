import { Router } from "tezx";
import { db, table_schema } from "../../../../models";

const privacy = new Router();
let privacy_markdown = `
# Privacy Policy

_Last updated: May 21, 2025_

At **PaperNxt**, your privacy is important to us. This Privacy Policy explains how we collect, use, and protect your personal information when you use [https://papernxt.com](https://papernxt.com).

## 1. Information We Collect

We may collect the following types of personal information:

### a. Information You Provide
- **Account details**: Name, email address, username, password
- **Profile information**: Optional bio, photo, educational background
- **Documents & Submissions**: Content you upload, share, or comment on

### b. Automatically Collected Information
- **Usage data**: Pages visited, links clicked, time spent on site
- **Device & browser data**: IP address, browser type, device ID
- **Cookies**: For login, preferences, analytics (see section 6)

## 2. How We Use Your Information

We use your information to:
- Create and manage your account
- Deliver content and personalized features
- Respond to support requests and user feedback
- Improve the platform through analytics and usage data
- Send you transactional and optional promotional communications

## 3. Sharing of Information

We **do not sell or rent** your personal data. We may share your data with:
- **Service providers** (hosting, analytics, email)
- **Law enforcement** if required by law
- **Other users** (only information you choose to share publicly)

## 4. Data Retention

We retain your personal data only as long as necessary for the purposes outlined in this policy, unless a longer retention period is required or permitted by law.

## 5. Your Rights

Depending on your location, you may have rights to:
- Access the personal data we hold about you
- Correct inaccurate information
- Delete your account and data
- Object to or restrict certain processing

To exercise these rights, contact us at **privacy@papernxt.com**.

## 6. Cookies

We use cookies to:
- Keep you logged in
- Remember your preferences
- Measure site usage and performance

You can manage cookie settings in your browser. Disabling cookies may affect the functionality of our site.

## 7. Security

We use industry-standard security measures (encryption, secure hosting) to protect your information. However, no method of transmission over the internet is 100% secure.

## 8. Children’s Privacy

PaperNxt is not intended for users under the age of 13. If we learn we’ve collected data from a child without parental consent, we will delete it.

## 9. Third-Party Links

Our site may contain links to third-party websites. We are not responsible for their privacy practices. Please review their privacy policies before providing any data.

## 10. Changes to This Policy

We may update this policy from time to time. Changes will be posted on this page with the revised date. Your continued use of PaperNxt constitutes your acceptance of any changes.

## 11. Contact Us

For any privacy-related concerns, contact us:

📧 **privacy@papernxt.com**
🌐 [https://papernxt.com](https://papernxt.com)

---

Thank you for trusting PaperNxt.


`

// console.log(
//     db.create(table_schema.site_info, {
//         slug: 'privacy-policy',
//         title: "Privacy Policy",
//         content: privacy_markdown.trim()
//     }, { onDuplicateUpdateFields: ['slug', 'content', 'title'] }).execute().then(r => {
//         console.log(r);
//     }))

privacy.get("/", async (ctx) => {
    return ctx.json({
        success: true,
        privacy: (await db.findOne(table_schema.site_info, {
            where: db.condition({ slug: 'privacy-policy' })
        }).execute()).result?.[0]?.content || "",
    })
});
export { privacy };

