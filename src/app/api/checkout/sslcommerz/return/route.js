import { completeCheckout, receiptURL } from '@/server/checkout';

// SSLCommerz posts the result from the member's browser (success, fail and cancel URLs).
// Nothing here trusts the post: the result is confirmed with SSLCommerz's validation API.
export async function POST(request) {
  const body = Object.fromEntries(await request.formData().catch(() => new FormData()));
  return Response.redirect(receiptURL(await completeCheckout(body)), 303);
}
