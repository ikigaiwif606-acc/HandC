# Mekansm

Mekansm is the studio name. The public concept, private Business page and sign-in share the app’s original dot-matrix wordmark and M symbol in `assets/brand/`. Raja Uda remains the location. Existing deployment URLs and business access settings remain in use.

Public studio concept: https://handc-business-summary.vercel.app/

Private Business page: https://handc-business-summary.vercel.app/business

The public page describes the wellness experience, healthy routines, concept visuals and revised floor plan. Business overview, pass pricing, funding, three financial scenarios and improvements live together on the separate Business page.

## Business access

The Business page uses a shared founder password, verified by a Vercel Node.js function. The server stores a salted scrypt password hash and a signing secret as sensitive environment variables:

- `BUSINESS_PASSWORD_HASH`: `scrypt-v1$<hex salt>$<hex derived key>`.
- `BUSINESS_SESSION_SECRET`: at least 32 random characters.

Never put the password or signing secret in browser JavaScript, Git, or a public file. Production has no default password. Missing configuration denies access. Local access configuration is kept outside the checkout at `~/.config/handc-business-summary/access.json`, readable only by the local user.

Sessions last eight hours and use a signed, Secure, HttpOnly, SameSite cookie. All Business responses are private and non-cacheable. The server checks login for the HTML, financial scripts, stylesheet and session endpoint. Login and logout require same-origin POST requests. Five failed attempts in ten minutes are throttled per IP per running function instance; a shared durable limiter would be needed for a global counter across instances.

`build.cjs` publishes only an explicit allowlist into `public/`. The `private/` directory and server code are excluded from static hosting. Previously public model files at `/finance-model.js` and `/financials.js` are no longer published. This protects the current deployment; older published snapshots and repository history are separate.

To change access, generate a new salted scrypt hash and signing secret, replace both production environment variables, then redeploy. Changing either invalidates existing sessions. There is no self-registration, password-reset email or individual account database.

## Development

No dependencies are required. Build the public files, then run the local Node server:

```sh
node business-summary/build.cjs
node business-summary/dev-server.cjs
```

Open http://127.0.0.1:4174/. The development server uses the private local access configuration. It binds only to localhost and uses a separate development cookie.

For disposable browser QA, `node business-summary/dev-server.cjs --test-login` uses the local test password `Preview-Only-Routine-2026!`. This option exists only in the development server, which is not deployed. It cannot enable a production login.

Run checks from the repository root:

```sh
node --test tests/finance-model.test.cjs tests/business-access.test.cjs
```

The access tests check sign-in, signed-out denial, session expiry and tampering, password rotation, cross-origin requests, logout, throttling and the public deployment allowlist. Financial checks cover startup and reserve arithmetic, membership and event double-counting, annual payments versus earned revenue, growth costs and first-year cash flow.

## Financial planner

The planner models the Mekansm app’s six pass prices alongside estimated juice, merchandise and event sales. Annual founding passes are collected once at opening and allocated over twelve months for earned-revenue reporting. Monthly cash sales exclude those advance receipts. The RM500k proposed founder capital is separate from customer payments.

Defaults estimate RM448,800 opening costs and RM39,769 fixed monthly bills. Opening plus a three-month fixed-cost buffer totals about RM568,108. Equipment, lease, demand, staffing and occupancy need validation. Supplier costs are allowances, not quotes; demo app sales are not used as evidence of demand.

- `private/finance-model.js`: calculations, also used by the tests.
- `private/financials.js`: scenario comparison, inputs, cash chart and monthly projection.
- `private/business.html`: business overview, numbers and improvements.
- `api/business.js` and `private/auth.cjs`: server routes and access checks.

Planner edits are stored in the current tab’s session storage and cleared when signing out. They do not change app prices or admissions.

## Floor plan

Revision 02 keeps men’s and women’s changing/shower suites separate, with an open middle passage. Each suite has two showers, a private changing cubicle and a basin. Both existing toilets remain at the rear-left, reached from the shared hall. The public page includes enlarged previews and a two-page concept PDF. Dimensions remain subject to a measured survey.

The supplied original HTML and concept PDF remain unchanged. All six concept images are retained.

## Deployment

The Vercel project is `handc-business-summary`, with root directory `business-summary`, build command `node build.cjs` and output directory `public`. The API function includes `private/**` in its server bundle. Sensitive environment variables must be configured before deploying.

From the linked repository root:

```sh
vercel --prod --yes --scope ikigaiwif606s-projects --local-config business-summary/vercel.json
```
