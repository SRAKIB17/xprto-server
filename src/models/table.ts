// src/db/tables.ts
const database = 'u476740337_xprto';

const concat = (table: string, db: string = database) => {
    return `${db}.${table}`
}
export const TABLES = {
    CLIENTS: {
        HEALTH_CONDITIONS: concat("client_health_conditions"),
        MUSCLES_RECORD: concat("client_muscles_record"),
        clients: concat("clients"),
        GYM_TRIAL_BOOKING: concat("client_gym_trial_booking"),
        SESSION_ASSIGNMENT_CLIENTS: concat("session_assignment_clients")
    },
    MEMBERSHIP_JOIN: {
        TRAINER_GYMS: concat("trainer_gyms")
    },
    TRAINERS: {
        SESSION_RUNS: concat("session_runs"),
        RED_FLAGS: concat("trainer_red_flags"),
        LEAVE_REQUESTS: concat("trainer_leaves"),
        job_applications: concat("trainer_job_applications"),
        WEEKLY_SLOTS: {
            WEEKLY_SLOTS: concat("trainer_weekly_slots"),
        },
        services: concat("trainer_services"),
        kyc_verification: concat("trainer_kyc_verification"),
        badge_verification: concat("trainer_badge_verification"),
        trainers: concat("trainers"),
        BOOKING_REQUESTS: concat("booking_requests")
    },
    GYMS: {
        PLANS: concat("membership_plans"),
        SESSIONS: concat('gym_sessions'),
        job_posts: concat("job_posts"),
        gyms: concat("gyms"),
        UNAVAILABILITY: concat("gym_unavailability")
    },
    PLANS: {
        WORKOUT_PLANS: {
            EXERCISE: concat("workout_exercises"),
            PLANS: concat("workout_plans")
        },
        NUTRITION: {
            PLANS: concat('nutrition_plans'),
            MEAL: concat("nutrition_plan_meals")
        }
    },
    ADMIN: {
        admin: concat("admin_details"),
    },
    ABUSE_REPORTS: {
        HISTORY: concat("abuse_reports")
    },
    WALLETS: {
        WALLET_PAYOUTS: concat("wallet_payouts"),
        WALLETS: concat('wallets'),
        transactions: concat("wallet_transactions")
    },
    SUPPORT_TICKETS: {
        SUPPORT_TICKETS: concat('support_tickets'),
        SUPPORT_MESSAGES: concat("support_messages")
    },
    NOTIFICATIONS: concat("notifications"),
    USER_DOCUMENTS: concat("user_documents"),
    FEEDBACK: {
        GYM_TRAINER_CLIENT: concat("gym_feedbacks"),
        CLIENT_TRAINER: concat("client_trainer_feedback")
    },
    ATTENDANCE: {
        SESSION_ATTENDANCES: concat("session_attendances")
    },
    CHAT_ROOMS: {
        chat_rooms: concat('chat_rooms'),
        memberships: concat('chat_room_memberships'),
        messages: concat('chat_messages')
    }

} as const;
// ('client', 'gym', 'trainer', 'admin') 
// 👉 type এর জন্য
export type TableName = (typeof TABLES)[keyof typeof TABLES];
