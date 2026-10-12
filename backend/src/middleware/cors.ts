import cors from 'cors';

const productionOrigin = 'https://api-flow-kappa.vercel.app';
const configuredOrigins = (process.env.FRONTEND_ORIGINS || '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

export function isAllowedBrowserOrigin(origin: string): boolean {
  if (origin === productionOrigin || configuredOrigins.includes(origin)) return true;

  return process.env.NODE_ENV !== 'production' &&
    (/^http:\/\/localhost(?::\d+)?$/.test(origin) || /^http:\/\/127\.0\.0\.1(?::\d+)?$/.test(origin));
}

export const corsMiddleware = cors({
  origin: (origin, callback) => {
    // Requests without Origin are non-browser clients or same-origin server traffic.
    if (!origin || isAllowedBrowserOrigin(origin)) {
      callback(null, true);
    } else {
      const error = Object.assign(new Error('CORS origin is not allowed'), {
        status: 403,
        code: 'CORS_ORIGIN_REJECTED',
      });
      callback(error);
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-Id'],
});
