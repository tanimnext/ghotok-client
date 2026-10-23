# Changelog

All notable changes to this project are recorded here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and versions follow
[Semantic Versioning](https://semver.org/).

## [Unreleased]

### Changed

- Payments are SSLCommerz only. The checkout has two steps (package, then pay) and one "Pay with
  SSLCommerz" button that sends the member to SSLCommerz's page (card, bKash, Nagad, Rocket or
  internet banking); it shows a notice instead when the server reports checkout as off. The
  payment method picker and the "Send Money + transaction ID" form are gone.
- Admin: the payments page is a read-only list (paid, failed, cancelled, refunded) without
  verify/reject; the overview shows the latest payments; the payment settings keep only the
  approval gift and the approved-member discount.
- Older bKash/Nagad/Rocket and manual payments keep their labels in history, receipts and admin
  lists.

## [1.0.0] - 2026-10-21

First release as a standalone client, split from the ghotok-claude monorepo.

### Added

- Better Auth sign-in: email and password, mobile number and password, one-time codes by email
  or SMS, Google, "remember me", signed-in devices, password change and reset.
- Role-based routing: every new account is a member (`user`); admins (role set in the database)
  land on `/admin`, members on `/dashboard`.
- The admin dashboard now lives inside the website at `/admin`.
- Image uploads (ticket and report attachments, banners) go from the browser to ImgBB.

### Removed

- Member photos and NID upload and verification.
- The separate admin app, the custom JWT session handling and server-side file uploads.

[1.0.0]: https://github.com/tanimnext/ghotok-client/releases/tag/v1.0.0
