import { Router } from "tezx";
import { db, table_schema } from "../../../../models";

const aboutUs = new Router();
let about_markdown = `
# Connect with PDFs that **talk back**—
## share ideas that **matter.**


### ABOUT PAPERNXT

PaperNxt is a dedicated platform for document and presentation sharing that connects thinkers, creators, and professionals. We're on a mission to elevate intellectual content by giving it the digital showcase it deserves.


### PAPERNXT BRINGS DOCUMENTS TO LIFE THROUGH
### CONVERSATION AND CONNECTION.

While videos have YouTube, photos have Instagram, and short-form content has Twitter, the world's most substantive ideas—often captured in documents and presentations—have lacked a proper home in the digital ecosystem.

Documents remain the primary vehicle for profound ideas—they convey groundbreaking research findings, outline strategic business directions, showcase innovative proposals, and capture creative thinking. Whether you're a researcher publishing findings, an entrepreneur sharing a vision, a professional presenting analysis, or a thought leader articulating a framework, PaperNxt provides the platform where your work can find its audience and make an impact.


### WHY “PAPERNXT”?

We chose “PaperNxt” because it represents the evolution of traditional paper documents into their next digital incarnation. We're preserving the depth and substance of paper-based communication while enhancing it with the connectivity and accessibility of modern platforms. Join us in this evolution—whether you're contributing your own work or exploring the ideas of others, PaperNxt invites you to be part of what's next in knowledge sharing.

    `


aboutUs.get("/", async (ctx) => {
    return ctx.json({
        success: true,
        about: (await db.findOne(table_schema.site_info, {
            where: db.condition({ slug: 'about-us' })
        }).execute()).result?.[0]?.content || "",
    })
})
export { aboutUs };
