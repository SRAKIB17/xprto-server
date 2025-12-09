const BASE_API = "http://localhost:8080"

export function QueryToString(params: Record<string, any>) {
    let x: Record<string, string> = {}
    for (let y in params) {
        if ((params as any)[y]) {
            x[y] = (params as any)[y] ? decodeURIComponent((params as any)[y]) : "";
        }
    }
    // Convert the filtered object to a query string
    return new URLSearchParams(x).toString();
}

/**
 * combine korte hobe shob
 * v1 -> change hobe pore
 * V1 Same 
 * wallet
 */

const concat = (path: string, API: string = BASE_API) => {
    return `${API}${path}`
}

export const GYM_API = {
    //! v1
    NOTIFICATION: {
        DELETE: (id: number) => concat(`/v1/account/notifications/delete/${id}`),
        GET: (params: Record<string, any>) => concat('/v1/account/notifications?' + QueryToString(params)),
    },
    MESSAGE: {
        LIST: {
            GET: (params: Record<string, any>) => concat("/v1/account/chat-rooms?" + QueryToString(params)),
        },
        MESSAGES: {
            GET: (room_id: number, page: number) => concat(`/v1/account/chat-rooms/${room_id}/chats?page=${page}`),
        },
        ROOM: {
            ADD_MEMBER: {
                POST: (room_id: number) => concat(`/v1/account/chat-rooms/${room_id}/add-member`)
            },
            DELETE_MEMBER: {
                POST: (room_id: number) => concat(`/v1/account/chat-rooms/${room_id}/delete-member`)
            },
            DELETE: {
                DELETE: (room_id: number) => concat(`/v1/account/chat-rooms/delete-room/${room_id}`)
            },
            CREATE: {
                POST: concat(`/v1/account/chat-rooms/create-room`)
            },
            GET: (room_id: number) => concat(`/v1/account/chat-rooms/${room_id}`),
        }
    },
    MY_WALLET: {
        WALLET: {
            PAYOUT_HISTORY: {
                GET: (params: Record<string, any>) => concat(`/v1/account/my-wallet/payout-history?${QueryToString(params)}`),
            },
            WITHDRAW: {
                POST: concat(`/v1/account/my-wallet/withdraw`),
            },
            ADD_FUND: {
                POST: (type: "topup" | "hold" | "release_hold" | "payment" | "payout" | "refund" | "adjustment" | "transfer_in" | "transfer_out") => concat(`/v1/gateway/rzp/create/${type}`),
            },
            GET: concat(`/v1/account/my-wallet`),
            HISTORY: {
                GET: (params: Record<string, any>) => concat(`/v1/account/my-wallet/transition-history?${QueryToString(params)}`),
            }
        }
    },
    SUPPORT_TICKETS: {
        GET: concat('/v1/account/support-tickets'),
        GET_MESSAGES: (ticket_id: number) => concat(`/v1/account/support-tickets/${ticket_id}`),
        REPLY: (ticket_id: number) => concat(`/v1/account/support-tickets/${ticket_id}/reply`),
        CREATE: {
            POST: concat('/v1/account/support-tickets')
        },
        CLOSE: {
            PUT: (ticket_id: number) => concat(`/v1/account/support-tickets/${ticket_id}/status`)
        },
    },
    // ! v2
    TRAINERS: {
        SPECIFIC: (trainer_id: number) => ({
            FEEDBACK: {
                GET: (params: Record<string, string>) => concat(`/v2/protected/gym/trainers/${trainer_id}/feedback?` + QueryToString(params))
            },
            DOCUMENT: {
                GET: concat(`/v2/protected/gym/trainers/${trainer_id}/document`)
            },
            REMOVE_FROM_GYM: {
                DELETE: concat(`/v2/protected/gym/trainers/${trainer_id}/remove-from-gym`)
            }
        })
    },
    MY_DOCUMENT: {
        GET: concat("/v2/protected/gym/my-documents"),
        DELETE: {
            PUT: (id: number) => concat(`/v2/protected/gym/my-documents/${id}`)
        },
        POST: concat("/v2/protected/gym/my-documents"),
    },
    MEMBERSHIP_PLANS: {
        GET: concat("/v2/protected/gym/membership-plans"),
        CREATE: {
            POST: concat("/v2/protected/gym/membership-plans"),
        },
        UPDATE: {
            PUT: (plan_id: number) => concat(`/v2/protected/gym/membership-plans/${plan_id}`),
        },
        DELETE: (plan_id: number) => concat(`/v2/protected/gym/membership-plans/${plan_id}`),
    },
    PUSH_NOTIFICATION: {
        HISTORY: {
            GET: (params: Record<string, string>) => concat(`/v2/protected/gym/notifications/push/history?` + QueryToString(params))
        },
        DELETE: (notification_id: number) => concat(`/v2/protected/gym/notifications/push/${notification_id}`),
        POST: concat("/v2/protected/gym/notifications/push/send")
    },
    // 4.12.2025
    CREATE_TRANSACTION: {
        HISTORY: {
            GET: (params: Record<string, string>) => concat(`/v2/protected/gym/create-transaction/history?` + QueryToString(params))
        },
        DELETE: (txn_id: number) => concat(`/v2/protected/gym/create-transaction/${txn_id}`),
        POST: concat(`/v2/protected/gym/create-transaction`)
    },
    // 9.12.2025
    //  ekhane notifitionct implement hobe,,push notifiy korte parbe + ekta button thkbe details page e jaoar jonno. + delete button
    ABUSE_REPORT: {
        GET: (params: Record<string, string>) => concat(`/v2/protected/gym/abuse-report?${QueryToString(params)}`),
        DELETE: (id: number) => concat(`/v2/protected/gym/abuse-report/${id}`)
    },
    // job_feed.sql dekhbe + code match kore,, query gulo-> select + input+ listing er modde ekta button thakbe view applicant dekhar jonno
    JOB_FEED: {
        GET: (params: Record<string, string>) => concat(`/v2/protected/gym/job-feed?${QueryToString(params)}`),
    }
}

export const ADMIN_API = {
    //! v1
    NOTIFICATION: {
        DELETE: (id: number) => concat(`/v1/account/notifications/delete/${id}`),
        GET: (params: Record<string, any>) => concat('/v1/account/notifications?' + QueryToString(params)),
    },
    MESSAGE: {
        LIST: {
            GET: (params: Record<string, any>) => concat("/v1/account/chat-rooms?" + QueryToString(params)),
        },
        MESSAGES: {
            GET: (room_id: number, page: number) => concat(`/v1/account/chat-rooms/${room_id}/chats?page=${page}`),
        },
        ROOM: {
            ADD_MEMBER: {
                POST: (room_id: number) => concat(`/v1/account/chat-rooms/${room_id}/add-member`)
            },
            DELETE_MEMBER: {
                POST: (room_id: number) => concat(`/v1/account/chat-rooms/${room_id}/delete-member`)
            },
            DELETE: {
                DELETE: (room_id: number) => concat(`/v1/account/chat-rooms/delete-room/${room_id}`)
            },
            CREATE: {
                POST: concat(`/v1/account/chat-rooms/create-room`)
            },
            GET: (room_id: number) => concat(`/v1/account/chat-rooms/${room_id}`),
        }
    },
    MY_WALLET: {
        WALLET: {
            ADD_FUND: {
                POST: (type: "topup" | "hold" | "release_hold" | "payment" | "payout" | "refund" | "adjustment" | "transfer_in" | "transfer_out") => concat(`/v1/gateway/rzp/create/${type}`),
            },
            GET: concat(`/v1/account/my-wallet`),
            HISTORY: {
                GET: (params: Record<string, any>) => concat(`/v1/account/my-wallet/transition-history?${QueryToString(params)}`),
            }
        }
    },
    SUPPORT_TICKETS: {
        GET: concat('/v1/account/support-tickets'),
        GET_MESSAGES: (ticket_id: number) => concat(`/v1/account/support-tickets/${ticket_id}`),
        REPLY: (ticket_id: number) => concat(`/v1/account/support-tickets/${ticket_id}/reply`),
        CREATE: {
            POST: concat('/v1/account/support-tickets')
        },
        CLOSE: {
            PUT: (ticket_id: number) => concat(`/v1/account/support-tickets/${ticket_id}/status`)
        },
    },
    // !v2
    PUSH_NOTIFICATION: {
        HISTORY: {
            GET: (params: Record<string, string>) => concat(`/v2/protected/admin/notifications/push/history?` + QueryToString(params))
        },
        DELETE: (notification_id: number) => concat(`/v2/protected/admin/notifications/push/${notification_id}`),
        POST: concat("/v2/protected/admin/notifications/push/send")
    },
    GYMS: {
        SPECIFIC: (gym_id: number) => ({
            MEMBERSHIP_PLANS: {
                GET: concat(`/v2/protected/admin/gyms/${gym_id}/membership-plans`)
            },
            DOCUMENTS: {
                GET: concat(`/v2/protected/admin/gyms/${gym_id}/documents`)
            }
        })
    },
    TRAINERS: {
        SPECIFIC: (trainer_id: number) => ({
            DOCUMENTS: {
                GET: concat(`/v2/protected/admin/trainers/${trainer_id}/documents`)
            }
        })
    },
    CLIENTS: {
        SPECIFIC: (trainer_id: number) => ({
            DOCUMENTS: {
                GET: concat(`/v2/protected/admin/clients/${trainer_id}/documents`)
            }
        })
    },
    // 4.12.2025
    CREATE_TRANSACTION: {
        HISTORY: {
            GET: (params: Record<string, string>) => concat(`/v2/protected/admin/create-transaction/history?` + QueryToString(params))
        },
        DELETE: (txn_id: number) => concat(`/v2/protected/admin/create-transaction/${txn_id}`),
        POST: concat(`/v2/protected/admin/create-transaction`)
    },
    // 5.12.2025
    PAYOUT_HISTORY: {
        UPDATE: {
            PUT: (role: "trainer" | "client" | "gym", payout_id: number) => concat(`/v2/protected/admin/payout-history/${role}/update/${payout_id}`)
        },
        GET: (role: "trainer" | "client" | "gym") => concat(`/v2/protected/admin/payout-history/${role}`)
    },
    ADMINS: {
        LIST: {
            GET: concat('/v2/protected/admin/admins-list')
        }
    },
    // 9.12.2025
    //  ekhane notifitionct implement hobe,,push notifiy korte parbe + ekta button thkbe details page e jaoar jonno. + delete button
    ABUSE_REPORT: {
        GET: (role: 'trainer' | 'gym', params: Record<string, string>) => concat(`/v2/protected/admin/abuse-report/${role}?${QueryToString(params)}`),
        DELETE: (role: 'trainer' | 'gym', id: number) => concat(`/v2/protected/admin/abuse-report/${role}/${id}`)
    },
    // job_feed.sql dekhbe + code match kore,, query gulo-> select + input+ listing er modde ekta button thakbe view applicant dekhar jonno
    JOB_FEED: {
        GET: (params: Record<string, string>) => concat(`/v2/protected/admin/job-feed?${QueryToString(params)}`),
        POST: concat(`/v2/protected/admin/job-feed`),
        PUT: (job_id: number) => concat(`/v2/protected/admin/job-feed/${job_id}`),
        DELETE: (job_id: number) => concat(`/v2/protected/admin/job-feed/${job_id}`),
    }
}

console.log(GYM_API.ABUSE_REPORT.DELETE)