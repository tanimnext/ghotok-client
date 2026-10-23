import { toNextJsHandler } from 'better-auth/next-js';
import { getAuth } from '@/server/auth';

// Better Auth's endpoints (sign-up, sign-in, sessions, password, admin plugin) at /api/auth/*.
// Route handlers win over the /api rewrite to ghotok-server (see next.config.mjs).

const handler = (request) => toNextJsHandler(getAuth())[request.method](request);

export const GET = handler;
export const POST = handler;
