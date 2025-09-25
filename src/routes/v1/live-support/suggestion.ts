import { BASE_URL } from "../../../config.js";
import { FormType } from "./handler.js";

const concat = (path: string, API: string = BASE_URL) => {
    return `${API}${path}`
}

export let autoSuggestions =
    [
        {
            label: "General Queries",
            intent: "generalQueries",
            response: [
                {
                    "intent": "upload_document",
                    "question": "How do I upload a document?",
                    "response": "To upload a document, click the 'Upload' button on your dashboard, select your file, and fill in the required details (title, description, etc.). Once done, click 'Submit'. Your document will be available on your profile."
                },
                {
                    "intent": "share_publicly",
                    "question": "Can I share my presentation publicly?",
                    "response": "Yes, you can share your presentation publicly. While uploading, select the 'Public' option under visibility settings. This will allow all users on PaperNext to view and download your presentation."
                },
                {
                    "intent": "find_research_papers",
                    "question": "How do I find research papers?",
                    "response": "To find research papers, use the search bar at the top of the page. You can filter results by topic, author, or publication date. Alternatively, browse through categories like 'Academics', 'Science', or 'Technology'."
                },
                {
                    "intent": "supported_file_formats",
                    "question": "What file formats are supported?",
                    "response": "We support PDF, DOCX, PPTX, and TXT formats. Ensure your file is in one of these formats before uploading."
                }
            ]
        },
        {
            label: "Account Management",
            intent: "accountManagement",
            response: [
                {
                    "intent": "delete_account",
                    "question": "How do I delete my account?",
                    "response": "To delete your account, go to `Settings` > `Account` > `Delete Account`. Please note that this action is irreversible, and all your uploaded content will be removed permanently."
                },
                {
                    "intent": "change_password",
                    "question": "How do I change my password?",
                    "response": "To change your password, go to Settings > Security > Change Password. Enter your current password and the new password, then confirm the changes."
                },
                {
                    "intent": "forgot_password",
                    "question": "I forgot my password. What should I do?",
                    "response": "Click the 'Forgot Password' link on the login page. Enter your registered email address, and we’ll send you a password reset link."
                },
                {
                    "intent": "update_profile",
                    "question": "How do I update my profile information?",
                    "response": "Go to your profile page and click 'Edit Profile'. Update your details (name, bio, profile picture, etc.) and save the changes."
                }
            ],
        },
        {
            label: "Document Sharing Collaboration",
            intent: "documentSharingCollaboration",
            response: [
                {
                    "intent": "restrict_access",
                    "question": "How do I restrict access to my document?",
                    "response": "To restrict access, go to the 'Share' menu of your document. Select 'Restricted Access' and add the email addresses of users you want to allow. Only those users will be able to view or edit your document."
                },
                {
                    "intent": "collaborate_document",
                    "question": "Can I collaborate with others on my document?",
                    "response": "Yes, you can collaborate by enabling 'Edit Access' for other users. Go to the 'Share' menu, select 'Collaborators', and add their email addresses. They’ll receive an invitation to collaborate."
                },
                {
                    "intent": "download_document",
                    "question": "How do I download someone else’s document?",
                    "response": "If the document is publicly shared, click the 'Download' button on the document page. For restricted documents, ensure you have been granted access by the owner."
                }
            ],
        },
        {
            label: "Technical Issues",
            intent: "technicalIssues",
            response: [
                {
                    "intent": "upload_failed",
                    "question": "My document failed to upload. What should I do?",
                    "response": "Please ensure your file size does not exceed 50MB and is in a supported format (PDF, DOCX, PPTX, TXT). If the issue persists, try again later or contact our support team."
                },
                {
                    "intent": "missing_uploaded_document",
                    "question": "Why can’t I see my uploaded document?",
                    "response": "Your document may still be processing. Please wait a few minutes and refresh the page. If it doesn’t appear, ensure you’ve completed all required fields during the upload process."
                },
                {
                    "intent": "app_slow",
                    "question": "The app is running slow. What should I do?",
                    "response": "Try refreshing the page or clearing your browser cache. If the issue continues, please let us know, and we’ll investigate further."
                }
            ],
        },
        {
            label: "Community Engagement",
            intent: "communityEngagement",
            response: [
                {
                    "intent": "report_content",
                    "question": "How do I report inappropriate content?",
                    "response": "Click the 'Report' button below the document or presentation. Provide a reason for your report, and our moderation team will review it promptly."
                },
                {
                    "intent": "leave_feedback",
                    "question": "How do I leave feedback about a document?",
                    "response": "Scroll to the bottom of the document page and click the 'Leave Feedback' button. Share your thoughts, and the author will receive your comments."
                },
                {
                    "intent": "connect_users",
                    "question": "How do I connect with other users?",
                    "response": "Visit a user’s profile page and click 'Follow'. You can also engage with their content by liking, commenting, or sharing their documents."
                }
            ],
        },
        {
            label: "Agent Escalation",
            intent: "agentEscalation",
            response: [
                {
                    "intent": "escalate_to_agent",
                    "question": "When escalating to an agent",
                    "response": "This issue requires expert assistance. Please wait while I connect you to an agent."
                },
                {
                    "intent": "agent_unavailable",
                    "question": "When agents are unavailable",
                    "response": "Our agents are currently offline. Please leave a message, and we’ll get back to you shortly.",
                    form: {
                        title: "Contact Support",
                        subtitle: "Please fill out the form below and we’ll get back to you.",
                        errorMessage: "There was an error submitting your request. Please try again.",
                        successMessage: "Your message has been sent successfully. Our support team will contact you soon.",
                        onsubmit: {
                            action: concat('/v1/public/site/contact-us'),
                            method: "POST",
                        },
                        fields: [
                            {
                                type: "text",
                                tagType: "input",
                                name: "fullname",
                                label: "Full Name",
                                required: true,
                                errorMessage: "Name is required."
                            },
                            {
                                type: "text",
                                tagType: "input",
                                name: "username",
                                label: "Username",
                                required: false,
                                errorMessage: ""
                            },
                            {
                                type: "regexp",
                                tagType: "input",
                                name: "email",
                                label: "Email Address",
                                required: true,
                                pattern: "^[\\w-\\.]+@([\\w-]+\\.)+[\\w-]{2,4}$",
                                errorMessage: "Email is required.",
                                patternMessage: "Please enter a valid email address."
                            },
                            {
                                type: "text",
                                tagType: "checkbox",
                                name: "reasons",
                                label: "What is your reason for contacting PaperNxt",
                                required: true,
                                value: [
                                    'I want to report a bug or problem I encountered',
                                    'I have a suggestion / feedback to improve the app',
                                    'I am interested in a business relationship or partnership',
                                    'I am from the press / other media',
                                    'I am interested in career opportunities at PaperNxt',
                                    'Other',
                                ],
                                errorMessage: "Please select one reason."
                            },
                            {
                                type: "text",
                                tagType: "textarea",
                                name: "message",
                                label: "Message",
                                required: true,
                                errorMessage: "Message cannot be empty."
                            },
                            // {
                            //     type: "text",
                            //     tagType: "select",
                            //     name: "topic",
                            //     label: "Topic",
                            //     required: true,
                            //     value: ["General", "Upload Issue", "Document Removal", "Other"],
                            //     errorMessage: "Please select a topic."
                            // },
                            // {
                            //     type: "text",
                            //     tagType: "radio",
                            //     name: "priority",
                            //     label: "Priority Level",
                            //     required: true,
                            //     value: ["Low", "Medium", "High"],
                            //     errorMessage: "Please select a priority level."
                            // },
                            // {
                            //     type: "text",
                            //     tagType: "checkbox",
                            //     name: "channels",
                            //     label: "Preferred Contact Methods",
                            //     required: false,
                            //     value: ["Email", "Phone", "WhatsApp"]
                            // }
                        ]
                    } as FormType

                }
            ]
        }
    ]