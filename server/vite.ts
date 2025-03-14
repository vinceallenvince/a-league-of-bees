import express, { type Express, Request, Response, NextFunction } from "express";
import fs from "fs";
import path, { dirname } from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer, createLogger } from "vite";
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
import { type Server } from "http";
import viteConfig from "../vite.config";
import { nanoid } from "nanoid";
import logger from "./core/logger";

const viteLogger = createLogger();

// Keep the log function for backward compatibility, but use Winston internally
export function log(message: string, source = "express") {
  logger.info(message, { source });
}

export async function setupVite(app: Express, server: Server) {
  const hmrPort = process.env.HMR_PORT ? parseInt(process.env.HMR_PORT) : 24678;
  
  const serverOptions = {
    middlewareMode: true,
    hmr: { 
      server,
      port: hmrPort
    },
    allowedHosts: true,
  };

  const vite = await createViteServer({
    ...viteConfig,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        logger.error("Vite error", { message: msg, options });
        process.exit(1);
      },
      warn: (msg) => logger.warn("Vite warning", { message: msg }),
      info: (msg) => logger.info("Vite info", { message: msg }),
      warnOnce: (msg) => logger.warn("Vite warning (once)", { message: msg }),
    },
    server: serverOptions,
    appType: "custom",
  });

  app.use(vite.middlewares);
  
  // Handle all non-API routes to serve the SPA
  app.use("*", (req: Request, res: Response, next: NextFunction) => {
    const url = req.originalUrl;
    
    // Skip API routes - they are handled by the API router
    if (url.startsWith('/api')) {
      next();
      return;
    }

    try {
      const clientTemplate = path.resolve(
        __dirname,
        "..",
        "client",
        "index.html",
      );

      // always reload the index.html file from disk incase it changes
      fs.promises.readFile(clientTemplate, "utf-8")
        .then(template => {
          template = template.replace(
            `src="/src/main.tsx"`,
            `src="/src/main.tsx?v=${nanoid()}"`,
          );
          return vite.transformIndexHtml(url, template);
        })
        .then(page => {
          res.status(200).set({ "Content-Type": "text/html" }).end(page);
        })
        .catch(error => {
          vite.ssrFixStacktrace(error);
          logger.error("Vite SSR error", { 
            url, 
            error: error.message,
            stack: error.stack
          });
          next(error);
        });
    } catch (e) {
      vite.ssrFixStacktrace(e as Error);
      logger.error("Vite SSR error", { 
        url, 
        error: (e as Error).message,
        stack: (e as Error).stack
      });
      next(e);
    }
  });
}

export function serveStatic(app: Express) {
  const distPath = path.resolve(__dirname, "public");

  if (!fs.existsSync(distPath)) {
    logger.error("Build directory not found", { path: distPath });
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`,
    );
  }

  logger.info("Serving static files", { path: distPath });
  app.use(express.static(distPath));

  // Serve index.html for any non-API routes (SPA client-side routing)
  app.use("*", (req: Request, res: Response, next: NextFunction) => {
    const url = req.originalUrl;
    
    // Skip API routes - they are handled by the API router
    if (url.startsWith('/api')) {
      next();
      return;
    }
    
    res.sendFile(path.resolve(distPath, "index.html"));
  });
}
