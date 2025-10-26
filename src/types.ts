export type CtxAuth = {
    role: 'client' | 'trainer' | 'gym' | 'admin';
    user_info: Record<string, any>
}