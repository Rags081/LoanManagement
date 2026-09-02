import { defineConfig, Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';

function netlifyFunctionsDevPlugin(): Plugin {
  return {
    name: 'netlify-functions-dev-plugin',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url || !req.url.startsWith('/api/')) {
          return next();
        }

        const rawUrl = req.url;
        const urlPath = rawUrl.split('?')[0];
        const functionRoute = urlPath.replace(/^\/api\//, ''); // e.g. "auth/login"

        // Candidate function file locations
        const topModule = functionRoute.split('/')[0];
        const candidateFiles = [
          path.resolve(__dirname, `netlify/functions/${functionRoute}.ts`),
          path.resolve(__dirname, `netlify/functions/${functionRoute}/index.ts`),
          path.resolve(__dirname, `netlify/functions/${functionRoute.replace('/', '-')}.ts`),
          path.resolve(__dirname, `netlify/functions/${topModule}.ts`),
          path.resolve(__dirname, `netlify/functions/${topModule}/index.ts`),
          path.resolve(__dirname, `netlify/functions/${functionRoute.split('/').pop()}.ts`),
        ];

        let targetFile: string | null = null;
        for (const file of candidateFiles) {
          try {
            if (fs.existsSync(file) && fs.statSync(file).isFile()) {
              targetFile = file;
              break;
            }
          } catch {
            // continue
          }
        }

        if (!targetFile) {
          console.warn(`[API Dev] No function found for route: ${functionRoute}`);
          res.statusCode = 404;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: 'Function Not Found', route: functionRoute }));
          return;
        }

        try {
          // Read request body
          let body = '';
          for await (const chunk of req) {
            body += chunk;
          }

          console.log(`[API Dev] ${req.method} ${rawUrl} -> target: ${targetFile}`);

          // Transpile and load the Netlify Function handler using Vite SSR module loader
          const module = await server.ssrLoadModule(targetFile);
          const handler = module.handler;

          if (typeof handler !== 'function') {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(
              JSON.stringify({
                error: 'Invalid Function Handler',
                message: `No handler function exported from ${targetFile}`,
              })
            );
            return;
          }

          // Construct Netlify HandlerEvent
          const headers: Record<string, string> = {};
          for (const [k, v] of Object.entries(req.headers)) {
            if (typeof v === 'string') headers[k.toLowerCase()] = v;
            else if (Array.isArray(v)) headers[k.toLowerCase()] = v.join(', ');
          }

          const queryParams = Object.fromEntries(new URLSearchParams(rawUrl.split('?')[1] || ''));

          const event = {
            rawUrl: `http://${req.headers.host || 'localhost:5173'}${req.url}`,
            rawQuery: rawUrl.includes('?') ? rawUrl.split('?')[1] : '',
            path: urlPath,
            httpMethod: req.method || 'GET',
            headers,
            multiValueHeaders: {},
            queryStringParameters: queryParams,
            multiValueQueryStringParameters: null,
            body: body || null,
            isBase64Encoded: false,
          };

          const result = await handler(event, {});
          console.log(`[API Dev Handler Output] ${req.method} ${rawUrl} status: ${result.statusCode} body length: ${result.body?.length}`);

          res.statusCode = result.statusCode || 200;
          if (result.headers) {
            for (const [key, val] of Object.entries(result.headers)) {
              if (val !== undefined) {
                res.setHeader(key, val);
              }
            }
          }
          res.end(result.body || '');
        } catch (err: unknown) {
          const errorObj = err as Error;
          console.error(`[API Dev Error on ${req.method} ${req.url}]:`, errorObj);
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json');
          res.end(
            JSON.stringify({
              error: 'Internal Server Error',
              message: errorObj.message || 'An error occurred executing the function handler',
              stack: process.env.NODE_ENV !== 'production' ? errorObj.stack : undefined,
            })
          );
        }
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), netlifyFunctionsDevPlugin()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-query': ['@tanstack/react-query'],
          'vendor-charts': ['recharts'],
          'vendor-excel': ['exceljs', 'file-saver'],
          'vendor-utils': ['date-fns', 'decimal.js', 'clsx', 'tailwind-merge'],
        },
      },
    },
    chunkSizeWarningLimit: 600,
  },
});
