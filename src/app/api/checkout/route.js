import { CheckoutError, startCheckout } from '@/server/checkout';
import { sessionFrom } from '@/server/auth';

// POST /api/checkout { packageId } → { payment, redirectURL } (SSLCommerz's payment page).

const error = (status, code, message) => Response.json({ error: { code, message } }, { status });

export async function POST(request) {
  // Only the website's own pages may start a checkout (the session cookie is SameSite=Lax too).
  const origin = request.headers.get('origin');
  if (origin && origin !== new URL(request.url).origin && origin !== process.env.NEXT_PUBLIC_SITE_URL) {
    return error(403, 'BAD_ORIGIN', 'Request origin not allowed.');
  }
  const session = await sessionFrom(request);
  if (!session) return error(401, 'UNAUTHORIZED', 'Please log in.');
  if (session.user.status && session.user.status !== 'active') {
    return error(403, 'ACCOUNT_INACTIVE', `Your account is ${session.user.status}. Please contact support.`);
  }
  const body = await request.json().catch(() => ({}));
  try {
    return Response.json(await startCheckout(session.user, body?.packageId), { status: 201 });
  } catch (err) {
    if (err instanceof CheckoutError) return error(err.status, err.code, err.message);
    console.error('Checkout failed:', err);
    return error(500, 'SERVER_ERROR', 'Something went wrong. Please try again.');
  }
}
