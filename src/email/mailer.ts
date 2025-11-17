import fs from "node:fs";
import path from "node:path";
import nodemailer from "nodemailer";
import { SITE_TITLE } from "../config";
// email
/**
 * 1. reset-password
 * 2. join-as-gym
 * 
 */
type EmailData = {
    to: string;
    subject: string;
    templateName: string;
    templateData: Record<string, any>;
    filePath?: string[];
} & (
        {
            templateName: "join-as-gym",
            templateData: { name: string, email: string, password: string, verificationUrl: string, year: number }
        } |
        {
            templateName: "verify-email",
            templateData: { name: string, verificationUrl: string }
        } |
        {
            templateName: 'reset-password',
            templateData: {
                name: string,
                resetUrl: string,
            }
        } | {
            templateName: "password-reset-success",
            templateData: {
                name: string,
            }
        } |
        {
            templateName: "register-otp",
            templateData: {
                otp: string,
            }
        }
        | {
            templateName: "admin-2fa-otp",
            templateData: {
                otp: string,
            }
        } | {
            templateName: 'contact-confirm',
            templateData: {
                name: string,
                subject: string,
                message: string,
            }
        } | {
            templateName: "account-delete",
            templateData: {
                name: string,
                date: string,
            }
        } | {
            templateName: "account-delete-cancelled",
            templateData: {
                name: string,
                support_email: string,
            }
        } | {
            templateName: "flag-document-notify-user",
            templateData: {
                title: string,
                name: string,
                reason: string,
                description: string,
                url: string,
            }
        }
    );
// smtp-relay.brevo.com
// Port
// 587
// Login
// 9871e8001@smtp-brevo.com

// password-vTm8aqQMfz9n6gW4
const transporter = nodemailer.createTransport({
    host: "smtp-relay.brevo.com",
    port: 587,
    // port: 465,
    tls: {
        rejectUnauthorized: true,
        minVersion: "TLSv1.2"
    },
    auth: {
        user: "9871e8001@smtp-brevo.com",
        pass: "vTm8aqQMfz9n6gW4"

    }
});

function renderTemplate(rawHtml: string, data: Record<string, string>): string {
    return rawHtml.replace(/{{(.*?)}}/g, (_, key) => data[key.trim()] || "");
}

export async function sendEmailWithTemplate(props: EmailData) {
    return await sendEmail(props);
}

export async function sendEmail({ to, filePath, subject, templateName, templateData }: EmailData) {
    try {
        let data = { ...templateData as any, year: new Date().getFullYear() }
        const templatePath = path.join(process.cwd(), "templates", `${templateName}.html`);


        const rawHtml = fs.readFileSync(templatePath, "utf-8");
        const html = renderTemplate(rawHtml, data);

        const attachments = Array.isArray(filePath) && filePath?.length > 0
            ? filePath?.map((file) => ({
                filename: path.basename(file),
                path: file,
                contentType: "application/pdf",
            }))
            : [];

        const info = await transporter.sendMail({
            attachments: attachments,
            from: `"${SITE_TITLE}" <${'xprtosmtp@gmail.com'}>`,
            to,
            subject,
            html,
        });
        console.log("Email sent:", info.messageId);
        return true;
    } catch (err) {
        console.log(err)
        // console.error("Email send failed:", err);
        return false;
    }
}

// sendEmail({
//     subject: 'hello',
//     templateData: { name: "rakib" },
//     templateName: 'welcome',
//     to: 'rakibulssc5@gmail.com'
// })
