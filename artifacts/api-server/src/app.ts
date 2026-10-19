import express, { type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import router from "./routes";
import { logger } from "./lib/logger";

const app: Express = express();

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api/agriculture", async (req, res): Promise<void> => {
  const pythonPort = Number(process.env["AGRI_API_PORT"] ?? "8099");
  const upstreamPath = req.originalUrl.replace(/^\/api/, "");

  try {
    const upstream = await fetch(
      `http://127.0.0.1:${pythonPort}${upstreamPath}`,
      {
        method: req.method,
        headers: { "content-type": "application/json" },
        body:
          req.method === "GET" || req.method === "HEAD"
            ? undefined
            : JSON.stringify(req.body ?? {}),
      },
    );

    res.status(upstream.status);
    const contentType = upstream.headers.get("content-type");
    if (contentType) {
      res.setHeader("content-type", contentType);
    }

    res.send(Buffer.from(await upstream.arrayBuffer()));
  } catch (err) {
    req.log.error({ err }, "Agriculture API is unavailable");
    res.status(502).json({
      error: "Dịch vụ nông nghiệp chưa sẵn sàng. Vui lòng thử lại sau.",
    });
  }
});

app.use("/api", router);

export default app;
