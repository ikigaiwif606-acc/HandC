# SYNC APP

A wellness web app for Yoga and Contrast Therapy bookings, member rewards and daily studio operations.

The standalone [Raja Uda Wellness Studio business summary](business-summary/) is in `business-summary/` and deploys separately to Vercel. See its [deployment instructions](business-summary/README.md).

**[Open the live demo](https://sync-wellness.vercel.app/)**

## Features

- **Book classes** — browse sessions, check availability and manage bookings.
- **Wallet** — view Yoga and Contrast Therapy passes, expiry dates and redeemed rewards.
- **Rewards** — redeem points and track visit-based Plus, Core and Luxe membership progress.
- **Account** — edit your profile, view purchases and points activity, and show your check-in QR code.
- **People & staff tools** — browse people by role, manage sessions, book for members and scan check-in codes.
- **Admin controls** — create accounts, edit profiles, change roles, activate/deactivate access and review change history.
- **Attendance reports** — weekly and monthly dashboards with filters and CSV export.

Responsive layouts support English and Traditional Chinese.

## Demo accounts

Use **Try a demo account** on the sign-in page, or enter one of these accounts. All use the demo password: `SyncDemo2026!`

| Role | Email | Workspace |
| --- | --- | --- |
| Member | `jamie@sync.demo` | Bookings, wallet, rewards and profile |
| Admin | `admin@sync.demo` | Studio management, account creation, passes, points and reports |
| Front desk | `frontdesk@sync.demo` | Member assistance, bookings, check-in and reports |
| Instructor | `instructor@sync.demo` | Assigned classes, preparation, attendance and reports |

One sign-in form opens the workspace assigned to each account. Admin can create accounts for all four roles.

## Run locally

No build step or package installation is required. With Python 3 installed:

```sh
git clone https://github.com/ikigaiwif606-acc/SYNC-APP.git
cd SYNC-APP
python3 -m http.server 4173 --bind 127.0.0.1
```

Open [localhost:4173](http://127.0.0.1:4173/).

## Demo scope

Data is saved in the current browser using local storage. Accounts and records are not shared across devices. Sign-in and purchases are simulated; no real payments or emails are sent. Use sample details when exploring.

Membership benefits and booking policies are prototype settings.

## Project structure

- `index.html` — app entry point.
- `src/core/` — shared app logic, translations and membership rules.
- `src/styles/` — global styles, shared theme tokens (`theme.css`) and visuals.
- `src/features/` — JavaScript and CSS grouped by feature.
- `assets/logos/` — SYNC brand assets.
- `vendor/` — bundled QR libraries and their licenses.
- `docs/` — workflow diagrams, review notes and future planning.

Future consideration: [Invite to SYNC referral program](docs/planning/referral-program.md).

## Built with

HTML, CSS and vanilla JavaScript, hosted on Vercel. QR tools are bundled locally: [jsQR license](vendor/jsQR-LICENSE.txt) and [QRCode.js license](vendor/qrcode-LICENSE.txt).
