import { TezX } from "tezx";
import { loadEnv, serveStatic, wsHandlers } from "tezx/bun";
import { cors, logger } from "tezx/middleware";

const app = new TezX({
  env: loadEnv(),
  debugMode: true,
});
app.use(cors())
app.use([logger()]);
app.get("/", (ctx) => {
  console.log(ctx.env)
  return ctx.text("Hello from TezX (bun)");
});

app.static(serveStatic('public'));

export function swaggerUI(
  jsonPath: string = "docs.json",
  swaggerVersion: string = "5.11.0",
  meta?: {
    title?: string;
    metaDescription?: string;
  }
) {
  return (ctx: any) => {
    return ctx.html(`
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${meta?.title || "SwaggerUI"}</title>
  <meta name="description" content="${meta?.metaDescription || "SwaggerUI Documentation"}" />
  <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@${swaggerVersion}/swagger-ui.css" />
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="https://unpkg.com/swagger-ui-dist@${swaggerVersion}/swagger-ui-bundle.js" crossorigin></script>
  <script src="https://unpkg.com/swagger-ui-dist@${swaggerVersion}/swagger-ui-standalone-preset.js" crossorigin></script>
  <script>
   window.onload = () => {
      window.ui = SwaggerUIBundle({
        url: "${jsonPath}",
        dom_id: '#swagger-ui',
        presets: [
          SwaggerUIBundle.presets.apis,
          SwaggerUIStandalonePreset
        ],
      });
    };
  </script>
</body>
</html>
`);
  };
}
app.get("_docs", swaggerUI())
const PORT = process.env.PORT;

Bun.serve({
  port: PORT,
  reusePort: true,
  development: process.env.NODE_ENV === "development",
  fetch: app.serve,
  websocket: wsHandlers(),
});
console.log(`🚀 TezX running on http://localhost:${PORT}`);
