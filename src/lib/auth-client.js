'use client';

import { createAuthClient } from 'better-auth/react';
import { emailOTPClient, inferAdditionalFields, phoneNumberClient } from 'better-auth/client/plugins';
import { isValidPhone, normalizePhone } from '@/shared';
import { ApiError } from '@/shared/api-client';

// Better Auth client. Sign-up, sign-in, sessions and passwords go through it; the
// rest of the API uses lib/api. Requests go to /api/auth on this origin, which
// next.config.mjs forwards to ghotok-server, so the session cookie is first-party.
export const authClient = createAuthClient({
  basePath: '/api/auth',
  plugins: [
    emailOTPClient(),
    phoneNumberClient(),
    // Fields ghotok-server adds to the Better Auth user (see its src/config/auth.js).
    inferAdditionalFields({
      user: {
        role: { type: 'string', input: false },
        language: { type: 'string', required: false },
        status: { type: 'string', input: false },
        connectionBalance: { type: 'number', input: false },
      },
    }),
  ],
});

/**
 * Unwraps a Better Auth `{ data, error }` result: returns `data` or throws an
 * ApiError, so forms can show errors with useErrorMessage like any API error.
 * @template T
 * @param {Promise<{ data: T, error: null | { status: number, code?: string, message?: string } }>} call
 * @returns {Promise<T>}
 */
export async function authCall(call) {
  let result;
  try {
    result = await call;
  } catch {
    throw new ApiError(0, 'NETWORK', 'Cannot reach the server.');
  }
  const { data, error } = result ?? {};
  if (error) {
    const code = error.code ?? (error.status === 429 ? 'RATE_LIMITED' : 'SERVER_ERROR');
    throw new ApiError(error.status ?? 500, code, error.message ?? error.statusText ?? '', error.details);
  }
  return data;
}

/** The member as the app uses it, from a Better Auth session. */
export function toAppUser(sessionData) {
  if (!sessionData?.user) return null;
  const u = sessionData.user;
  return {
    ...u,
    role: u.role ?? 'user',
    phone: u.phoneNumber ?? null,
    phoneVerified: !!u.phoneNumberVerified,
    emailVerified: !!u.emailVerified,
    sessionToken: sessionData.session?.token ?? null,
  };
}

/** Where a member goes after signing in: admins to the admin dashboard, everyone else to theirs. */
export function homeFor(user, next) {
  if (user?.role === 'admin') return next?.startsWith('/admin') ? next : '/admin';
  return next && !next.startsWith('/admin') ? next : '/dashboard';
}

/**
 * A Bangladeshi mobile number in the one form both apps store (01XXXXXXXXX), the
 * same normalisation ghotok-server applies, or null when it is not valid.
 */
export function toPhoneNumber(input) {
  return isValidPhone(input) ? normalizePhone(input) : null;
}
