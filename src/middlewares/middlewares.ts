import { cors } from "tezx/middleware";

// let limit = rateLimiter({
//     maxRequests: 1,
//     windowMs: 10_000,
//     onError(ctx, r, error) {
//         return ctx.json({ error: error.message })
//     }
// });

// let log = logger();
// let protection = xssProtection({
//     enabled: (ctx) => true, // Disable for admin routes
//     // enabled: (ctx) => !ctx.isAdmin, // Disable for admin routes
//     mode: "block", // Sanitize instead of block
//     fallbackCSP: "default-src 'self' https://trusted.cdn.com",
// })
// let powered = poweredBy("PaperNxt");
// let secure = secureHeaders({
//     // contentSecurityPolicy: "default-src 'self'",
//     frameGuard: true,
//     hsts: true,
//     referrerPolicy: "no-referrer",
// });

// let sanitized = sanitizeHeaders({
//     whitelist: [
//         "accept",
//         "accept-language",
//         "authorization",
//         "content-type",
//         "cookie",
//         "date",
//         "host",
//         "origin",
//         "referer",
//         "user-agent",
//         "x-requested-with",
//         "x-auth-token",
//         "x-csrf-token",
//         "x-frame-options",
//         "x-forwarded-for",
//         "x-forwarded-proto",
//         "x-transaction-id",
//         "x-ssl-client-cert",
//         "x-client-ip",
//         "x-custom-header"
//     ],
//     blacklist: [
//         "x-powered-by",
//         "server",
//         "via",
//         "x-xss-protection",
//         "set-cookie",
//         "connection",
//         "accept-encoding",
//         "transfer-encoding",
//         "content-length",
//         "pragma",
//         "cache-control",
//         "date",
//         "access-control-allow-origin",
//         "access-control-allow-credentials",
//         "access-control-allow-methods",
//         "access-control-allow-headers"
//     ],
//     normalizeKeys: true,
//     allowUnsafeCharacters: false,
// })
export let ALlowCorsOrigin = [
    // Production domains
    "https://papernxt.com",
    "https://www.papernxt.com",
    "https://api.papernxt.com",
    "https://ai.papernxt.com",
    "https://cdn.papernxt.com",

    // Beta, Dev, and Staging subdomains
    "https://beta.papernxt.com",
    "https://dev.papernxt.com",
    "https://staging.papernxt.com",

    // // Regex for dynamic subdomains like xxx.beta.papernxt.com
    // /\.beta\.papernxt\.com$/,
    // /\.dev\.papernxt\.com$/,
    // /\.staging\.papernxt\.com$/,

    // Localhost (dev machine)
    "http://localhost:3000",
    "http://localhost:3001",
    "http://localhost:8080",
    "http://localhost:8081",
    "http://localhost:8082",

    // LAN IPs for local network testing
    "http://192.168.0.197:3001"
];

export const AllowSite = [
    // Production domains
    "https://papernxt.com",
    "https://www.papernxt.com",
    "https://api.papernxt.com",
    "https://ai.papernxt.com",
    "https://cdn.papernxt.com",

    "https://papernxt.com/",
    "https://www.papernxt.com/",
    "https://api.papernxt.com/",
    "https://ai.papernxt.com/",
    "https://cdn.papernxt.com/",
    // Beta, Dev, and Staging subdomains
    "https://beta.papernxt.com",
    "https://dev.papernxt.com",
    "https://staging.papernxt.com",

    "https://beta.papernxt.com/",
    "https://dev.papernxt.com/",
    "https://staging.papernxt.com/",
    // // Regex for dynamic subdomains like xxx.beta.papernxt.com
    // /\.beta\.papernxt\.com$/,
    // /\.dev\.papernxt\.com$/,
    // /\.staging\.papernxt\.com$/,

    // Localhost (dev machine)
    "http://localhost:3000",
    "http://localhost:3001",
    "http://localhost:8080",
    "http://localhost:8081",
    "http://localhost:8082",


    "http://localhost:3000/",
    "http://localhost:3001/",
    "http://localhost:8080/",
    "http://localhost:8081/",
    "http://localhost:8082/",
    // LAN IPs for local network testing
    "http://192.168.0.197:3001"
];


export let corsPolicy = cors({
    methods: ['GET', "POST", "DELETE", "PUT"],
    credentials: true,
    origin: (origin) => {
        return true;
    }
})

// export let corsPolicy = cors({
//     methods: ['GET', "POST", "DELETE", "PUT"],
//     credentials: true,
//     origin: [
//         "https://production.com",
//         /\.staging\.com$/,
//         "http://localhost:3000",
//     ],
// })

// export let middleware = [log, cor,]

// export let middleware = [cor, log, powered, protection, secure, detectBot({
//     customBotDetector: function customBotDetector(ctx) {
//         return true
//     }
// })]