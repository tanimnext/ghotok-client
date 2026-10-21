# Changelog

All notable changes to this project are recorded here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and versions follow
[Semantic Versioning](https://semver.org/).

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
