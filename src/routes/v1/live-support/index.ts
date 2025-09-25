import { Router } from "tezx";
import { generateID } from "tezx/helper";
import { upgradeWebSocket } from "tezx/bun";
import { CLIENT_URL } from "../../../config.js";
import { AllowSite } from "../../../middlewares/middlewares.js";
import { Gemini } from "../../../utils/ai/clients/gemini.js";
import { OpenAiSupportAI } from "../../../utils/ai/clients/supportAiOpenAI.js";
import { ContextManager } from "../../../utils/ai/contextManager.js";
import { MCP } from "../../../utils/ai/mcp.js";
import { Fetch } from "../../../utils/customFetch.js";
import { AuthorizationControllerAdmin } from "../admin/auth/basicAuth.js";
import { helpCenterData } from "../public/site/help-center.js";
import { ChatSuggestionType, ConnectType, FormType, StatusType, suggestionChatSend, typingBlurred, TypingBlurredType } from "./handler.js";
import { supportInstruction } from "./instruction.js";
import { autoSuggestions } from "./suggestion.js";
const liveSupport = new Router();

// const openai = new OpenAI({
//     apiKey: "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",
// });
// async function generateAutoReply(userQuery: string,) {
//     const prompt = supportInstruction(helpCenterData) + `\n\nUser Question: ${userQuery}`;

//     const response = await openai.chat.completions.create({
//         model: "gpt-4",
//         messages: [{ role: "system", content: prompt }],
//         temperature: 0.7,
//     });

//     return response.choices[0].message.content;
// }
// try {
(async () => {
    // console.log(await generateAutoReply("nxtbot?"))
    // return last?.content?.[0]?.text?.value || "No answer.";
})()
// }
// catch {
//     console.log(345)
// }
// completion.then((result) => console.log(result.choices[0].message));

/**
 * todo 
 * 1. image upload
 * 
 * 
 */

const activeSockets: Map<string, WebSocket> = new Map();

const supportTeams: Map<string | number, { ws: WebSocket, info: Record<string, string> }> = new Map();

function sanitizeEmailToFolder(email: string): string {
    return email
        .toLowerCase()
        .replace(/[@.]/g, "_")        // Replace "@" and "." with "_"
        .replace(/[^a-z0-9_]/g, "")   // Remove all non-alphanumeric or underscore characters
        .trim();
}
// CREATE TABLE PredefinedResponses(
//     intent VARCHAR(255) PRIMARY KEY,
//     response TEXT
// );
type ChatMessageType = {
    role: "user" | "support",
    status: "sending" | "success" | "failed",
    content: string,
    files?: string | string[],
    id: string,
}

type wsMessageType = {
    isAgent: boolean,
    messageType: "initial",
    attachment: string[],
    payload: {
        submitData: Record<string, any>;
        label: string,
        intent: string,
        form: FormType;
        submitFailedMessage: string,
        response: string,
    }
    type: "chat" | "typing" | "blurred" | "inbox" | "auto-suggestion" | "form-submit",
    recipient_id: string,
    my_id: string;
} & ChatMessageType;


const mcp = new MCP();
mcp.registerModel('gemini', new Gemini());
mcp.registerModel('openai', new OpenAiSupportAI());

liveSupport.get('/live-support',
    [
        async (ctx, next) => {
            let ref = ctx.req.header('referer') || ctx.req.header('origin')
            let refCheck = !AllowSite?.includes(ref!);
            if (refCheck) {
                return ctx.sendFile('public/broken.png',).catch(() => ctx.json({ success: false }));
            }

            const authHeader = ctx.req.header("authorization");
            let success = await AuthorizationControllerAdmin({
                ctx,
                credentials: { token: (authHeader?.startsWith("Bearer ") && authHeader?.split(" ")?.[1]) || ctx.req.header('s_id') },
            });
            // let { email, fullname, username } = ctx.req.query;
            // if (!success && !email) {
            //     return ctx.json({ error: "Unauthorized or missing email" }, 401);
            // }


            return next();
        },
        upgradeWebSocket((ctx) => {
            let id = ctx.req.query?.email;
            let auth = ctx?.auth;
            let admin_id = auth?.user_info?.admin_id;
            let is_support = auth?.success && admin_id;


            let ctxManager = new ContextManager(ctx, {
                beforeLoad: (memory) => memory,
                folder: `.live-support`
            });

            let initialSuggestions = autoSuggestions?.map(r => {
                return {
                    label: r?.label,
                    intent: r?.intent,
                    response: ""
                }
            });

            let guestId = `guest://${generateID()}`;
            let sessionId = id || guestId;
            let currentModel: any = 'gemini'
            mcp.createSession(sessionId, [{ modelName: currentModel }]);
            return {
                open: (ws) => {
                    if (is_support) {
                        supportTeams.set(admin_id, {
                            ws: ws,
                            info: {
                                fullname: auth?.user_info?.fullname,
                                avatar_url: auth?.user_info?.avatar_url,
                                username: auth?.user_info?.username,
                            }
                        });
                        let payload: ConnectType = {
                            type: "connect",
                            chat: [],
                            my_id: undefined,
                            suggestions: undefined,
                        };
                        if (id) {
                            let previousMessage = ctxManager.getTrimmedContext(sanitizeEmailToFolder(id));
                            payload.chat = previousMessage;
                        }

                        suggestionChatSend(ws, payload);
                        onlineHandler(ws, 'team');
                    }
                    else if (id) {
                        let previousMessage = ctxManager.getTrimmedContext(sanitizeEmailToFolder(id));
                        activeSockets.set(id, ws);
                        onlineHandler(ws, 'user');
                        broadcastEach({ type: "online", recipient_id: id });
                        suggestionChatSend(ws, {
                            type: "connect",
                            my_id: id,
                            suggestions: initialSuggestions,
                            chat: previousMessage?.length ? previousMessage :
                                [
                                    {
                                        content: "Hello! How can I help you today?",
                                        role: "support",
                                        avatar_url: `${CLIENT_URL}/favicon.ico`,
                                        createdAt: new Date().toISOString(),
                                        id: generateID(),

                                    }
                                ]
                        });
                    }
                    else {
                        let guestId = `guest://${generateID()}`;
                        activeSockets.set(guestId, ws);
                        onlineHandler(ws, 'user');
                        suggestionChatSend(ws, {
                            type: "connect",
                            chat: [],
                            suggestions: initialSuggestions,
                            my_id: guestId
                        })
                    }
                },
                message: async (ws, msg) => {
                    try {
                        const data: wsMessageType = JSON.parse(msg?.toString() || "{}");

                        //! done
                        broadcastEach({
                            type: "online",
                            recipient_id: {
                                type: data?.isAgent ? "user" : "guest",
                                id: (data?.isAgent ? id : (is_support ? data?.recipient_id : data?.my_id))
                            }
                        });

                        if (data?.type === 'form-submit') {
                            let submitData = data?.payload?.submitData;
                            try {
                                let res = await Fetch(data?.payload?.form?.onsubmit?.action, {
                                    method: data?.payload?.form?.onsubmit?.method,
                                    body: submitData || undefined,
                                }, ctx);
                                if (res?.success) {
                                    suggestionChatSend(ws, {
                                        type: "chat",
                                        from: 'support',
                                        payload: {
                                            attachment: data?.attachment,
                                            content: data?.payload?.form?.successMessage,
                                            id: generateID(),
                                            role: 'support',
                                            status: 'success',
                                            avatar_url: `${CLIENT_URL}/favicon.ico`,
                                        },
                                        suggestions: initialSuggestions
                                    })
                                }
                                else {
                                    // ? ********************* send chat body *********************
                                    suggestionChatSend(ws, {
                                        type: "chat",
                                        from: "support",
                                        payload: {
                                            attachment: data?.attachment,
                                            content: data?.payload?.form?.errorMessage,
                                            role: "support",
                                            id: generateID(),
                                            avatar_url: `${CLIENT_URL}/favicon.ico`,
                                            status: "success"
                                        },
                                        my_id: data?.my_id
                                    })

                                    // ? ********************* send form data for trying with submit failed *********************
                                    suggestionChatSend(ws, {
                                        type: "form-input",
                                        from: "support",
                                        payload: {
                                            form: {
                                                submitFailedMessage: data?.payload?.form?.errorMessage,
                                                ...data?.payload?.form
                                            },
                                            response: "Oops! Something went wrong while processing your response. Please try again by filling out the form below.",
                                        },
                                        suggestions: initialSuggestions,
                                        my_id: data?.my_id
                                    })
                                }
                            }
                            catch (err: any) {
                                const errorMessage = err?.message || "Something went wrong. Please try again.";
                                //! chatting support
                                suggestionChatSend(ws, {
                                    type: 'chat',
                                    from: "support",
                                    payload: {
                                        role: "support",
                                        attachment: data?.attachment,
                                        avatar_url: `${CLIENT_URL}/favicon.ico`,
                                        content: errorMessage,
                                        id: generateID(),
                                        status: "failed",
                                    }
                                })

                                // ? ********************* send chat body *********************
                                suggestionChatSend(ws, {
                                    type: "chat",
                                    from: "support",
                                    payload: {
                                        attachment: data?.attachment,
                                        content: "Oops! Something went wrong while processing your response. Please try again by filling out the form below.",
                                        role: "support",
                                        id: generateID(),
                                        avatar_url: `${CLIENT_URL}/favicon.ico`,
                                        status: "success"
                                    },
                                    my_id: data?.my_id
                                })

                                // ? ********************* send form data for trying with submit failed *********************
                                suggestionChatSend(ws, {
                                    type: "form-input",
                                    from: "support",
                                    payload: {
                                        form: {
                                            submitFailedMessage: "Oops! Something went wrong while processing your response. Please try again by filling out the form below.",
                                            ...data?.payload?.form
                                        },
                                        response: "Oops! Something went wrong while processing your response. Please try again by filling out the form below.",
                                    },
                                    suggestions: initialSuggestions,
                                    my_id: data?.my_id
                                })

                            }
                        }
                        // ! ********************* Done *********************
                        if (data?.type == 'auto-suggestion') {
                            // ? ********************* send user role base when select auto suggestion point *********************
                            suggestionChatSend(ws, {
                                from: "user",
                                type: "chat",
                                payload: {
                                    attachment: data?.attachment,
                                    role: "user",
                                    content: data?.payload?.label,
                                    id: generateID(),
                                    status: "success",
                                }
                            })

                            if (data?.payload?.response) {

                                // ? ********************* typing *********************
                                typingBlurred(ws, {
                                    type: "typing",
                                    payload: {
                                        is_typing: true,
                                        info: {
                                            avatar_url: `${CLIENT_URL}/favicon.ico`
                                        }
                                    }
                                })

                                // ? ********************* send auto suggestion response *********************
                                suggestionChatSend(ws, {
                                    type: "chat",
                                    from: "support",
                                    payload: {
                                        attachment: data?.attachment,
                                        content: data?.payload?.response,
                                        role: "support",
                                        id: generateID(),
                                        avatar_url: `${CLIENT_URL}/favicon.ico`,
                                        status: "success"
                                    },
                                    my_id: data?.my_id
                                })

                                // ? ********************* blurred *********************
                                typingBlurred(ws, {
                                    type: "blurred",
                                    payload: { is_typing: false }
                                })

                                // ? ********************* send form data and initial data *********************
                                let form = data?.payload?.form;
                                suggestionChatSend(ws, {
                                    type: "form-input",
                                    from: "support",
                                    payload: form ? {
                                        form: form,
                                        response: data?.payload?.response,
                                    } : undefined,
                                    suggestions: initialSuggestions,
                                    my_id: data?.my_id
                                })
                            }
                            else {
                                let intent = data?.payload?.intent;
                                let find = autoSuggestions?.find(r => r?.intent == intent)?.response?.map(r => {
                                    return {
                                        label: r?.question,
                                        intent: r?.intent,
                                        form: r?.form,
                                        response: r?.response
                                    }
                                });
                                suggestionChatSend(ws, {
                                    type: "chat",
                                    from: "support",
                                    suggestions: find?.length ? find : initialSuggestions,
                                    my_id: data?.my_id
                                })
                            }
                        }

                        // ! ************************** DONE ******************************

                        if (data?.type == 'inbox' && data?.recipient_id && data?.isAgent) {
                            suggestionChatSend(ws, {
                                type: "connect",
                                my_id: undefined,
                                suggestions: undefined,
                                chat: ctxManager.getTrimmedContext(sanitizeEmailToFolder(id || data?.recipient_id))
                            });
                        }


                        if (data.type === "chat") {
                            let success: StatusType = "success";
                            // ! ************************** DONE ******************************
                            if (data?.isAgent) {
                                try {
                                    let folder = sanitizeEmailToFolder(id || data?.recipient_id);
                                    let previousMessage = ctxManager.getTrimmedContext(folder);
                                    if (data?.messageType == 'initial' && previousMessage?.length && previousMessage?.some(r => r?.id == data?.id)) {
                                        return;
                                    }
                                    previousMessage.push({
                                        content: data?.content,
                                        createdAt: new Date().toISOString(),
                                        id: data?.id,
                                        attachment: data?.attachment,
                                        ...(
                                            is_support && data?.recipient_id ?
                                                {
                                                    fullname: auth?.user_info?.fullname,
                                                    avatar_url: auth?.user_info?.avatar_url,
                                                    username: auth?.user_info?.username
                                                } :
                                                {}
                                        ),
                                        role: is_support && data?.recipient_id ? 'support' : 'user',
                                    })
                                    ctxManager.saveContext(folder, previousMessage);
                                }
                                catch {
                                    success = "failed";
                                }
                            }

                            // ! ************************** DONE ******************************
                            if (is_support && data?.recipient_id) {
                                onlineHandler(ws, 'team');
                                let payload: ChatSuggestionType = {
                                    type: "chat",
                                    from: "support",
                                    payload: {
                                        ...data,
                                        role: "support",
                                        ...(data?.isAgent ? {
                                            fullname: auth?.user_info?.fullname,
                                            avatar_url: auth?.user_info?.avatar_url,
                                            username: auth?.user_info?.username
                                        } : {
                                            avatar_url: `${CLIENT_URL}/favicon.ico`
                                        }),
                                        status: success,
                                    }
                                };
                                suggestionChatSend(ws, payload);
                                suggestionChatSend(activeSockets?.get(data?.recipient_id), payload)
                            }
                            else {
                                // ! ************************** DONE ******************************
                                onlineHandler(ws, 'user');
                                let payload: ChatSuggestionType = {
                                    type: "chat",
                                    from: "user",
                                    payload: {
                                        ...data,
                                        role: "user",
                                        status: success,
                                    }
                                };
                                suggestionChatSend(ws, payload);

                                broadcastEach(payload);
                                if (!data?.isAgent) {
                                    typingBlurred(ws, {
                                        type: "typing",
                                        payload: {
                                            is_typing: true,
                                            info: {
                                                avatar_url: `${CLIENT_URL}/favicon.ico`
                                            }
                                        }
                                    })

                                    try {
                                        let model = mcp.useModel(sessionId, currentModel);
                                        let response = await model(data?.content, {
                                            ws,
                                            systemInstruction: supportInstruction(helpCenterData)
                                        });
                                        suggestionChatSend(ws, {
                                            type: "chat",
                                            from: "support",
                                            suggestions: initialSuggestions,
                                            payload: {
                                                attachment: data?.attachment,
                                                content: response?.[0]?.response?.content,
                                                id: generateID(),
                                                role: 'support',
                                                status: 'success',
                                                avatar_url: `${CLIENT_URL}/favicon.ico`,
                                            }
                                        })
                                    }
                                    catch {
                                        suggestionChatSend(ws, {
                                            type: "chat",
                                            from: "support",
                                            suggestions: initialSuggestions,
                                            payload: {
                                                attachment: data?.attachment,
                                                content: "Something is wrong please try again",
                                                id: generateID(),
                                                role: 'support',
                                                status: 'success',
                                                avatar_url: `${CLIENT_URL}/favicon.ico`,
                                            }
                                        })
                                    } finally {
                                        typingBlurred(ws, {
                                            type: "blurred",
                                            payload: {
                                                is_typing: true,
                                            }
                                        })
                                    }
                                    // todo not implement

                                }
                            }
                        }


                        // !done
                        if (data.type === "typing") {
                            if (is_support && data?.recipient_id) {
                                typingBlurred(activeSockets?.get(data?.recipient_id), {
                                    type: "typing",
                                    payload: {
                                        is_typing: true,
                                        info: supportTeams.get(admin_id)?.info
                                    }
                                })
                            }
                            else {
                                broadcastEach({
                                    type: "typing",
                                    payload: {
                                        is_typing: true,
                                        info: { recipient_id: data?.isAgent ? id : data?.my_id }
                                    }
                                } as TypingBlurredType)
                            }
                        }
                        // !done
                        if (data.type === "blurred") {
                            if (is_support && data?.recipient_id) {
                                typingBlurred(activeSockets?.get(data?.recipient_id), {
                                    type: "blurred",
                                    payload: {
                                        is_typing: false
                                    }
                                })
                            }
                            else {
                                broadcastEach({
                                    type: "blurred",
                                    payload: {
                                        is_typing: false,
                                        info: {
                                            recipient_id: data?.isAgent ? id : data?.my_id
                                        }
                                    }
                                } as TypingBlurredType)
                            }
                        }

                        // if (data.type === "read") {
                        //     await prisma.message.updateMany({
                        //         where: { receiverId: data.payload.receiverId, isRead: false },
                        //         data: { isRead: true },
                        //     });
                        // }
                    } catch (err) {
                        console.error("WebSocket error:", err);
                    }
                },
                close: (ws) => {
                    activeSockets.forEach((ws, key) => {
                        if (ws.readyState !== WebSocket.OPEN) {
                            mcp.deleteSession(key);
                            activeSockets.delete(key);
                        }
                    });
                }
            }
        })
    ], (ctx) => {
        return ctx.json({})
    }
);

function onlineHandler(ws: WebSocket, userType: 'team' | 'user') {
    if (userType == 'user') {
        if (supportTeams.size) {
            ws.send(JSON.stringify({
                type: "online",
                team: [...supportTeams?.values().map(r => r?.info)]
            }));
        }
    }
    else {
        ws.send(JSON.stringify({
            type: "online",
            team: [...activeSockets?.keys()?.map(r => {
                return { recipient_id: r, type: r?.indexOf('guest://') == 0 ? "guest" : "user" };
            })]
        }));
    }
}

function broadcastEach(data: Record<string, any>) {
    supportTeams.forEach((info) => {
        if (info?.ws?.readyState == 1) {
            info?.ws?.send(JSON.stringify(data));
        }
    })
}
export { liveSupport };

