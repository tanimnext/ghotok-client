# Ghotok client (ঘটক)

The website, member dashboard and admin dashboard of Ghotok, a secure matchmaking platform for
every faith in Bangladesh. Families publish a free biodata, browse approved biodatas and unlock a
guardian's contact details with **connections**; admins review biodatas, payments, reports and
support tickets.

This repository is the front end only. It talks to the API in
[ghotok-server](https://github.com/tanimnext/ghotok-server).

|                |                                                                         |
| -------------- | ----------------------------------------------------------------------- |
| Framework      | Next.js 16 (App Router), React 19, JavaScript                           |
| Styling        | Tailwind CSS 4 with the Ghotok design tokens (`src/shared/styles`)      |
| Data           | TanStack Query; `fetch` to `/api` on the same origin                    |
| Authentication | [Better Auth](https://www.better-auth.com) 1.7 client (`better-auth/react`) |
| Admin panel    | React Router 7 app mounted at `/admin`                                  |
| Image uploads  | Browser → [ImgBB](https://api.imgbb.com/)                               |
| Tests          | Vitest                                                                  |

## How it fits together

```
Browser ──► ghotok-client (Next.js) ──/api/* rewrite──► ghotok-server (Express) ──► MongoDB
   │
   └──── images ──► ImgBB (the API only stores the links)
```

- `next.config.mjs` forwards every `/api/*` request to `API_URL` (ghotok-server). The browser
  only ever talks to the website's own origin, so the Better Auth session cookie is first-party.
  Set ghotok-server's `BETTER_AUTH_URL` and `CORS_ORIGINS` to this website's URL.
- Server Components fetch public data (home page, biodatas, CMS pages) straight from `API_URL`
  (`src/lib/api/server.js`); everything personal is loaded in the browser.

## Sign-in and roles

All sign-up and sign-in goes through the Better Auth client in `src/lib/auth-client.js`:

| Flow                    | Better Auth endpoint(s)                                                           |
| ----------------------- | --------------------------------------------------------------------------------- |
| Register                | `signUp.email` (name, email, password, optional mobile), then an email code       |
| Password login          | `signIn.email`, or `signIn.phoneNumber` when a mobile number is typed            |
| One-time code login     | `emailOtp.sendVerificationOtp` + `signIn.emailOtp`, or `phoneNumber.sendOtp` + `phoneNumber.verify` |
| Google                  | `signIn.social` (shown only when `/api/public/settings` says `auth.google`)       |
| Forgot password         | `emailOtp.requestPasswordReset` / `phoneNumber.requestPasswordReset`, then reset  |
| Devices, password       | `listSessions`, `revokeSession`, `revokeSessions`, `changePassword`              |

Mobile numbers are sent as `01XXXXXXXXX`, the form ghotok-server stores.

There are two roles, **user** and **admin**. Every new account is a `user`. An account becomes an
admin only when its `role` is changed to `admin` in the database (or by another admin):

```js
db.user.updateOne({ email: 'person@example.com' }, { $set: { role: 'admin' } });
```

After signing in, admins are sent to `/admin` and members to `/dashboard`
(`homeFor` in `src/lib/auth-client.js`). `/admin` shows only to admins: visitors are sent to the
login page and members to their dashboard. ghotok-server enforces the same rule on every
`/api/admin` request, so the client-side guard is only for navigation.

## Images

Ghotok shows no photos of members and takes no ID documents. The only uploads are images on
support tickets, reports and the admin's wedding banners. The browser uploads them to ImgBB
(`src/lib/imgbb.js`) and sends the resulting links to the API. ImgBB links are public to anyone
who has them, which is why ID cards and other private documents must never go this way.
Without `NEXT_PUBLIC_IMGBB_API_KEY` the rest of the site works; image uploads report that they
are not set up.

## Payments

Members pay only through SSLCommerz (card, bKash, Nagad, Rocket or internet banking). The checkout
(`src/components/billing/Checkout.jsx`) asks the API to start a payment and sends the browser to
the SSLCommerz page it returns; SSLCommerz brings the member back to
`/dashboard/payment/<invoice>`, which waits for the server to confirm the payment. Until the
server has SSLCommerz settings, the packages page shows that online payment is unavailable. See
the ghotok-server README for the SSLCommerz sandbox setup.

## Getting started

Requirements: Node.js 22.12+ (`nvm use`) and a running ghotok-server.

```bash
npm ci
cp .env.example .env.local   # then edit it
npm run dev                  # http://localhost:3000
```

Demo accounts come from ghotok-server's `npm run seed:demo`: the admin from its `.env`
(`SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD`), `member@example.com` and
`demo1…20@example.com` with `Demo@12345`.

### Environment

| Variable                    | Purpose                                                                         |
| --------------------------- | ------------------------------------------------------------------------------- |
| `API_URL`                   | ghotok-server's address, for the `/api` rewrite (build time) and server fetches |
| `NEXT_PUBLIC_SITE_URL`      | This website's public URL (metadata, sitemap)                                   |
| `NEXT_PUBLIC_DEFAULT_LANG`  | `en` or `bn` for first-time visitors                                            |
| `NEXT_PUBLIC_IMGBB_API_KEY` | ImgBB API key for image uploads (visible to visitors; use a dedicated account)  |

`NEXT_PUBLIC_*` values and the `/api` rewrite are fixed when the app is built.

## Scripts

| Command                | What it does                                       |
| ---------------------- | -------------------------------------------------- |
| `npm run dev`          | Development server on port 3000                    |
| `npm run build`        | Production build (standalone output)               |
| `npm start`            | Serve the production build                         |
| `npm test`             | Dictionaries, permissions, biodata rules, helpers |
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
    auth/continue/     Where Google sign-in returns; redirects by role
  components/          Website and dashboard components
  admin/               Admin dashboard (React Router): pages, components, its own dictionaries
  hooks/               useAuth (Better Auth session), error messages, settings
  lib/                 API client, auth client, ImgBB, i18n (website dictionaries), formatting
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

Build the Docker image with the build arguments from `.env.example` (see the `Dockerfile`), or run
`npm run build && npm start` behind a reverse proxy. Serve the website and the API under the same
site: only the website needs to be public, since it forwards `/api` to ghotok-server.

## License

Proprietary. All rights reserved.
