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


const concat = (path: string, API: string = BASE_API) => {
    return `${API}${path}`
}

export const GYM_API = {
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
        POST: concat("/v2/protected/gym/notifications/push/send")
    },
    // 4.12.2025
    CREATE_TRANSACTION: {
        HISTORY: {
            GET: (params: Record<string, string>) => concat(`/v2/protected/gym/create-transaction/history?` + QueryToString(params))
        },
        DELETE: (txn_id: number) => concat(`/v2/protected/gym/create-transaction/${txn_id}`),
        POST: concat(`/v2/protected/gym/create-transaction`)
    }
}
export const ADMIN_API = {
    PUSH_NOTIFICATION: {
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
    }
}
console.log(GYM_API)