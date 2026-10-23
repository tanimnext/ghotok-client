import { completeCheckout } from '@/server/checkout';

// SSLCommerz's server-to-server notification (IPN); safe to receive with or before the return.
export async function POST(request) {
  const body = Object.fromEntries(await request.formData().catch(() => new FormData()));
  const { status } = await completeCheckout(body);
  return Response.json({ ok: true, status });
}
