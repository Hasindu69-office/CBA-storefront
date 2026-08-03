# CBA Ecommerce Storefront

This is the CBA B2C storefront for the Medusa `2.17.2` backend in `../backend`.

The app uses Next.js `15.3.9`, React `19.0.5`, Tailwind CSS, and the Medusa JS SDK. Server-side cart, checkout, promotion, shipping, customer, and order data must come from the Medusa backend. The browser may validate form input for UX, but it must not calculate authoritative prices, discounts, shipping, taxes, or totals.

## Local Setup

Install dependencies:

```powershell
cd storefront
npm.cmd install
```

Create or update `.env.local`:

```env
MEDUSA_BACKEND_URL=http://localhost:9000
NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY=replace-with-local-publishable-key
NEXT_PUBLIC_BASE_URL=http://localhost:8000
NEXT_PUBLIC_DEFAULT_REGION=lk
```

Optional payment variables:

```env
NEXT_PUBLIC_STRIPE_KEY=replace-with-stripe-public-key
NEXT_PUBLIC_MEDUSA_PAYMENTS_PUBLISHABLE_KEY=replace-with-medusa-payments-key
NEXT_PUBLIC_MEDUSA_PAYMENTS_ACCOUNT_ID=replace-with-medusa-payments-account-id
```

Start the storefront:

```powershell
npm.cmd run dev
```

The local app runs on `http://localhost:8000`.

## Backend Baseline

Before cart, shipping, coupon, or checkout testing, run the backend setup and verification relevant to the current phase:

```powershell
cd ../backend
npx.cmd medusa db:migrate
npm.cmd run setup:cba
npm.cmd run setup:cba:fulfillment
npm.cmd run seed:cba:test-shipping
npm.cmd run seed:cba:test-promotions
npm.cmd run verify:cba:phase-3a
npm.cmd run verify:cba:phase-3b
```

Development promotion fixtures use deterministic `CBA3B_*` codes and native Medusa Promotions/Campaigns.

## Promotion And Coupon Rules

- Storefront coupon validation is in `src/lib/util/promotions.ts`.
- Cart mutations flow through `src/lib/data/cart.ts`.
- Promotion application uses native Medusa cart updates with `promo_codes`.
- Codes are normalized to uppercase to match the existing CBA storefront behavior and seeded fixture codes.
- The server remains authoritative for eligibility, adjustments, totals, usage limits, campaign dates, and shipping discounts.
- Customer-facing errors must not expose stack traces, SQL details, internal IDs, campaign budgets, package names, Redis details, or secrets.

## Verification

Run:

```powershell
npm.cmd run build
```

The current storefront package does not define a test script or typecheck script. `npm.cmd run lint` currently fails in the existing Next/ESLint setup before Phase 3B code with `@next/next/no-html-link-for-pages` receiving an undefined path. Add focused tests before launch for cart coupon validation, pending duplicate-submit prevention, successful add/remove, invalid promotion messages, and cart/checkout/order summary consistency.

Manual smoke checks:

- Home and store pages load with Sri Lanka region data.
- Product detail add-to-cart works.
- Cart, side cart, and checkout show applied coupons and authoritative totals.
- Coupon removal does not remove automatic promotions.
- Checkout can select shipping and payment after promotion changes.
- Order confirmation shows authoritative discount totals.

## Deployment

See `DEPLOYMENT.md`. Public `NEXT_PUBLIC_*` variables must be available during build, and `MEDUSA_BACKEND_URL` must be reachable from the deployed container.
