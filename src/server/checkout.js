import { ObjectId } from 'mongodb';
import { getDb } from './mongodb';

// SSLCommerz hosted checkout (https://developer.sslcommerz.com), run by the website: cards,
// bKash, Nagad, Rocket and internet banking on SSLCommerz's page. Flow: create a payment and
// an SSLCommerz session → the member pays on GatewayPageURL → SSLCommerz posts the result to
// /api/checkout/sslcommerz/return (the member's browser) and /ipn (its servers) → the result
// is confirmed with SSLCommerz's validation API before anything is credited.
//
// Payments, the connection ledger and notifications are written in the same shapes and
// collections ghotok-server uses (`payments`, `connectiontransactions`, `notifications`,
// `counters`), so the API shows them in history, receipts, refunds and the admin dashboard.

const env = () => ({
  enabled: ['true', '1'].includes(String(process.env.SSLCOMMERZ_ENABLED ?? '').toLowerCase()),
  baseURL: process.env.SSLCOMMERZ_BASE_URL || 'https://sandbox.sslcommerz.com',
  storeId: process.env.SSLCOMMERZ_STORE_ID,
  storePassword: process.env.SSLCOMMERZ_STORE_PASSWORD,
  siteURL: (
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.BETTER_AUTH_URL ||
    'http://localhost:3000'
  ).replace(/\/$/, ''),
});

/** True when SSLCommerz is switched on and has its store credentials. */
export function checkoutEnabled() {
  const e = env();
  return e.enabled && !!(e.storeId && e.storePassword);
}

/** An error the route turns into `{ error: { code, message } }` with `status`. */
export class CheckoutError extends Error {
  constructor(status, code, message) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

const form = (data) => new URLSearchParams(Object.entries(data).map(([k, v]) => [k, String(v ?? '')]));
const collection = (name) => getDb().collection(name);

/** The member's package discount in percent (site setting; members whose biodata is live). */
export async function discountFor(userId) {
  const setting = await collection('settings').findOne({ key: 'payments' });
  const percent = Number(setting?.value?.approvedDiscountPercent ?? 0);
  if (!(percent > 0)) return 0;
  const approved = await collection('biodatas').findOne(
    { user: new ObjectId(String(userId)), status: 'approved', deletedAt: null },
    { projection: { _id: 1 } },
  );
  return approved ? Math.min(90, percent) : 0;
}

const discounted = (price, percent) => Math.round(price * (1 - percent / 100));

/** INV-YYMMDD-n, from the same `invoice` counter ghotok-server uses. */
async function nextInvoiceNo() {
  const counter = await collection('counters').findOneAndUpdate(
    { _id: 'invoice' },
    { $inc: { seq: 1 } },
    { upsert: true, returnDocument: 'after' },
  );
  const ymd = new Date().toISOString().slice(2, 10).replace(/-/g, '');
  return `INV-${ymd}-${10000 + counter.seq}`;
}

/**
 * Starts an SSLCommerz checkout for a package.
 * @param {{ id: string, name: string, email: string, phoneNumber?: string }} user the signed-in member
 * @returns {Promise<{ payment: object, redirectURL: string }>}
 */
export async function startCheckout(user, packageId) {
  if (!checkoutEnabled()) {
    throw new CheckoutError(
      503,
      'PAYMENTS_UNAVAILABLE',
      'Online payment is not available right now. Please try again later or contact support.',
    );
  }
  if (!ObjectId.isValid(String(packageId))) throw new CheckoutError(404, 'NOT_FOUND', 'Package not found.');
  const pkg = await collection('packages').findOne({ _id: new ObjectId(String(packageId)), isActive: true });
  if (!pkg) throw new CheckoutError(404, 'NOT_FOUND', 'Package not found.');

  const userId = new ObjectId(String(user.id));
  const now = new Date();
  const payment = {
    invoiceNo: await nextInvoiceNo(),
    user: userId,
    package: pkg._id,
    packageName: pkg.name,
    connections: pkg.connections,
    amount: discounted(pkg.price, await discountFor(userId)),
    method: 'sslcommerz',
    mode: 'gateway',
    status: 'initiated',
    createdAt: now,
    updatedAt: now,
  };
  const { insertedId } = await collection('payments').insertOne(payment);

  const e = env();
  let session;
  try {
    const res = await fetch(`${e.baseURL}/gwprocess/v4/api.php`, {
      method: 'POST',
      body: form({
        store_id: e.storeId,
        store_passwd: e.storePassword,
        total_amount: payment.amount.toFixed(2),
        currency: 'BDT',
        tran_id: payment.invoiceNo,
        success_url: `${e.siteURL}/api/checkout/sslcommerz/return`,
        fail_url: `${e.siteURL}/api/checkout/sslcommerz/return`,
        cancel_url: `${e.siteURL}/api/checkout/sslcommerz/return`,
        ipn_url: `${e.siteURL}/api/checkout/sslcommerz/ipn`,
        cus_name: user.name,
        cus_email: user.email || 'no-email@ghotok.com.bd',
        cus_phone: user.phoneNumber || '01700000000',
        cus_add1: 'Bangladesh',
        cus_city: 'Dhaka',
        cus_country: 'Bangladesh',
        shipping_method: 'NO',
        num_of_item: 1,
        product_name: `${payment.connections} connections`,
        product_category: 'Service',
        product_profile: 'non-physical-goods',
      }),
      signal: AbortSignal.timeout(30000),
    });
    session = await res.json().catch(() => ({}));
    if (session.status !== 'SUCCESS' || !session.GatewayPageURL) {
      throw new Error(`SSLCommerz session failed: ${session.failedreason ?? JSON.stringify(session)}`);
    }
  } catch (err) {
    console.error(`Checkout ${payment.invoiceNo} failed to start:`, err.message);
    await collection('payments').updateOne(
      { _id: insertedId },
      { $set: { status: 'failed', updatedAt: new Date() } },
    );
    throw new CheckoutError(
      502,
      'GATEWAY_ERROR',
      'The payment gateway is not responding. Please try again in a few minutes.',
    );
  }
  await collection('payments').updateOne(
    { _id: insertedId },
    {
      $set: {
        gateway: { paymentId: payment.invoiceNo, response: { sessionkey: session.sessionkey } },
        updatedAt: new Date(),
      },
    },
  );
  return {
    payment: {
      id: insertedId.toString(),
      invoiceNo: payment.invoiceNo,
      amount: payment.amount,
      connections: payment.connections,
      status: payment.status,
    },
    redirectURL: session.GatewayPageURL,
  };
}

async function validate(valId) {
  const e = env();
  const url = new URL(`${e.baseURL}/validator/api/validationserverAPI.php`);
  url.search = form({
    val_id: valId,
    store_id: e.storeId,
    store_passwd: e.storePassword,
    format: 'json',
  }).toString();
  const res = await fetch(url, { signal: AbortSignal.timeout(30000) });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`SSLCommerz validation failed with ${res.status}`);
  return json;
}

/**
 * Marks a payment verified and credits its connections exactly once — safe when the return
 * and the IPN arrive at the same moment. Returns null when the payment was already processed.
 */
async function creditPayment(paymentId, { trxId, gatewayResponse }) {
  const payments = collection('payments');
  const now = new Date();
  const payment = await payments.findOneAndUpdate(
    { _id: paymentId, status: 'initiated', creditedAt: null },
    {
      $set: {
        status: 'verified',
        creditedAt: now,
        reviewedAt: now,
        updatedAt: now,
        ...(trxId ? { trxId } : {}),
        ...(gatewayResponse ? { 'gateway.response': gatewayResponse } : {}),
      },
    },
    { returnDocument: 'after' },
  );
  if (!payment) return null;
  try {
    const user = await collection('user').findOneAndUpdate(
      { _id: payment.user },
      { $inc: { connectionBalance: payment.connections, connectionsPurchased: payment.connections } },
      { returnDocument: 'after' },
    );
    if (!user) throw new Error('The account no longer exists');
    await collection('connectiontransactions').insertOne({
      user: payment.user,
      type: 'purchase',
      delta: payment.connections,
      balanceAfter: user.connectionBalance,
      payment: payment._id,
      reason: payment.invoiceNo,
      createdAt: new Date(),
    });
  } catch (err) {
    // Put the payment back so SSLCommerz's next notice can credit it.
    await payments.updateOne(
      { _id: payment._id },
      { $set: { status: 'initiated' }, $unset: { creditedAt: 1 } },
    );
    throw err;
  }
  await collection('notifications')
    .insertOne({
      user: payment.user,
      type: 'payment_verified',
      data: { invoiceNo: payment.invoiceNo, connections: payment.connections },
      link: '/dashboard/connections',
      createdAt: new Date(),
    })
    .catch((err) => console.error('Notification write failed:', err.message));
  return payment;
}

/**
 * Handles SSLCommerz's result (the member's return or the IPN). The validation API is
 * authoritative and the paid amount must match before connections are credited. Safe to call
 * more than once for the same payment.
 * @param {Record<string, string>} body SSLCommerz's form post
 * @returns {Promise<{ status: 'success' | 'failed' | 'cancelled', invoiceNo?: string }>}
 */
export async function completeCheckout(body) {
  if (!checkoutEnabled()) return { status: 'failed' };
  const invoiceNo = body.tran_id;
  const payment = invoiceNo
    ? await collection('payments').findOne({ 'gateway.paymentId': invoiceNo, method: 'sslcommerz' })
    : null;
  if (!payment) return { status: 'failed' };
  if (payment.status === 'verified') return { status: 'success', invoiceNo };

  let result = { success: false, cancelled: body.status === 'CANCELLED', raw: { status: body.status } };
  if (!result.cancelled && body.val_id) {
    try {
      const v = await validate(body.val_id);
      result = {
        success:
          (v.status === 'VALID' || v.status === 'VALIDATED') &&
          v.tran_id === invoiceNo &&
          v.currency === 'BDT',
        amount: Number(v.amount),
        trxId: v.bank_tran_id || v.val_id,
        raw: { status: v.status, val_id: v.val_id, card_type: v.card_type, risk_level: v.risk_level },
      };
    } catch (err) {
      console.error(`SSLCommerz result for ${invoiceNo} could not be checked:`, err.message);
      return { status: 'failed', invoiceNo };
    }
  }

  const amountMatches = Math.abs((result.amount ?? NaN) - payment.amount) < 0.01;
  if (result.success && amountMatches) {
    await creditPayment(payment._id, { trxId: result.trxId, gatewayResponse: result.raw });
    return { status: 'success', invoiceNo };
  }
  if (result.success) {
    console.warn(
      `Paid amount ${result.amount} does not match ${invoiceNo} (${payment.amount}); not credited`,
    );
  }
  const status = result.cancelled ? 'cancelled' : 'failed';
  await collection('payments').updateOne(
    { _id: payment._id, status: 'initiated' },
    { $set: { status, 'gateway.response': result.raw, updatedAt: new Date() } },
  );
  return { status, invoiceNo };
}

/** Where the member's browser goes after paying: the receipt page. */
export function receiptURL({ status, invoiceNo }) {
  const target = invoiceNo
    ? `/dashboard/payment/${encodeURIComponent(invoiceNo)}?result=${status}`
    : `/dashboard/connections?payment=${status}`;
  return `${env().siteURL}${target}`;
}
