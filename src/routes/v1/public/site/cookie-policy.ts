import { Router } from "tezx";
import { db, table_schema } from "../../../../models";

const cookie = new Router();
let cookie_markdown = `
# Cookie Policy

_Last updated: May 21, 2025_

This Cookie Policy explains how **PaperNxt** ("we", "us", or "our") uses cookies and similar technologies when you visit [https://papernxt.com](https://papernxt.com). By continuing to use our site, you consent to the use of cookies as described in this policy.

## 1. What Are Cookies?

Cookies are small text files placed on your device when you visit a website. They help websites remember your preferences, login sessions, and improve user experience.

## 2. Types of Cookies We Use

### a. Essential Cookies
These cookies are necessary for the website to function properly and cannot be disabled in our systems.
- Remember login sessions
- Manage user authentication
- Enable site navigation

### b. Performance Cookies
These cookies help us understand how visitors interact with our website by collecting information anonymously.
- Analytics (e.g., Google Analytics)
- Track page visits, bounce rate, and user behavior

### c. Functionality Cookies
These cookies remember user choices and enhance the site’s functionality.
- Language preferences
- Saved settings
- Form autofill

### d. Advertising Cookies (Optional)
These cookies may be used to deliver relevant ads and measure ad performance.
- May track across websites
- Only enabled with explicit consent

## 3. How We Use Cookies

We use cookies to:
- Keep you logged in and secure your session
- Analyze site traffic and improve functionality
- Remember your preferences
- Deliver personalized content or ads (if enabled)

## 4. Third-Party Cookies

We may allow third-party services (such as Google, Facebook, or analytics platforms) to place cookies for tracking and reporting.

> These third parties have their own privacy and cookie policies. We encourage you to review them separately.

## 5. Managing Cookies

You can manage or disable cookies through your browser settings:

- **Chrome**: \`Settings > Privacy and security > Cookies and other site data\`
- **Firefox**: \`Preferences > Privacy & Security > Cookies and Site Data\`
- **Safari**: \`Preferences > Privacy > Cookies and website data\`
- **Edge**: \`Settings > Cookies and site permissions > Manage and delete cookies\`

Disabling cookies may affect your experience on our website.

## 6. Cookie Consent

On your first visit to PaperNxt.com, you'll see a cookie banner where you can accept or manage your cookie preferences. You can change your preferences at any time in the settings.

## 7. Updates to This Policy

We may update this Cookie Policy to reflect changes in technology or legal requirements. We encourage you to review this page periodically.

## 8. Contact Us

If you have any questions about our use of cookies:

📧 **privacy@papernxt.com**  
🌐 [https://papernxt.com](https://papernxt.com)

---

Thank you for using PaperNxt.


`

cookie.get("/", async (ctx) => {
    return ctx.json({
        success: true,
        cookie: (await db.findOne(table_schema.site_info, {
            where: db.condition({ slug: 'cookie-policy' })
        }).execute()).result?.[0]?.content || "",
    })
});
export { cookie };

