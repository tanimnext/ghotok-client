import { MongoMemoryServer } from 'mongodb-memory-server';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { getAuth } from '@/server/auth';
import { getDb, getMongoClient } from '@/server/mongodb';

// Better Auth runs in the website (src/server/auth.js); these check its Ghotok rules against
// a throwaway MongoDB, through the same HTTP endpoints the browser uses.

let mongod;
const SITE = 'http://localhost:3000';

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  process.env.MONGODB_URI = mongod.getUri('ghotok_auth_test');
  process.env.BETTER_AUTH_URL = SITE;
}, 180000);

afterAll(async () => {
  await getMongoClient().close();
  await mongod?.stop();
});

/** Calls /api/auth/<path> like the browser does and returns status, JSON and the session cookie. */
async function call(path, { body, cookie, method = body ? 'POST' : 'GET' } = {}) {
  const res = await getAuth().handler(
    new Request(`${SITE}/api/auth${path}`, {
      method,
      headers: {
        origin: SITE,
        ...(body ? { 'content-type': 'application/json' } : {}),
        ...(cookie ? { cookie } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    }),
  );
  const setCookie = res.headers.getSetCookie?.() ?? [];
  const session = setCookie.find((c) => c.startsWith('ghotok.session_token='));
  return {
    status: res.status,
    json: await res.json().catch(() => null),
    cookie: session?.split(';')[0],
    setCookie,
  };
}

const users = () => getDb().collection('user');

async function signUp(email, extra = {}) {
  return call('/sign-up/email', { body: { name: 'Rina', email, password: 'Password1!', ...extra } });
}

describe('sign-up and sign-in (email + password)', () => {
  it('makes every new account an active member and refuses role or status in the request', async () => {
    const sneaky = await signUp('eve@example.com', { role: 'admin' });
    expect(sneaky.status).toBe(400);
    expect(sneaky.json.code).toBe('FIELD_NOT_ALLOWED');
    expect(await users().findOne({ email: 'eve@example.com' })).toBeNull();
    // Fields Better Auth does not block itself are overwritten by the create hook.
    await signUp('eve@example.com', { status: 'banned', connectionBalance: 99 });
    expect(await users().findOne({ email: 'eve@example.com' })).toMatchObject({
      role: 'user',
      status: 'active',
      connectionBalance: 0,
    });

    const res = await signUp('rina@example.com');
    expect(res.status).toBe(200);
    expect(res.cookie).toMatch(/^ghotok\.session_token=/);
    const user = await users().findOne({ email: 'rina@example.com' });
    expect(user).toMatchObject({ role: 'user', status: 'active', connectionBalance: 0 });

    const me = await call('/get-session', { cookie: res.cookie });
    expect(me.json.user).toMatchObject({ email: 'rina@example.com', role: 'user' });
  });

  it('signs in with the password and honours "remember me"', async () => {
    await signUp('mina@example.com');
    expect(
      (await call('/sign-in/email', { body: { email: 'mina@example.com', password: 'nope-nope' } })).status,
    ).toBe(401);
    const kept = await call('/sign-in/email', {
      body: { email: 'mina@example.com', password: 'Password1!' },
    });
    expect(kept.status).toBe(200);
    expect(kept.setCookie.find((c) => c.startsWith('ghotok.session_token='))).toMatch(/Max-Age/i);
    const browser = await call('/sign-in/email', {
      body: { email: 'mina@example.com', password: 'Password1!', rememberMe: false },
    });
    expect(browser.setCookie.find((c) => c.startsWith('ghotok.session_token='))).not.toMatch(/Max-Age/i);
  });

  it('refuses suspended or banned accounts and reactivates a deactivated one', async () => {
    await signUp('susp@example.com');
    await users().updateOne({ email: 'susp@example.com' }, { $set: { status: 'suspended' } });
    const refused = await call('/sign-in/email', {
      body: { email: 'susp@example.com', password: 'Password1!' },
    });
    expect(refused.status).toBe(403);
    expect(refused.json.code).toBe('ACCOUNT_INACTIVE');

    await signUp('away@example.com');
    await users().updateOne({ email: 'away@example.com' }, { $set: { status: 'deactivated' } });
    const back = await call('/sign-in/email', {
      body: { email: 'away@example.com', password: 'Password1!' },
    });
    expect(back.status).toBe(200);
    expect((await users().findOne({ email: 'away@example.com' })).status).toBe('active');
  });

  it('has no email codes, SMS or password reset', async () => {
    for (const path of ['/email-otp/send-verification-otp', '/phone-number/send-otp']) {
      expect((await call(path, { body: { email: 'x@example.com' } })).status).toBe(404);
    }
    const google = await call('/sign-in/social', { body: { provider: 'google', callbackURL: '/' } });
    expect(google.status).not.toBe(200);
    const reset = await call('/request-password-reset', { body: { email: 'rina@example.com' } });
    expect(reset.json.code).toBe('RESET_PASSWORD_DISABLED');
  });
});

describe('admin plugin', () => {
  it('lets only admins create accounts (with a role) and set passwords', async () => {
    const member = await signUp('member@example.com');
    const denied = await call('/admin/create-user', {
      cookie: member.cookie,
      body: { name: 'X', email: 'x@example.com', password: 'Password1!' },
    });
    expect(denied.status).toBe(403);

    await signUp('boss@example.com');
    await users().updateOne({ email: 'boss@example.com' }, { $set: { role: 'admin' } });
    const boss = await call('/sign-in/email', {
      body: { email: 'boss@example.com', password: 'Password1!' },
    });
    const created = await call('/admin/create-user', {
      cookie: boss.cookie,
      body: { name: 'Second Admin', email: 'second@example.com', password: 'Reviewer123', role: 'admin' },
    });
    expect(created.status).toBe(200);
    expect(await users().findOne({ email: 'second@example.com' })).toMatchObject({
      role: 'admin',
      status: 'active',
    });

    const target = await users().findOne({ email: 'member@example.com' });
    const set = await call('/admin/set-user-password', {
      cookie: boss.cookie,
      body: { userId: target._id.toString(), newPassword: 'BrandNew123' },
    });
    expect(set.status).toBe(200);
    expect(
      (await call('/sign-in/email', { body: { email: 'member@example.com', password: 'BrandNew123' } }))
        .status,
    ).toBe(200);
  });
});
