import express from "express";
import { getConfig } from "./config/config";
import { agentsRouter } from "./api/agents";
import { sessionsRouter } from "./api/sessions";
import { metricsRouter } from "./api/metrics";
import { healthRouter } from "./api/health";

const app = express();
const config = getConfig();

app.use(express.json());

// Health checks
app.use("/health", healthRouter);
app.use("/ready", healthRouter);

// API routes
app.use("/api/agents", agentsRouter);
app.use("/api/sessions", sessionsRouter);
app.use("/api/metrics", metricsRouter);

const port = config.runtime.apiPort || process.env.PORT || 8080;

app.listen(port, () => {
  console.log(`Agent Runtime server listening on port ${port}`);
});

