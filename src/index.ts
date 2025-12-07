import DevTools from "@tezx/devtools";
import { TezX } from "tezx";
import { logger } from "tezx/middleware";
import { serveStatic, } from "tezx/static";
import { wsHandlers } from "tezx/ws";
import { corsPolicy, swaggerUI } from "./middlewares/middlewares.js";
import { v1 } from "./routes/v1/index.js";
import { v2 } from "./routes/v2/index.js";
import { websocket } from "./routes/websocket/index.js";
const app = new TezX();

app.use(corsPolicy);

// app.use(async (_, next) => {
//   // console.log(_.req.header())
//   await next();
//   console.log(_.headers)
// })
app.use([logger({ enabled: process.env.NODE_ENV === "development" })]);

app.get("/", (ctx) => {
  return ctx.text("Hello from TezX (bun)");
});

app.static(serveStatic('public'));
app.use(corsPolicy)
app.use(v1);
// version 2
app.use(v2);
app.use(websocket)
app.get("/devtools", DevTools(app,));

app.get("/v1/docs/public", swaggerUI("/docs/v1/public/docs.json"))
app.get("/v1/docs/gym", swaggerUI("/docs/v1/gym.json"))
app.get("/v1/docs/gym/document", swaggerUI("/docs/v1/gym/document.json"))
app.get("/v1/docs/gym/leave-request", swaggerUI("/docs/v1/gym/leave-request.json"))
app.get("/v1/docs/chatroom", swaggerUI("/docs/v1/chatroom.json"))

const PORT = process.env.PORT;

Bun.serve({
  port: PORT,
  reusePort: true,
  development: process.env.NODE_ENV === "development",
  fetch: app.serve,
  websocket: wsHandlers(),
});
console.log(`🚀 TezX running on http://localhost:${PORT}`);
