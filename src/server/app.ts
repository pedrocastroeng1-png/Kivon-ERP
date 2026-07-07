import express from 'express';
import cors from 'cors';
import path from 'path';
import { apiRouter } from './routes/index.js';

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api', apiRouter);

// Frontend serving
if (process.env.NODE_ENV !== 'production') {
  // Use dynamic import so 'vite' isn't required in production/Vercel
  import('vite').then(({ createServer: createViteServer }) => {
    createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    }).then((vite) => {
      app.use(vite.middlewares);
    });
  }).catch((err) => console.error('Failed to start Vite:', err));
} else {
  // Only serve static files in production if we are running the standalone server
  // On Vercel, the rewrites in vercel.json bypass this for static files.
  const distPath = path.join(process.cwd(), 'dist');
  app.use(express.static(distPath));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

// Global Error Handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('[Global Error Handler]', err);
  res.status(err.status || 500).json({
    success: false,
    error: err.message || 'Internal Server Error',
    code: err.code || null,
    details: err.details || null,
    hint: err.hint || null
  });
});

export default app;
