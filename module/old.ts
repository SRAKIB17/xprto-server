
// // export const API_CART = {
// //     CHECKOUT_INIT: '/general/v1/checkoutInitiated',
// //     GET_USER_CART: '/general/v1/userCartDetails/?_return_details=1',
// //     MODIFY_USER_CART: '/general/v1/userCart/',
// //     ADD_PRESCRIPTION: '/general/v1/addPrescriptionToCart',
// //     GET_DELIVERY_SCHEDULE: '/v1/timeSlots',
// //     CHECK_COUPON_CODE: '/general/v1/checkCouponEligibility',
// //     CREATE_ORDER_FROM_CART: '/general/v1/orderCreateFromCart',
// //     UPDATE_CART_LOCATION: '/general/v1/updateCartLocation/?_return_details=1',
// //     REMOVE_PRESCRIPTION: (key: string) => `/general/v1/deletePrescriptionFromCart/?prescriptionKey=${key}`,
// //     RESET_COUPON_CODE: '/general/v1/deleteCoupon'
// // };

import { BASE_API, FILE_CDN_BASE_API } from "@/config"
import { BadgeLevel } from "@/types"
import { QueryToString } from "@/utils/queryToString"

// import { UploadPathType } from "@/components";
// import { AI_BASE_API, BASE_API, FILE_CDN_BASE_API } from "@/config";
// import { QueryToString } from "@/utils";

const concat = (path: string, API: string = BASE_API) => {
    return `${API}${path}`
}

export const WEBSOCKET_API = {
    NOTIFICATION_PUSH: concat(`/websocket/notifications/push`),
    MESSAGING_ROOM: (room_id: number, s_id: string) => concat(`/websocket/chat-rooms/${room_id}?s_id=${s_id}`),
    // WS: (doc_id: number, user_id: number, token: string) => `${concat(`/ws/${doc_id}/${user_id}`, AI_BASE_API)}?file=${token}`
}

// export const SUPPORT_WS = (props: { email: string, fullname: string, username: string }) => concat('/v1/live-support?' + QueryToString(props));

export const FILE_SERVE_CDN = {
    jobAttachment: (path: string, tkn: string) => concat(`/attachment/job-posts/${path}?tkn=${tkn}`, FILE_CDN_BASE_API),
    leaveRequestAttachment: (path: string, tkn: string) => concat(`/attachment/job-posts/${path}?tkn=${tkn}`, FILE_CDN_BASE_API),
    jobApplicationsAttachment: (path: string, tkn: string) => concat(`/attachment/job-applications/${path}?tkn=${tkn}`, FILE_CDN_BASE_API),
    messageAttachments: (path: string, tkn: string) => concat(`/attachment/support-tickets/${path}?tkn=${tkn}`, FILE_CDN_BASE_API),
    badgeVerifyDocument: (path: string, tkn: string) => concat(`/attachment/support-tickets/${path}?tkn=${tkn}`, FILE_CDN_BASE_API),
    PLANS: {
        workout_plan: {
            EXERCISE: (path: string, tkn: string) => concat(`/attachment/support-tickets/${path}?tkn=${tkn}`, FILE_CDN_BASE_API),
            PLANS: (path: string, tkn: string) => concat(`/attachment/support-tickets/${path}?tkn=${tkn}`, FILE_CDN_BASE_API),
        },
        nutrition_plan: {
            MEAL: (path: string, tkn: string) => concat(`/attachment/support-tickets/${path}?tkn=${tkn}`, FILE_CDN_BASE_API),
            PLANS: (path: string, tkn: string) => concat(`/attachment/support-tickets/${path}?tkn=${tkn}`, FILE_CDN_BASE_API),
        },
    },
    myServices: {
        attachments: (path: string) => concat(`/attachment/support-tickets/${path}`, FILE_CDN_BASE_API),
        images: (path: string) => concat(`/attachment/support-tickets/${path}`, FILE_CDN_BASE_API),
        video: (path: string) => concat(`/attachment/support-tickets/${path}`, FILE_CDN_BASE_API),
    },
    feedback: {
        trainer: (path: string, tkn: string) => concat(`/feedback/trainer/${path}?tkn=${tkn}`, FILE_CDN_BASE_API),
        gym: (path: string, tkn: string) => concat(`/feedback/gym/${path}?tkn=${tkn}`, FILE_CDN_BASE_API),
    },
    myDocument: (checksum: string, tkn: string) => concat(`/my-document/${checksum}?tkn=${tkn}`, FILE_CDN_BASE_API),
    abuseEvidence: (checksum: string, tkn: string) => concat(`/abuse/evidence/${checksum}?tkn=${tkn}`, FILE_CDN_BASE_API),
    attachments: {
        supportTickets: (path: string, tkn: string) => concat(`/attachment/support-tickets/${path}?tkn=${tkn}`, FILE_CDN_BASE_API),
    },
    // categoryThumbnail: (cat_slug: string) => concat('/images/category/' + cat_slug, FILE_CDN_BASE_API),
    avatarUrl: (username: string) => concat('/images/avatars/' + username, FILE_CDN_BASE_API),
    gymLogo: (url: string) => concat('/images/avatars/' + url, FILE_CDN_BASE_API),
}

export const AUTH_API = {
    JOIN_AS_GYM: {
        POST: concat("/v1/auth/join-gym"),
    },
    REGISTER: {
        POST: concat('/v1/auth/register')
    },
    LOGIN: {
        GOOGLE: {
            GET: concat('/v1/auth/google')
        },
        POST: concat('/v1/auth/login'),
    },
    REFRESH: {
        POST: concat('/v1/auth/refresh')
    },
    LOGOUT: {
        GET: (next?: string) => concat('/v1/auth/logout' + (next ? "?next=" + next : ""))
    },
    PASSWORD_RESET: {
        POST: concat('/v1/auth/password-reset')
    },
    EMAIL_VERIFY: {
        POST: concat(`/v1/auth/send-verification-email`)
    },
    GOOGLE: {
        GET: (id: number) => concat(`/v1/auth/google/jump/${id}`)
    }
}

export const UPLOAD_API = {
    TEMP_FILE: {
        POST: concat('/v1/temp/upload')
    }
};

export const API_ACCOUNT = {
    CLIENT_TRAINER: {
        MY_BOOKINGS: {
            messaging: {
                POST: concat(`/v1/account/client-trainer/my-bookings/messaging`)
            },
            statusChange: {
                POST: (status: "pending" | "accepted" | "rejected" | "cancelled" | "completed") => concat(`/v1/account/client-trainer/my-bookings/change-status/${status}`)
            },
            SPECIFIC: (booking_id: number) => concat(`/v1/account/client-trainer/my-bookings/${booking_id}`),
            GET: (params: Record<string, any>) => concat('/v1/account/client-trainer/my-bookings?' + QueryToString(params)),
        }
    },
    PROFILE_UPDATE: {
        CHANGE_PASSWORD: {
            PUT: concat('/v1/account/update/change-password/')
        },
        MY_INFO: {
            PUT: concat('/v1/account/update/my-info/')
        },
        AVATAR_UPLOAD: {
            REMOVE: {
                DELETE: concat('/v1/account/avatar-remove')
            },
            PUT: concat('/v1/account/avatar-upload')
        }
    },
    EARNING_DASHBOARD: {
        DASHBOARD: {
            GET: (id: number) => concat("/v1/account/earning/dashboard/" + id),
            REVENUE: {
                GET: (id: number, chart: "yearly" | "monthly" | "weekly" | "last-30-days") => concat(`/v1/account/earning/revenue-chart/${id}/${chart}`)
            }
        }
    },
    NOTIFICATION: {
        DELETE: (id: number) => concat(`/v1/account/notifications/delete/${id}`),
        GET: (params: Record<string, any>) => concat('/v1/account/notifications?' + QueryToString(params)),
    },
    MEMBERSHIPS: {
        GYM: concat(`/v1/account/memberships/gym-trainer`),
    },
    TRAINERS: {
        MY_SESSION: {
            RUN: {
                POST: (session_id: number, run_id?: number) => concat(`/v1/account/trainers/sessions/run/${session_id}/${run_id ?? ""}`),
            },
            SPECIFIC_SESSIONS: {
                GET: (session_id: number, trainer_id?: number) => concat(`/v1/account/trainers/sessions/specific/${session_id}/${trainer_id ?? ""}?date=${new Date().toISOString().split("T")[0]}`),
                CLIENTS: {
                    GET: (session_id: number, params: Record<string, any>) => concat(`/v1/account/trainers/sessions/specific/clients/${session_id}/?date=${new Date().toISOString().split("T")[0]}`)
                },

            },
            GET: (trainer_id?: number) => concat(`/v1/account/trainers/sessions/${trainer_id ?? ""}?date=${new Date().toISOString().split("T")[0]}`)
        },
        AVAILABILITY_SLOTS: {
            GET: (gym_id: number, trainer_id: number) => concat(`/v1/account/trainers/availability-slots/${gym_id}/${trainer_id}`),
            // it is for gym
            UPDATE: {
                PUT: (slot_id: number) => concat(`/v1/account/trainers/availability-slots/update/${slot_id}`),
            },
            DELETE: (slot_id: number) => concat(`/v1/account/trainers/availability-slots/delete/${slot_id}`),
            ADD: {
                POST: concat(`/v1/account/trainers/availability-slots`)
            }
            //**** */
        },
        LEAVE_REQUEST: {
            UPDATE: {
                POST: (leave_id: number) => concat(`/v1/account/trainers/leave-requests/update/${leave_id}`),
            },
            GET: (params: Record<string, any>) => concat(`/v1/account/trainers/leave-requests?${QueryToString(params)}`),
            apply: {
                POST: concat(`/v1/account/trainers/leave-requests/apply`)
            }
        },


        SERVICES: {
            CREATE_PUT: concat(`/v1/account/trainers/my-services/add-update`),
            DELETE: (id: number) => concat(`/v1/account/trainers/my-services/${id}/delete`),
            PUBLISH: (id: number) => concat(`/v1/account/trainers/my-services/${id}/publish`),
            GET: (params: Record<string, any>) => concat('/v1/account/trainers/my-services?' + QueryToString(params)),
        },
        VERIFICATION: {
            KYC: {
                GET: (verified_for: 'kyc' | 'assured') => concat(`/v1/account/trainers/xprto/verifications/kyc/${verified_for}`),
                CREATE: {
                    POST: (verified_for: 'kyc' | 'assured') => concat(`/v1/account/trainers/xprto/verifications/kyc/${verified_for}`),
                }
            },
            BADGE: {
                GET: (badge: BadgeLevel) => concat(`/v1/account/trainers/xprto/verifications/badge/${badge}`),
                APPLY: {
                    POST: (badge: BadgeLevel) => concat(`/v1/account/trainers/xprto/verifications/badge/${badge}/apply`)
                }
            }
        },
        FEEDBACK: {
            DASHBOARD: concat(`/v1/account/trainers/feedback/dashboard`),
            REPLY: {
                PUT: (id: number) => concat(`/v1/account/trainers/feedback/${id}/reply`)
            },
            GET: (params: Record<string, any>) => concat('/v1/account/trainers/feedback?' + QueryToString(params)),
        }
    },
    CLIENTS: {
        MY_SESSION: {
            RUN: {
                POST: (session_id: number, run_id: number,) => concat(`/v1/account/clients/sessions/mark-attendance/${session_id}/${run_id ?? ""}`),
            },
            GET: (props: { type?: 'history' | 'active', client_id: number, date: string }) => concat(`/v1/account/clients/sessions/${props?.client_id ?? ""}?type=${props.type}&date=${props.date}`)
        },

        BOOKING: {
            GYM_TRIAL: {
                LIST: (params: Record<string, string>) => concat("/v1/account/clients/booking/gyms/trial?" + QueryToString(params)),
                BOOKING: {
                    POST: concat(`/v1/account/clients/booking/gyms/trial`),
                },
            },
            TRAINER: {
                BOOKING: {
                    POST: concat(`/v1/account/clients/booking/trainers/service`),
                },
                UNAVAILABILITY: {
                    GET: (trainer_id: number, service_id: number) => concat(`/v1/account/clients/booking/trainers/${trainer_id}/unavailability/${service_id}`)
                },
                SPECIFIC: (trainer_id: number) => concat(`/v1/account/clients/booking/trainers/${trainer_id}`),
                SERVICES: {
                    GET: (trainer_id: number) => concat(`/v1/account/clients/booking/trainers/${trainer_id}/services`)
                },
            }
        },
        NUTRITION_PLANS: {
            GET: (client_id: string, params: Record<string, any>) => concat(`/v1/account/clients/plans/nutrition-plans?client_id=${client_id}&${QueryToString(params)}`),
            SPECIFIC: (plan_id: string) => concat(`/v1/account/clients/plans/nutrition-plans/${plan_id}`),
            CREATE: {
                PLANS: {
                    POST: concat(`/v1/account/clients/plans/nutrition-plans`),
                },
                MEAL: {
                    POST: (plan_id: number) => concat(`/v1/account/clients/plans/nutrition-plans/${plan_id}/meal`),
                }
            },
            UPDATE: {
                PLANS: {
                    PUT: (plan_id: number) => concat(`/v1/account/clients/plans/nutrition-plans/${plan_id}`),
                },
                MEAL: {
                    PUT: (plan_id: number, exercise_id: number) => concat(`/v1/account/clients/plans/nutrition-plans/${plan_id}/meal/${exercise_id}`),
                }
            },
            DELETE: {
                PLANS: (plan_id: number) => concat(`/v1/account/clients/plans/nutrition-plans/delete/plans/${plan_id}`),
                MEAL: (plan_id: number, meal_id: number) => concat(`/v1/account/clients/plans/nutrition-plans/${plan_id}/meal/${meal_id}`)
            }
        },
        WORKOUT_PLANS: {
            GET: (client_id: string, params: Record<string, any>) => concat(`/v1/account/clients/plans/workout-plans?client_id=${client_id}&${QueryToString(params)}`),
            SPECIFIC: (plan_id: string) => concat(`/v1/account/clients/plans/workout-plans/${plan_id}`),
            CREATE: {
                PLANS: {
                    POST: concat(`/v1/account/clients/plans/workout-plans`),
                },
                EXERCISE: {
                    POST: (plan_id: number) => concat(`/v1/account/clients/plans/workout-plans/${plan_id}/exercises`),
                }
            },
            UPDATE: {
                PLANS: {
                    PUT: (plan_id: number) => concat(`/v1/account/clients/plans/workout-plans/${plan_id}`),
                },
                EXERCISE: {
                    PUT: (plan_id: number, exercise_id: number) => concat(`/v1/account/clients/plans/workout-plans/${plan_id}/exercises/${exercise_id}`),
                }
            },
            DELETE: {
                PLANS: (plan_id: number) => concat(`/v1/account/clients/plans/workout-plans/delete/plans/${plan_id}`),
                EXERCISE: (plan_id: number, exercise_id: number) => concat(`/v1/account/clients/plans/workout-plans/${plan_id}/exercises/${exercise_id}`)
            }
        },
        MUSCLES_RECORD: {
            STATS: {
                GET: (type: "skeletal" | "subcutaneous", client_id?: string) => concat(`/v1/account/clients/muscles-record/stats/${type}/${client_id}`),
            },
            ADD_EDIT: {
                POST: (type: "skeletal" | "subcutaneous",) => concat(`/v1/account/clients/muscles-record/${type}/add-edit`),
            },
            DELETE: (type: "skeletal" | "subcutaneous", id: number) => concat(`/v1/account/clients/muscles-record/${type}/delete/${id}`),
            GET: (type: "skeletal" | "subcutaneous",) => (params: Record<string, any>) => concat(`/v1/account/clients/muscles-record/${type}?` + QueryToString(params)),
        },
        HEALTH_CONDITION: {
            STATS: {
                GET: (client_id?: string) => concat(`/v1/account/clients/health-condition/stats/${client_id}`),
            },
            ADD_EDIT: {
                POST: concat(`/v1/account/clients/health-condition/add-edit`),
            },
            DELETE: (id: number) => concat(`/v1/account/clients/health-condition/delete/${id}`),
            GET: (params: Record<string, any>) => concat(`/v1/account/clients/health-condition?` + QueryToString(params)),
        },
        MY_RATINGS: {
            GYMS: {
                DELETE: (id: number) => concat(`/v1/account/clients/my-ratings/gyms/${id}/delete`),
                GET: (params: Record<string, any>) => concat('/v1/account/clients/my-ratings/gyms?' + QueryToString(params)),
            },
            TRAINERS: {
                POST: (trainer_id: number) => concat(`/v1/account/clients/my-ratings/trainers/post/${trainer_id}`),
                DELETE: (id: number) => concat(`/v1/account/clients/my-ratings/trainers/${id}/delete`),
                GET: (params: Record<string, any>) => concat('/v1/account/clients/my-ratings/trainers?' + QueryToString(params)),
            }
        }
    },
    GYMS: {
        REVIEWS: {
            ADD: {
                POST: (gym_id: number) => concat(`/v1/account/gyms/reviews/${gym_id}/add`)
            }
        }
    },
    DOCUMENTS: {
        GET: concat("/v1/account/my-documents"),
        PUT: (id: number) => concat(`/v1/account/my-documents/${id}`),
        POST: concat("/v1/account/my-documents"),
    },
    ABUSE_REPORT: {
        HISTORY: concat(`/v1/account/abuse-reports`),
        CREATE: {
            POST: concat(`/v1/account/abuse-reports`),
        }
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
    }
};

export const CLIENT_API = {
    SESSION: {
        ATTENDANCE: {
            GET: (session_id: number, date?: string) => concat(`/v2/protected/client/session/attendance/${session_id}/${date}`)
        }
    },
    MY_GYM: {
        GET: concat(`/v2/protected/client/my-gym`),
    },
    MY_TRAINER: {
        GET: (params: Record<string, string>) => concat("/v2/protected/client/my-trainers?" + QueryToString(params)),
        ALL: (params: Record<string, string>) => concat("/v2/protected/client/my-trainers/all?" + QueryToString(params))
    },
    MEMBERSHIP: {
        GET: (params: Record<string, string>) => concat("/v2/protected/client/membership?" + QueryToString(params)),
    }
}

export const TRAINER_API = {
    SESSION: {
        ATTENDANCE: {
            GET: (session_id: number, date?: string) => concat(`/v2/protected/client/session/attendance/${session_id}/${date}`)
        }
    },
    JOB_FEED: {
        APPLY: {
            POST: (id: number) => concat(`/v2/protected/trainer/xprto/job-feed/${id}/apply`),
        },
        MY_APPLICATIONS: {
            GET: (params: Record<string, any>) => concat('/v2/protected/trainer/xprto/job-feed/my-applications?' + QueryToString(params)),
        },
        GET: (params: Record<string, any>) => concat('/v2/protected/trainer/xprto/job-feed?' + QueryToString(params)),
        SPECIFIC: {
            GET: (id: number) => concat(`/v2/protected/trainer/xprto/job-feed/${id}`),
        }
    }
}
export const API_PUBLIC = {
    APPS_DATA: {
        POST: concat('/v1/apps-data'),
    },
    TRAINER_LIST: {
        FEEDBACK: {
            GET: (trainer_id: number) => concat(`/v1/public/trainers/feedback/${trainer_id}`),
            DASHBOARD: {
                GET: (trainer_id: number) => concat(`/v1/public/trainers/feedback/dashboard/${trainer_id}`),
            }
        },
        GET: (params: Record<string, any>) => concat('/v1/public/trainers?' + QueryToString(params)),
    },
    GYM_LIST: {
        TRAINER: {
            GET: (gym_id: number) => concat(`/v1/public/gyms/${gym_id}/trainers`)
        },
        FEEDBACK: {
            GET: (gym_id: number) => concat(`/v1/public/gyms/feedback/${gym_id}`),
            DASHBOARD: {
                GET: (gym_id: number) => concat(`/v1/public/gyms/feedback/dashboard/${gym_id}`),
            }
        },
        SPECIFIC_GYM: {
            SESSIONS: (gym_id: number) => concat(`/v1/public/gyms/${gym_id}/sessions`),
            gym_unavailability: (gym_id: number, month: number, year: number) => concat(`/v1/public/gyms/${gym_id}/unavailability?month=${month}&year=${year}`),
            GET: (gym_id: number) => concat(`/v1/public/gyms/${gym_id}`),
            MEMBERSHIP_LIST: {
                GET: (gym_id: number) => concat(`/v1/public/gyms/${gym_id}/membership`)
            }
        },
        GET: (params: Record<string, any>) => concat('/v1/public/gyms?' + QueryToString(params)),
    }
}
