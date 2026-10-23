# Ghotok client (ঘটক)

The website, member dashboard and admin dashboard of Ghotok, a secure matchmaking platform for
every faith in Bangladesh. Families publish a free biodata, browse approved biodatas and unlock a
guardian's contact details with **connections**; admins review biodatas, payments, reports and
support tickets.

It also runs **sign-up and sign-in** (Better Auth, email + password) and the **SSLCommerz checkout**
on its own server side, against MongoDB. Everything else comes from the API in
[ghotok-server](https://github.com/tanimnext/ghotok-server). **Both apps use the same MongoDB
database and the same `BETTER_AUTH_SECRET`.**

|                |                                                                         |
| -------------- | ----------------------------------------------------------------------- |
| Framework      | Next.js 16 (App Router), React 19, JavaScript                           |
| Styling        | Tailwind CSS 4 with the Ghotok design tokens (`src/shared/styles`)      |
| Data           | TanStack Query; `fetch` to `/api` on the same origin                    |
| Authentication | [Better Auth](https://www.better-auth.com) 1.7 + MongoDB adapter + admin plugin (`src/server/auth.js`) |
| Database       | MongoDB driver 7 (`src/server/mongodb.js`), the same database as ghotok-server |
| Payments       | SSLCommerz hosted checkout (`src/server/checkout.js`)                   |
| Admin panel    | React Router 7 app mounted at `/admin`                                  |
| Image uploads  | Browser → [ImgBB](https://api.imgbb.com/)                               |
| Tests          | Vitest                                                                  |

## How it fits together

```
Browser ──► ghotok-client (Next.js)
              ├─ /api/auth/*      Better Auth (email + password, admin plugin) ──┐
              ├─ /api/checkout/*  SSLCommerz checkout and its return/IPN ───────┤──► MongoDB
              └─ /api/* (rest) ──rewrite──► ghotok-server (Express) ─────────────┘   (one database)
   └──── images ──► ImgBB (the API only stores the links)
```

- **This app's route handlers come first.** `src/app/api/auth/[...all]` (Better Auth) and
  `src/app/api/checkout/...` (SSLCommerz) answer on their own. Every other `/api/*` request is
  forwarded to `API_URL` (ghotok-server) by a `fallback` rewrite in `next.config.mjs`.
- **Same origin.** The browser only talks to the website's origin, so the session cookie
  (`ghotok.session_token`) is first-party and reaches ghotok-server through the rewrite.
  ghotok-server checks the cookie's signature with the shared `BETTER_AUTH_SECRET` and looks the
  session up in the shared database.
- **Server Components** fetch public data (home page, biodatas, CMS pages) straight from
  `API_URL` (`src/lib/api/server.js`). Everything personal is loaded in the browser.

## Sign-in and roles

Sign-up and sign-in use **email + password only**: no one-time codes, SMS, Google, email
verification or "forgot password" (an admin sets a new password). The browser uses the Better
Auth client in `src/lib/auth-client.js`:

| Flow                 | Better Auth call                                                                    |
| -------------------- | ----------------------------------------------------------------------------------- |
| Register             | `signUp.email` (name, email, password); signs the member in at once                 |
| Log in               | `signIn.email` with "remember me" (`rememberMe: false` ends with the browser session) |
| Devices, password    | `listSessions`, `revokeSession`, `revokeSessions`, `changePassword` (signs out other devices) |
| Admin: create, reset | `admin.createUser`, `admin.setUserPassword` + `admin.revokeUserSessions`            |

There are two roles, **user** and **admin**. Every account made by signing up is a `user`
(`role` in a sign-up request is refused). An account becomes an admin only when its `role` is
changed to `admin` in the database, or when an admin creates it as one:

```js
db.user.updateOne({ email: 'person@example.com' }, { $set: { role: 'admin' } });
```

After signing in, admins are sent to `/admin` and members to `/dashboard`
(`homeFor` in `src/lib/auth-client.js`). `/admin` shows only to admins: visitors are sent to the
login page and members to their dashboard. ghotok-server enforces the same rule on every
`/api/admin` request, so the client-side guard is only for navigation. Suspended or banned
accounts cannot sign in; a deactivated account is reactivated by signing in again.

## Images

Ghotok shows no photos of members and takes no ID documents. The only uploads are images on
support tickets, reports and the admin's wedding banners. The browser uploads them to ImgBB
(`src/lib/imgbb.js`) and sends the resulting links to the API. ImgBB links are public to anyone
who has them, which is why ID cards and other private documents must never go this way.
Without `NEXT_PUBLIC_IMGBB_API_KEY` the rest of the site works; image uploads report that they
are not set up.

## Payments

Members pay only through SSLCommerz (card, bKash, Nagad, Rocket or internet banking), handled by
this app's server side (`src/server/checkout.js`):

1. The checkout (`src/components/billing/Checkout.jsx`) posts `{ packageId }` to
   `/api/checkout`. It creates the payment (with the approved-member discount) in the shared
   `payments` collection and returns SSLCommerz's payment page; the browser goes there.
2. SSLCommerz posts the result to `/api/checkout/sslcommerz/return` (the member's browser) and
   `/api/checkout/sslcommerz/ipn` (its servers). The result is checked with SSLCommerz's
   validation API and the amount must match; then the connections are credited **once**, with a
   ledger entry and a notification, in the same documents ghotok-server reads.
3. The member lands on `/dashboard/payment/<invoice>` (served by ghotok-server's data).

Without the `SSLCOMMERZ_*` settings the packages page says online payment is unavailable and
`/api/checkout` answers `503 PAYMENTS_UNAVAILABLE`.

**Sandbox setup:** register a free store at https://developer.sslcommerz.com/registration/ and set
`SSLCOMMERZ_ENABLED=true`, `SSLCOMMERZ_STORE_ID` and `SSLCOMMERZ_STORE_PASSWORD` in `.env.local`.
SSLCommerz's servers must reach `/api/checkout/sslcommerz/ipn`, so for a full local test open a
tunnel (for example `ngrok http 3000`) and set `NEXT_PUBLIC_SITE_URL` and `BETTER_AUTH_URL` to the
`https://….ngrok-free.app` address (rebuild after changing `NEXT_PUBLIC_*`; add the address to
ghotok-server's `CORS_ORIGINS` too). For production use
`SSLCOMMERZ_BASE_URL=https://securepay.sslcommerz.com` and set the IPN URL in the merchant panel.

## Getting started

Requirements: Node.js 22.12+ (`nvm use`), a MongoDB database and a running ghotok-server that
uses **the same database and the same `BETTER_AUTH_SECRET`**.

```bash
npm ci
cp .env.example .env.local   # the defaults match ghotok-server's .env.example
npm run dev                  # http://localhost:3000
```

1. In ghotok-server: `npm run seed:demo`, then `npm run dev` (it starts a local MongoDB by
   itself when none is running).
2. Here: `npm run dev`, open http://localhost:3000 and register, or log in with a demo account:
   the admin from ghotok-server's `.env` (`admin@ghotok.com.bd` / `ChangeMe!2026` by default),
   `member@example.com` or `demo1…20@example.com` with `Demo@12345`.

### Environment

| Variable                    | Purpose                                                                                 |
| --------------------------- | --------------------------------------------------------------------------------------- |
| `MONGODB_URI`               | MongoDB connection string, **the same database as ghotok-server**                       |
| `BETTER_AUTH_SECRET`        | **The same value as ghotok-server**; signs the session cookie. Required in production   |
| `BETTER_AUTH_URL`           | This website's public URL (where `/api/auth` lives)                                     |
| `API_URL`                   | ghotok-server's address, for the `/api` rewrite (build time) and server fetches         |
| `NEXT_PUBLIC_SITE_URL`      | This website's public URL (metadata, sitemap, SSLCommerz return/IPN URLs)               |
| `NEXT_PUBLIC_DEFAULT_LANG`  | `en` or `bn` for first-time visitors                                                    |
| `NEXT_PUBLIC_IMGBB_API_KEY` | ImgBB API key for image uploads (visible to visitors; use a dedicated account)          |
| `SSLCOMMERZ_*`              | `SSLCOMMERZ_ENABLED`, `_BASE_URL`, `_STORE_ID`, `_STORE_PASSWORD` (see _Payments_)      |

`NEXT_PUBLIC_*` values and the `/api` rewrite are fixed when the app is built; the others are read
at run time.

## Scripts

| Command                | What it does                                       |
| ---------------------- | -------------------------------------------------- |
| `npm run dev`          | Development server on port 3000                    |
| `npm run build`        | Production build (standalone output)               |
| `npm start`            | Serve the production build                         |
| `npm test`             | Dictionaries, permissions, biodata rules, helpers, Better Auth rules and checkout (throwaway MongoDB) |
| `npm run lint`         | ESLint                                             |
| `npm run format:check` | Prettier                                           |
| `npm run check`        | All of the above                                   |

`.npmrc` sets `legacy-peer-deps=true`: npm 10 crashes while resolving Better Auth's optional peer
dependencies.

## Project layout

```
src/
  app/                 Next.js routes
    (site)/            Public website: home, browse, biodata profile, packages, CMS pages, auth
    dashboard/         Member dashboard
    admin/[[...path]]/ Mounts the admin dashboard (client-only)
    api/auth/          Better Auth's route handler
    api/checkout/      SSLCommerz checkout, return and IPN
  components/          Website and dashboard components
  admin/               Admin dashboard (React Router): pages, components, its own dictionaries
  hooks/               useAuth (Better Auth session), error messages, settings
  lib/                 API client, auth client, ImgBB, i18n (website dictionaries), formatting
  server/              Server-only code: MongoDB connection, Better Auth, SSLCommerz checkout
  shared/              Biodata definition, options, locations, permissions, formatting, icons
  ui/                  The Ghotok UI kit (buttons, fields, cards, modal, toasts, icons)
test/                  Vitest tests
```

`src/shared` is a copy of the rules ghotok-server uses too (`src/shared` there). **When you change
the biodata definition, an option list or the permissions, change both repositories.**

Interface text lives in `src/lib/i18n/{en,bn}.js` (website and member dashboard) and
`src/admin/lib/i18n/{en,bn}.js` (admin dashboard). Tests check that English and Bangla have the
same keys and that every key the code uses exists.

## Deployment

Build the Docker image with the build arguments from `.env.example` (see the `Dockerfile`) and
run it with `MONGODB_URI`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL` and the `SSLCOMMERZ_*` settings
in its environment, or run `npm run build` and `node .next/standalone/server.js` behind a reverse
proxy. Serve the website and the API under the same
site: only the website needs to be public, since it forwards `/api` to ghotok-server.

## License

Proprietary. All rights reserved.
