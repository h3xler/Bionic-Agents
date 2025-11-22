import express, { type Express } from "express";
import fs from "fs";
import { type Server } from "http";
import { nanoid } from "nanoid";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import viteConfig from "../../vite.config";

export async function setupVite(app: Express, server: Server) {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true as const,
  };

  const vite = await createViteServer({
    ...viteConfig,
    configFile: false,
    server: serverOptions,
    appType: "custom",
  });

  app.use(vite.middlewares);
  app.use("*", async (req, res, next) => {
    const url = req.originalUrl;

    try {
      const clientTemplate = path.resolve(
        __dirname,
        "../..",
        "client",
        "index.html"
      );

      // always reload the index.html file from disk incase it changes
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e as Error);
      next(e);
    }
  });
}

export function serveStatic(app: Express) {
  // In production, the working directory is /app, so dist/public is at /app/dist/public
  // Try multiple path resolution methods to handle both bundled and unbundled scenarios
  let distPath: string;
  
  // Method 1: Use environment variable if set
  if (process.env.STATIC_DIR) {
    distPath = process.env.STATIC_DIR;
  }
  // Method 2: Use absolute path (works in container)
  else if (fs.existsSync("/app/dist/public")) {
    distPath = "/app/dist/public";
  }
  // Method 3: Use process.cwd() (should be /app in container)
  else {
    distPath = path.resolve(process.cwd(), "dist", "public");
  }
  
  if (!fs.existsSync(distPath)) {
    console.error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
    console.error(`Tried paths: ${process.env.STATIC_DIR || "N/A"}, /app/dist/public, ${path.resolve(process.cwd(), "dist", "public")}`);
    return;
  }

  console.log(`[Static] Serving from: ${distPath}`);
  app.use(express.static(distPath));

  // fall through to index.html if the file doesn't exist
  app.use("*", (_req, res) => {
    res.sendFile(path.resolve(distPath, "index.html"));
  });
}
