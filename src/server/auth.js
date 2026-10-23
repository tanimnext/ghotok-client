import { betterAuth } from 'better-auth';
import { mongodbAdapter } from 'better-auth/adapters/mongodb';
import { APIError } from 'better-auth/api';
import { admin } from 'better-auth/plugins';
import { ObjectId } from 'mongodb';
import { getDb, getMongoClient } from './mongodb';

// Better Auth runs here, in the website: sign-up and sign-in with email + password, sessions
// ("remember me", signed-in devices), password changes, and the admin plugin (an admin
// creates accounts and sets passwords). It writes `user`, `account`, `session` and
// `verification` in the shared MongoDB database; ghotok-server reads the session cookie
// (`ghotok.session_token`, checked with the same BETTER_AUTH_SECRET) to know who calls it.
//
// Every new account is a member ("user"). An account becomes an admin only when its `role`
// is changed to "admin" in the database, or when an admin creates it as one.

const SITE_URL = process.env.BETTER_AUTH_URL || process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
const DEV_SECRET = 'dev-better-auth-secret-change-me-0123456789';
const INACTIVE = ['suspended', 'banned'];

/** Rejects suspended or banned accounts; signing in again reactivates a deactivated one. */
async function beforeSessionCreate(session) {
  const users = getDb().collection('user');
  const user = await users.findOne(
    { _id: new ObjectId(String(session.userId)) },
    { projection: { status: 1 } },
  );
  if (INACTIVE.includes(user?.status)) {
    throw new APIError('FORBIDDEN', {
      code: 'ACCOUNT_INACTIVE',
      message: `Your account is ${user.status}. Please contact support.`,
    });
  }
  const set = { lastLoginAt: new Date() };
  if (user?.status === 'deactivated') Object.assign(set, { status: 'active', deactivatedAt: null });
  if (user) await users.updateOne({ _id: user._id }, { $set: set });
}

function createAuth() {
  const secret = process.env.BETTER_AUTH_SECRET || DEV_SECRET;
  if (process.env.NODE_ENV === 'production' && secret === DEV_SECRET) {
    throw new Error('Set BETTER_AUTH_SECRET (the same value as ghotok-server) in production.');
  }
  return betterAuth({
    appName: 'Ghotok',
    baseURL: SITE_URL,
    basePath: '/api/auth',
    secret,
    trustedOrigins: [new URL(SITE_URL).origin],
    // A standalone MongoDB (no replica set) cannot run transactions, so they are off.
    database: mongodbAdapter(getDb(), { client: getMongoClient(), transaction: false }),
    emailAndPassword: {
      enabled: true,
      minPasswordLength: 8,
      maxPasswordLength: 128,
      requireEmailVerification: false,
      autoSignIn: true,
    },
    session: {
      expiresIn: 60 * 60 * 24 * 30, // 30 days; "remember me" off ends it with the browser session
      updateAge: 60 * 60 * 24,
    },
    user: {
      additionalFields: {
        // input: false — a member can never set these at sign-up or with update-user.
        status: { type: 'string', defaultValue: 'active', input: false },
        connectionBalance: { type: 'number', defaultValue: 0, input: false },
        language: { type: 'string', defaultValue: 'en', required: false },
      },
    },
    databaseHooks: {
      user: {
        create: {
          // Sign-up always makes a member; only an admin creating an account may choose its role.
          before: async (user, ctx) => ({
            data: {
              ...user,
              role: ctx?.path === '/admin/create-user' ? user.role || 'user' : 'user',
              status: 'active',
              connectionBalance: 0,
            },
          }),
        },
      },
      session: { create: { before: beforeSessionCreate } },
    },
    // `status` (active, suspended, banned, deactivated) is the source of truth for access;
    // the plugin's own ban fields are not used.
    plugins: [admin({ defaultRole: 'user', adminRoles: ['admin'] })],
    advanced: { cookiePrefix: 'ghotok' },
    rateLimit: { enabled: process.env.NODE_ENV === 'production', window: 60, max: 100 },
  });
}

/** The Better Auth instance (created on first use). */
export function getAuth() {
  globalThis.__ghotokAuth ??= createAuth();
  return globalThis.__ghotokAuth;
}

/** The signed-in member for a request, or null. */
export async function sessionFrom(request) {
  return getAuth().api.getSession({ headers: request.headers });
}
