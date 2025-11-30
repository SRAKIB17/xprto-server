const BASE_API = "http://localhost:8080"
const concat = (path: string, API: string = BASE_API) => {
    return `${API}/procte${path}`
}

export const GYM_API = {
    MEMBERSHIP_PLANS: {

    }
}

console.log(GYM_API)