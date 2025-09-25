import { Router } from "tezx";
const helpCenter = new Router();

export const helpCenterData = [
    {
        category: "Account",
        slug: 'account',
        faqs: [
            {
                question: "Do I have to create an account with PaperNxt?",
                faq_slug: "create-account",
                content: `
  To make the most out of your **PaperNxt** experience and access all resources, you'll need to create an account. With an account, you can:
  
  1. Access millions of student resources.
  2. Ask questions and get help from our vibrant [community](/community).
  3. Sync your preferences across devices.
  4. Subscribe to premium features like downloads and bookmarks.
          `
            },
            {
                question: "How can I change my account settings?",
                faq_slug: "change-account-settings",
                content: `
  To change your account settings:
  
  1. Go to **Settings** from your profile dropdown.
  2. Edit your information like name, email, password, and preferences.
  3. Click **Save** to apply changes.
          `
            },
            {
                question: "How do I change my email address?",
                faq_slug: "change-email",
                content: `
  You can change your email in the **Account Settings** section.
  
  > ⚠️ You'll need to confirm your new email address via a confirmation link.
  
  1. Navigate to Profile > Settings > Email
  2. Enter the new email address
  3. Confirm via the link sent to your new inbox
          `
            }
        ]
    },
    {
        category: "Premium",
        slug: 'premium',
        faqs: [
            {
                question: "What is a Premium Account?",
                faq_slug: "premium-account",
                content: `
  A **Premium Account** gives you access to:
  
  - Ad-free experience
  - Unlimited downloads
  - Priority customer support
          `
            },
            {
                question: "What type of subscriptions do PaperNxt offer?",
                faq_slug: "subscription-types",
                content: `
  We offer monthly, quarterly, and yearly plans. Each offers the same premium benefits but at different billing cycles. 
  Check the [pricing page](/pricing) for updated details.
          `
            },
            {
                question: "How much does Premium cost?",
                faq_slug: "premium-cost",
                content: `
  The price of Premium varies by plan:
  
  - Monthly: $9.99
  - Quarterly: $24.99
  - Yearly: $79.99
  
  All prices are in USD and include VAT where applicable.
          `
            }
        ]
    },
    {
        category: "Refunds",
        slug: 'refund',
        faqs: [
            {
                question: "What is a Premium Account?",
                faq_slug: "refund-premium-account",
                content: `Please refer to the Premium Account section above for feature details.`
            },
            {
                question: "What type of subscriptions do PaperNxt offer?",
                faq_slug: "refund-subscription-types",
                content: `See [subscription types](/help-center/subscription-types) for info before requesting a refund.`
            },
            {
                question: "How much does Premium cost?",
                faq_slug: "refund-premium-cost",
                content: `Refund amounts are based on your active billing cycle. Contact support within 14 days for assistance.`
            }
        ]
    },
    {
        category: "General",
        slug: 'general',
        faqs: [
            {
                question: "How does PaperNxt work?",
                faq_slug: "how-papernxt-works",
                content: `
  PaperNxt allows users to:
  
  - Upload and share documents
  - Ask and answer academic questions
  - Explore a library of user-generated content
  
  It’s a platform designed for learners, by learners.
          `
            },
            {
                question: "Is PaperNxt Legal?",
                faq_slug: "papernxt-legal",
                content: `
  Yes, PaperNxt operates under DMCA compliance. All content must be user-generated or properly licensed. Read our [Terms of Service](/terms).
          `
            },
            {
                question: "Can I work for PaperNxt?",
                faq_slug: "work-for-papernxt",
                content: `
  We’re hiring! Visit our [Careers](/careers) page to view open positions and internships.
          `
            }
        ]
    },
    {
        category: "NxtBot (Artificial Intelligence)",
        slug: 'nxtbot',
        faqs: [
            {
                question: "What is NxtBot?",
                faq_slug: "what-is-nxtbot",
                content: `
  **NxtBot** is PaperNxt’s AI assistant that can:
  
  - Help answer academic questions
  - Suggest related documents
  - Summarize or explain content
  
  > Free users have limited daily questions.
          `
            },
            {
                question: "Attachments to questions",
                faq_slug: "nxtbot-attachments",
                content: `
  You can attach documents or images to help NxtBot understand your question better. Make sure the file format is supported: PDF, DOCX, JPG.
          `
            },
            {
                question: "Daily limit of questions",
                faq_slug: "nxtbot-daily-limit",
                content: `
  Free users can ask up to **5 questions per day**. Premium users get **unlimited access** to NxtBot.
          `
            }
        ]
    },
    {
        category: "Uploading",
        slug: 'uploading',
        faqs: [
            {
                question: "How do I upload a document?",
                faq_slug: "upload-document",
                content: `
  1. Go to your Dashboard
  2. Click on **Upload**
  3. Choose a supported file (PDF, DOCX, PPTX)
  4. Add a title and description
  5. Submit for review
          `
            },
            {
                question: "What type of documents do you accept?",
                faq_slug: "accepted-documents",
                content: `
  We accept the following formats:
  
  - PDF
  - DOCX
  - PPT/PPTX
  - TXT
          `
            },
            {
                question: "Why can’t I upload a document?",
                faq_slug: "upload-error",
                content: `
  Common reasons:
  
  - File exceeds size limit (50MB)
  - Unsupported format
  - Network issues
  
  Contact support if the problem persists.
          `
            }
        ]
    },
    {
        slug: 'feature-functionality',
        category: "Features and Functionality",
        faqs: [
            {
                question: "What is the best way to read content?",
                faq_slug: "best-way-to-read",
                content: `
  We recommend using **Reading Mode** which optimizes fonts, spacing, and page transitions for a distraction-free experience.
          `
            },
            {
                question: "How can I share my PaperNxt content on the site itself?",
                faq_slug: "share-content",
                content: `
  Each document has a **Share** button. You can:
  
  - Copy a link
  - Share to your feed
  - Post anonymously
          `
            },
            {
                question: "How can I share my Papers on social media?",
                faq_slug: "share-social-media",
                content: `
  Click the **social share icon** on any document page to post it directly to:
  
  - LinkedIn
  - X (formerly Twitter)
  - Facebook
          `
            }
        ]
    },
    {
        slug: 'bug-bounty',
        category: "Bug Bounty",
        faqs: [
            {
                question: "How do I submit a vulnerability report?",
                faq_slug: "submit-vulnerability",
                content: `
  Please send an email to **security@papernxt.com** with:
  
  - Detailed steps to reproduce
  - Impact assessment
  - Screenshots or logs if available
          `
            },
            {
                question: "What happens after I submit a vulnerability report?",
                faq_slug: "vulnerability-followup",
                content: `
  We review all reports within 5–7 business days. If valid, you may qualify for a reward under our [Bug Bounty Policy](/bug-bounty).
          `
            },
            {
                question: "Who is eligible to participate in the bug bounty program?",
                faq_slug: "bug-bounty-eligibility",
                content: `
  You must:
  
  - Be 18 years or older
  - Not be a current PaperNxt employee
  - Follow responsible disclosure practices
          `
            }
        ]
    },
    {
        slug: 'copyright',
        category: "Copyright",
        faqs: [
            {
                question: "What is Copyright?",
                faq_slug: "what-is-copyright",
                content: `
  Copyright protects the original work of authors. Users must **not** upload copyrighted materials they don’t own or have rights to share.
          `
            },
            {
                question: "How does PaperNxt handle copyright issues?",
                faq_slug: "handle-copyright",
                content: `
  We respond to all valid **DMCA takedown requests**. Content is removed upon verification. See our [Copyright Policy](/copyright).
          `
            },
            {
                question: "How do I report copyrighted materials on PaperNxt?",
                faq_slug: "report-copyright",
                content: `
  Submit a DMCA takedown request via our [Report Form](/report). Include:
  
  - URLs of infringing content
  - Proof of ownership
  - Contact information
          `
            }
        ]
    }
];


helpCenter.get('/', async (ctx) => {
    ctx.setHeader(
        'Cache-Control',
        'public, max-age=3600, stale-while-revalidate=86400'
    );
    return ctx.json({
        success: true,
        helps: helpCenterData
    });
});

helpCenter.get('/:slug', async (ctx) => {
    let { slug } = ctx.req.params;
    ctx.setHeader(
        'Cache-Control',
        'public, max-age=3600, stale-while-revalidate=86400'
    );
    return ctx.json({
        success: true,
        faqs: helpCenterData?.find(r => r?.slug == slug)
    });
});
helpCenter.get('/sitemap', async (ctx) => {
    ctx.setHeader(
        'Cache-Control',
        'public, max-age=3600, stale-while-revalidate=86400'
    );
    let url = helpCenterData.map(r => {
        return {
            slug: r?.slug,
            faqs: r?.faqs?.map(f => f?.faq_slug),
        }
    })
    return ctx.json({
        success: true,
        faqs: url
    });
});

export { helpCenter };
