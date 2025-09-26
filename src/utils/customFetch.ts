"use server";
import { Context } from "tezx";
import { BASE_URL } from "../config";
import { getCookie } from "tezx/helper";
// import { cookies } from "next/headers";

// Define a generic interface for the response that we expect from the API
interface FetchOptions extends RequestInit {
    body?: any; // the body can be any format
}

// Define a function for making fetch requests
export const Fetch = async (api: string, options: FetchOptions = {}, ctx: Context): Promise<any> => {
    try {
        // Set default headers and credentials for the fetch request
        const defaultHeaders: HeadersInit = {
            "Origin": BASE_URL as string,
            ...(typeof options.body == 'object' && !(options.body instanceof FormData) ? { 'Content-Type': 'application/json' } : {})
            // 'Authorization': `Bearer ${(await cookies()).get('session')?.value}`, // Optionally add a token if available
        };

        // Configure default fetch options, including credentials
        const defaultOptions: FetchOptions = {
            credentials: 'include', // Ensures cookies are sent with requests
            headers: defaultHeaders, // Use default headers for authorization
        };
        const body = typeof options.body == 'object' && !(options.body instanceof FormData) ? JSON.stringify(options.body) : options.body;
        // Merge the provided options with the defaults
        let s_id = getCookie(ctx, 's_id');
        const config: FetchOptions = {
            ...defaultOptions,
            ...options,
            body: body,
            headers: {
                ...defaultHeaders,
                "Authorization": `Bearer ${s_id}`,
                "Origin": BASE_URL,
                "s_id": `${s_id}`,
                ...(options.headers || {}), // Allow header overrides if provided
            },
        };

        // Perform the fetch request
        const response = await fetch(api, config);
        // // Check for a successful response
        // if (!response.ok) {
        //     const res = { success: false, message: 'Network response was not ok' }
        //     return await res;
        // }

        // Return the parsed JSON response (assuming the server responds with JSON)
        return await response.json();
    }
    catch {
        return {}
    }
};
