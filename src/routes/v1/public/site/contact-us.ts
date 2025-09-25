import { copyFileSync, unlinkSync, writeFileSync } from "node:fs";
import path from "node:path";
import sharp from "sharp";
import { Router } from "tezx";
import { useFormData } from "tezx/helper";
import { CDN_URL, tempDir } from "../../../../config.js";
import { sendEmail } from "../../../../email/mailer.js";
import { db, table_schema } from "../../../../models/index.js";

const contactUs = new Router();

contactUs.post('/upload', async (ctx) => {
    const formData = await useFormData(ctx, { maxFiles: 10, sanitized: true });
    const files = (Array.isArray(formData.files) ? formData.files : [formData.files]) as File[];
    if (!files || files.length === 0) {
        return ctx.status(400).json({ error: 'No files uploaded' });
    }

    const processedFiles = [];

    for (const file of files) {
        const allowedImages = ['.jpg', '.jpeg', '.png', '.webp'];

        const uniqueName = (file as File).name;
        // const tempFilePath = path.join(tempDir, uniqueName);
        const tempFilePath = `${tempDir()}/${uniqueName}`;
        // await mkdir(tempDir, { recursive: true });;
        const buffer = await file.arrayBuffer();
        const inputBuffer = Buffer.from(buffer);
        try {
            if ('application/pdf' === (file as File).type) {
                await writeFileSync(tempFilePath, inputBuffer);
                processedFiles.push({
                    success: true,
                    filename: uniqueName,
                    url: tempFilePath
                });
            }
            else {
                const resizedPath = path.join(tempDir(), uniqueName);

                await sharp(inputBuffer)
                    .resize(1024) // resize to max width 1024px
                    .webp({ quality: 85 })
                    .toFile(resizedPath);

                processedFiles.push({
                    success: true,
                    filename: uniqueName,
                    url: tempFilePath
                });
            }
        } catch (error) {
            return ctx.status(500).json({ error: 'Failed to process file' });
        }
    }
    return ctx.json({ success: true, files: processedFiles });
});

contactUs.post('/', async (ctx) => {
    try {
        const body = await ctx.req.json();
        const { fullname, email, username, message, files, reasons } = body;
        let insert: Record<string, any> = {
            fullname,
            email,
            username,
            message,
        };

        const movedFiles: string[] = [];
        if (Array.isArray(files) && files.length > 0) {
            for (const file of files) {
                let filename = file?.filename;
                const targetDir = path.resolve('uploads/contact-requests');
                const targetPath = path.join(targetDir, filename);
                try {
                    await copyFileSync(file?.url, targetPath);
                    movedFiles.push(`/attachments/contact-requests/${filename}`);
                    await unlinkSync(file?.url);         // delete original
                } catch (err) {
                    // skip moving this file if error occurs
                }
            }
            if (movedFiles.length > 0) {
                insert.files = JSON.stringify(movedFiles);
            }
        }
        if (Array.isArray(reasons) && reasons.length > 0) {
            insert.reasons = JSON.stringify(reasons);
        }

        const { success, result, error } = await db.create(table_schema.contact_requests, insert).execute();

        if (success) {
            await sendEmail({
                to: email,
                filePath: Array.isArray(movedFiles) ? movedFiles?.map(r => `${CDN_URL}${r}`) : [],
                subject: "We’ve received your message – PaperNxt",
                templateName: 'contact-confirm',
                templateData: {
                    name: fullname,
                    subject: Array.isArray(reasons) ? reasons.join(", ") : reasons,
                    message,
                }
            })
            return ctx.json({ success: true, message: 'Your message has been received.' });
        } else {
            return ctx.status(500).json({ success: false, error: 'Failed to save your request.' });
        }
    } catch (error) {
        return ctx.status(500).json({ success: false, error: 'Internal server error.' });
    }
})

export { contactUs };
