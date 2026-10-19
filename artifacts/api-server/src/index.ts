import { spawn } from "node:child_process";
import path from "node:path";
import app from "./app";
import { logger } from "./lib/logger";

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error(
    "PORT environment variable is required but was not provided.",
  );
}

const port = Number(rawPort);
const agriculturePort = Number(process.env["AGRI_API_PORT"] ?? "8099");

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

const workspaceRoot = path.resolve(process.cwd(), "../..");
const pythonExecutable = path.resolve(workspaceRoot, ".pythonlibs/bin/python");
const pythonAppDir = path.resolve(process.cwd(), "python");
const agricultureApi = spawn(
  pythonExecutable,
  [
    "-m",
    "uvicorn",
    "app.main:app",
    "--app-dir",
    pythonAppDir,
    "--host",
    "127.0.0.1",
    "--port",
    String(agriculturePort),
  ],
  {
    env: {
      ...process.env,
      CHROMA_DB_DIR: path.resolve(
        process.cwd(),
        "data/chroma",
      ),
    },
    stdio: "inherit",
  },
);

agricultureApi.on("error", (err) => {
  logger.error({ err }, "Could not start FastAPI agriculture service");
});
agricultureApi.on("exit", (code, signal) => {
  if (code !== 0 && code !== null) {
    logger.error({ code, signal }, "FastAPI agriculture service stopped");
  }
});

process.on("SIGTERM", () => agricultureApi.kill("SIGTERM"));
process.on("SIGINT", () => agricultureApi.kill("SIGINT"));

app.listen(port, (err) => {
  if (err) {
    logger.error({ err }, "Error listening on port");
    process.exit(1);
  }

  logger.info({ port }, "Server listening");
});
