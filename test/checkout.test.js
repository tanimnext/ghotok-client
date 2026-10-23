import { MongoMemoryServer } from 'mongodb-memory-server';
import { ObjectId } from 'mongodb';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { checkoutEnabled, completeCheckout, receiptURL, startCheckout } from '@/server/checkout';
import { getDb, getMongoClient } from '@/server/mongodb';

// The SSLCommerz checkout runs in the website and writes the same documents ghotok-server
// reads (payments, the connection ledger, notifications). SSLCommerz itself is faked.

let mongod;
const db = () => getDb();

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  process.env.MONGODB_URI = mongod.getUri('ghotok_test');
  process.env.NEXT_PUBLIC_SITE_URL = 'http://localhost:3000';
}, 180000);

afterAll(async () => {
  await getMongoClient().close();
  await mongod?.stop();
});

const SSLCOMMERZ = {
  SSLCOMMERZ_ENABLED: 'true',
  SSLCOMMERZ_STORE_ID: 'store',
  SSLCOMMERZ_STORE_PASSWORD: 'secret',
};

beforeEach(() => Object.assign(process.env, SSLCOMMERZ));
afterEach(() => {
  vi.restoreAllMocks();
  for (const key of Object.keys(SSLCOMMERZ)) delete process.env[key];
});

const json = (body) =>
  new Response(JSON.stringify(body), { status: 200, headers: { 'content-type': 'application/json' } });

/** Fakes SSLCommerz: sessions always start; the validation API answers `validation(invoice, valId)`. */
function mockSslcommerz(validation) {
  const calls = [];
  vi.spyOn(globalThis, 'fetch').mockImplementation(async (url, init) => {
    const href = String(url);
    calls.push({ url: href, body: init?.body ? String(init.body) : null });
    if (href.includes('/gwprocess/v4/api.php')) {
      const invoice = new URLSearchParams(String(init.body)).get('tran_id');
      return json({
        status: 'SUCCESS',
        GatewayPageURL: `https://sandbox.sslcommerz.com/gw/${invoice}`,
        sessionkey: 'k',
      });
    }
    const valId = new URL(href).searchParams.get('val_id');
    return json(validation(valId.replace(/^V-/, ''), valId));
  });
  return calls;
}

const valid = (amount) => (invoice, valId) => ({
  status: 'VALID',
  tran_id: invoice,
  amount: amount.toFixed(2),
  currency: 'BDT',
  val_id: valId,
  bank_tran_id: `BT-${invoice}`,
});

async function member({ balance = 0 } = {}) {
  const { insertedId } = await db()
    .collection('user')
    .insertOne({
      name: 'Rina',
      email: `r${Math.random()}@example.com`,
      role: 'user',
      status: 'active',
      connectionBalance: balance,
    });
  return { id: insertedId.toString(), name: 'Rina', email: 'rina@example.com' };
}

async function pkg(fields = {}) {
  const { insertedId } = await db()
    .collection('packages')
    .insertOne({ name: { en: 'Standard' }, connections: 5, price: 500, isActive: true, ...fields });
  return insertedId.toString();
}

const balanceOf = async (user) =>
  (
    await db()
      .collection('user')
      .findOne({ _id: new ObjectId(user.id) })
  ).connectionBalance;

describe('SSLCommerz checkout', () => {
  it('is off (503) until SSLCommerz is configured', async () => {
    delete process.env.SSLCOMMERZ_STORE_ID;
    expect(checkoutEnabled()).toBe(false);
    await expect(startCheckout(await member(), await pkg())).rejects.toMatchObject({
      status: 503,
      code: 'PAYMENTS_UNAVAILABLE',
    });
  });

  it('starts a hosted checkout, validates the result and credits once (return and IPN)', async () => {
    const calls = mockSslcommerz(valid(500));
    const user = await member();
    const start = await startCheckout(user, await pkg());
    expect(start.redirectURL).toMatch(/^https:\/\/sandbox\.sslcommerz\.com\/gw\/INV-/);
    const { invoiceNo } = start.payment;
    const session = new URLSearchParams(calls[0].body);
    expect(session.get('total_amount')).toBe('500.00');
    expect(session.get('ipn_url')).toBe('http://localhost:3000/api/checkout/sslcommerz/ipn');
    expect(session.get('success_url')).toBe('http://localhost:3000/api/checkout/sslcommerz/return');

    const ret = await completeCheckout({ tran_id: invoiceNo, val_id: `V-${invoiceNo}`, status: 'VALID' });
    expect(ret).toEqual({ status: 'success', invoiceNo });
    expect(receiptURL(ret)).toBe(`http://localhost:3000/dashboard/payment/${invoiceNo}?result=success`);
    const ipn = await completeCheckout({ tran_id: invoiceNo, val_id: `V-${invoiceNo}`, status: 'VALID' });
    expect(ipn.status).toBe('success');

    expect(await balanceOf(user)).toBe(5);
    const payment = await db().collection('payments').findOne({ invoiceNo });
    expect(payment).toMatchObject({
      status: 'verified',
      method: 'sslcommerz',
      mode: 'gateway',
      trxId: `BT-${invoiceNo}`,
    });
    const ledger = await db().collection('connectiontransactions').find({ payment: payment._id }).toArray();
    expect(ledger).toHaveLength(1);
    expect(ledger[0]).toMatchObject({ type: 'purchase', delta: 5, balanceAfter: 5, reason: invoiceNo });
    expect(
      await db().collection('notifications').countDocuments({ user: payment.user, type: 'payment_verified' }),
    ).toBe(1);
    expect((await db().collection('user').findOne({ _id: payment.user })).connectionsPurchased).toBe(5);
  });

  it('credits exactly once when the return and the IPN arrive together or are replayed', async () => {
    mockSslcommerz(valid(500));
    const user = await member();
    const { payment } = await startCheckout(user, await pkg());
    const body = { tran_id: payment.invoiceNo, val_id: `V-${payment.invoiceNo}`, status: 'VALID' };
    const results = await Promise.all(Array.from({ length: 5 }, () => completeCheckout(body)));
    expect(results.every((r) => r.status === 'success')).toBe(true);
    expect(await balanceOf(user)).toBe(5);
    expect(
      await db().collection('connectiontransactions').countDocuments({ reason: payment.invoiceNo }),
    ).toBe(1);
  });

  it('does not credit when the validated amount differs from the invoice', async () => {
    mockSslcommerz(valid(1));
    const user = await member();
    const { payment } = await startCheckout(user, await pkg());
    const res = await completeCheckout({ tran_id: payment.invoiceNo, val_id: `V-${payment.invoiceNo}` });
    expect(res.status).toBe('failed');
    expect(await balanceOf(user)).toBe(0);
  });

  it('marks forged, failed and cancelled results without crediting', async () => {
    mockSslcommerz((invoice, valId) => ({ status: 'INVALID_TRANSACTION', tran_id: invoice, val_id: valId }));
    const user = await member();
    const a = (await startCheckout(user, await pkg())).payment.invoiceNo;
    expect((await completeCheckout({ tran_id: a, val_id: `V-${a}` })).status).toBe('failed');
    const b = (await startCheckout(user, await pkg())).payment.invoiceNo;
    expect((await completeCheckout({ tran_id: b, status: 'CANCELLED' })).status).toBe('cancelled');
    expect((await completeCheckout({ tran_id: 'INV-NOT-OURS' })).status).toBe('failed');
    expect(await balanceOf(user)).toBe(0);
    const statuses = await db()
      .collection('payments')
      .find({ invoiceNo: { $in: [a, b] } })
      .toArray();
    expect(statuses.map((p) => p.status).sort()).toEqual(['cancelled', 'failed']);
  });

  it('marks the payment failed when SSLCommerz does not start a session', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      json({ status: 'FAILED', failedreason: 'Store inactive' }),
    );
    const packageId = await pkg();
    await expect(startCheckout(await member(), packageId)).rejects.toMatchObject({
      status: 502,
      code: 'GATEWAY_ERROR',
    });
    expect(
      await db()
        .collection('payments')
        .findOne({ package: new ObjectId(packageId) }),
    ).toMatchObject({ status: 'failed' });
  });

  it('charges approved members the discounted price when the setting is on', async () => {
    const calls = mockSslcommerz(valid(250));
    await db()
      .collection('settings')
      .insertOne({ key: 'payments', value: { approvedDiscountPercent: 50 } });
    const user = await member();
    await db()
      .collection('biodatas')
      .insertOne({ user: new ObjectId(user.id), status: 'approved', deletedAt: null });
    const { payment } = await startCheckout(user, await pkg());
    expect(payment.amount).toBe(250);
    expect(new URLSearchParams(calls[0].body).get('total_amount')).toBe('250.00');
    await db().collection('settings').deleteOne({ key: 'payments' });
  });

  it('refuses inactive packages and needs a signed-in member at /api/checkout', async () => {
    mockSslcommerz(valid(500));
    await expect(startCheckout(await member(), await pkg({ isActive: false }))).rejects.toMatchObject({
      status: 404,
    });
    vi.restoreAllMocks();
    const { POST } = await import('@/app/api/checkout/route.js');
    const res = await POST(
      new Request('http://localhost:3000/api/checkout', {
        method: 'POST',
        headers: { 'content-type': 'application/json', origin: 'http://localhost:3000' },
        body: JSON.stringify({ packageId: await pkg() }),
      }),
    );
    expect(res.status).toBe(401);
    expect((await res.json()).error.code).toBe('UNAUTHORIZED');
  });
});
