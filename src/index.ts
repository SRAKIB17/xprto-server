import DevTools from "@tezx/devtools";
import { TezX } from "tezx";
import { loadEnv, serveStatic, wsHandlers } from "tezx/bun";
import { logger } from "tezx/middleware";
import { corsPolicy, swaggerUI } from "./middlewares/middlewares.js";
import { v1 } from "./routes/v1/index.js";
import { websocket } from "./routes/websocket/index.js";

const app = new TezX({
  env: loadEnv(),
  debugMode: true,
});


app.use(async (_, next) => {
  // console.log(_.req.header())
  await next();
  // console.log(_.headers)
})
app.use(corsPolicy)

app.use([logger({ enabled: process.env.NODE_ENV === "development" })]);

app.get("/", (ctx) => {
  console.log(ctx.env)
  return ctx.text("Hello from TezX (bun)");
});

app.static(serveStatic('public'));
app.use(corsPolicy)
app.use(v1);
app.use(websocket)

app.get("/devtools", DevTools(app, {
  // Optional
  // disableTabs: ['cookies', 'routes'],
  // extraTabs: (ctx) => [ ... ]
}));


app.get("/v1/docs/public", swaggerUI("/docs/v1/public/docs.json"))

const PORT = process.env.PORT;

Bun.serve({
  port: PORT,
  reusePort: true,
  development: process.env.NODE_ENV === "development",
  fetch: app.serve,
  websocket: wsHandlers(),
});
console.log(`🚀 TezX running on http://localhost:${PORT}`);
