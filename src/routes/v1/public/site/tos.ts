import { Router } from "tezx";
import { db, table_schema } from "../../../../models/index.js";

const tos = new Router();
let tos_markdown = `
# Terms of Service

_Last updated: May 21, 2025_

Welcome to **PaperNxt**! By accessing or using our platform at [https://papernxt.com](https://papernxt.com), you agree to be bound by the following terms and conditions.

## 1. Acceptance of Terms

By using PaperNxt, you agree to comply with and be legally bound by these Terms of Service ("Terms"), whether or not you become a registered user. If you do not agree to these Terms, please do not use the platform.

## 2. Description of Service

PaperNxt is a platform that allows users to share, present, and discuss documents, research, and presentation materials in a collaborative and interactive environment.

## 3. Eligibility

You must be at least 13 years of age to use PaperNxt. By using the platform, you represent and warrant that you meet this requirement.

## 4. User Responsibilities

- You are responsible for any activity that occurs under your account.
- You must not upload or distribute content that is illegal, harmful, abusive, harassing, defamatory, or otherwise objectionable.
- You must not attempt to hack, spam, or otherwise misuse the platform.

## 5. Content Ownership

- You retain full ownership of the content you upload.
- By uploading content to PaperNxt, you grant us a non-exclusive, worldwide, royalty-free license to host and display that content as needed to operate and improve the platform.

## 6. Prohibited Activities

You agree not to:
- Use the service for any illegal purpose;
- Copy, distribute, or disclose any part of the service without authorization;
- Attempt to interfere with the proper functioning of the platform.

## 7. Termination

We reserve the right to suspend or terminate your account at any time if you violate these Terms or engage in conduct that we deem harmful to PaperNxt or its users.

## 8. Disclaimer of Warranties

PaperNxt is provided “as is” without warranties of any kind. We do not guarantee that the platform will always be safe, secure, or error-free.

## 9. Limitation of Liability

To the fullest extent permitted by law, PaperNxt shall not be liable for any indirect, incidental, special, or consequential damages resulting from your use of the service.

## 10. Privacy

Please review our [Privacy Policy](/privacy-policy) to understand how we collect and use your information.

## 11. Modifications to Terms

We may revise these Terms from time to time. The most current version will always be available on our site. Continued use of PaperNxt after any changes constitutes acceptance of the new Terms.

## 12. Contact Us

If you have any questions about these Terms, please contact us at:

📧 **support@papernxt.com**
🌐 **[https://papernxt.com](https://papernxt.com)**

---

Thank you for using PaperNxt.

`

tos.get("/", async (ctx) => {
    return ctx.json({
        success: true,
        tos: (await db.findOne(table_schema.site_info, {
            where: db.condition({ slug: 'terms-of-service' })
        }).execute()).result?.[0]?.content || "",
    })
});
export { tos };
