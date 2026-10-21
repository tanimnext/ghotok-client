'use client';

import { isValidEmail } from '@/shared';
import { authCall, authClient, toPhoneNumber } from '@/lib/auth-client';

// The Better Auth calls behind the sign-in forms. A member types an email or a
// Bangladeshi mobile number; these pick the matching email or phone endpoint.

/** `{ email }` or `{ phoneNumber }` for what the member typed, or null when it is neither. */
export function parseIdentifier(value) {
  const text = String(value ?? '').trim();
  if (isValidEmail(text)) return { email: text.toLowerCase() };
  const phoneNumber = toPhoneNumber(text);
  return phoneNumber ? { phoneNumber } : null;
}

export function signInWithPassword(id, password, rememberMe) {
  return id.email
    ? authCall(authClient.signIn.email({ email: id.email, password, rememberMe }))
    : authCall(authClient.signIn.phoneNumber({ phoneNumber: id.phoneNumber, password, rememberMe }));
}

export function sendSignInCode(id) {
  return id.email
    ? authCall(authClient.emailOtp.sendVerificationOtp({ email: id.email, type: 'sign-in' }))
    : authCall(authClient.phoneNumber.sendOtp({ phoneNumber: id.phoneNumber }));
}

export function signInWithCode(id, code) {
  return id.email
    ? authCall(authClient.signIn.emailOtp({ email: id.email, otp: code }))
    : authCall(authClient.phoneNumber.verify({ phoneNumber: id.phoneNumber, code }));
}

/** Sends a code to confirm the email or mobile number of the signed-in member. */
export function sendVerificationCode(id) {
  return id.email
    ? authCall(authClient.emailOtp.sendVerificationOtp({ email: id.email, type: 'email-verification' }))
    : authCall(authClient.phoneNumber.sendOtp({ phoneNumber: id.phoneNumber }));
}

export function verifyCode(id, code) {
  return id.email
    ? authCall(authClient.emailOtp.verifyEmail({ email: id.email, otp: code }))
    : authCall(authClient.phoneNumber.verify({ phoneNumber: id.phoneNumber, code, updatePhoneNumber: true }));
}

export function requestPasswordReset(id) {
  return id.email
    ? authCall(authClient.emailOtp.requestPasswordReset({ email: id.email }))
    : authCall(authClient.phoneNumber.requestPasswordReset({ phoneNumber: id.phoneNumber }));
}

export function resetPassword(id, code, password) {
  return id.email
    ? authCall(authClient.emailOtp.resetPassword({ email: id.email, otp: code, password }))
    : authCall(
        authClient.phoneNumber.resetPassword({
          phoneNumber: id.phoneNumber,
          otp: code,
          newPassword: password,
        }),
      );
}

/** Full-page redirect to Google; it comes back to /auth/continue, which routes by role. */
export function signInWithGoogle(next) {
  const params = next ? `?next=${encodeURIComponent(next)}` : '';
  return authCall(
    authClient.signIn.social({
      provider: 'google',
      callbackURL: `/auth/continue${params}`,
      errorCallbackURL: '/login?error=google',
    }),
  );
}
