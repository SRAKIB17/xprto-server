import { Callback, Router } from "tezx";
import { upgradeWebSocket } from "tezx/bun";
import { generateUUID } from "tezx/helper";

const clients = new Map<string, WebSocket>(); // store user_id/request_id → ws

const notifications = new Router({
    basePath: "/notifications",
});

notifications.get(
    "/push",
    upgradeWebSocket((ctx) => {
        // Extract identity (user or guest)
        let userId: string | null = ctx.req.query?.user_id as string;
        if (!userId) {
            userId = `guest_${generateUUID()}`; // fallback guest
        }

        return {
            open(ws) {
                clients.set(userId!, ws);
                console.log(`Connected: ${userId}`);
                ws.send(JSON.stringify({ 'title': "Connected", message: "Welcome" }))
            },
            message(ws, data) {
                try {
                    const parsed = JSON.parse(data.toString());
                    const { type, title, message, to } = parsed;

                    if (to === "all") {
                        // Broadcast to everyone
                        for (const [, client] of clients) {
                            if (client.readyState === 1) {
                                client.send(JSON.stringify({ type, title, message }));
                            }
                        }
                    } else if (to && clients.has(to)) {
                        // Send to specific user
                        const client = clients.get(to)!;
                        if (client.readyState === 1) {
                            client.send(JSON.stringify({ type, title, message }));
                        }
                    } else {
                        // Echo back if invalid
                        ws.send(JSON.stringify({ type: "error", message: "Invalid target" }));
                    }
                } catch (err) {
                    console.error("Message error:", err);
                    ws.send(JSON.stringify({ type: "error", message: "Bad payload" }));
                }
            },
            close(ws, { code, reason }) {
                clients.delete(userId!);
                console.log(`Closed: ${userId}`, code, reason);
            },
            error(ws, err) {
                clients.delete(userId!);
                console.error("Error:", userId, err);
            },
        };
    }) as unknown as Callback
);

export { notifications };
