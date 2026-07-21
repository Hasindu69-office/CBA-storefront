# Coolify Storefront Deployment

This storefront is a Next.js app deployed with Coolify's Dockerfile build pack.

## Coolify Settings

- Build pack: `Dockerfile`
- Build context: `storefront`
- Dockerfile path: `storefront/Dockerfile`
- Exposed port: `8000`
- Start command: leave empty

If Coolify treats `storefront` as the application root after setting the build context, use `Dockerfile` as the Dockerfile path.

## Environment Variables

Add these variables in Coolify. Public `NEXT_PUBLIC_*` values must be available during the Docker build because Next.js embeds them into the production bundle.

```env
NODE_ENV=production
PORT=8000
HOSTNAME=0.0.0.0
MEDUSA_BACKEND_URL=https://your-backend-domain
NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY=replace-with-publishable-key
NEXT_PUBLIC_BASE_URL=https://your-storefront-domain
```

Optional variables:

```env
NEXT_PUBLIC_DEFAULT_REGION=lk
NEXT_PUBLIC_STRIPE_KEY=replace-with-stripe-public-key
NEXT_PUBLIC_MEDUSA_PAYMENTS_PUBLISHABLE_KEY=replace-with-medusa-payments-key
NEXT_PUBLIC_MEDUSA_PAYMENTS_ACCOUNT_ID=replace-with-medusa-payments-account-id
MEDUSA_CLOUD_S3_HOSTNAME=replace-with-s3-hostname
MEDUSA_CLOUD_S3_PATHNAME=replace-with-s3-pathname
```

Use the public Coolify/backend URL for `MEDUSA_BACKEND_URL`, not `localhost`, because middleware and server-side rendering run inside the container.

In Coolify, make sure these same values are available as build variables/build arguments as well as runtime environment variables. The Dockerfile accepts matching `ARG` names and also exposes them to the standalone Next.js runtime.

## Dockerfile Notes

The Dockerfile uses three stages:

1. `deps`: installs dependencies with `npm ci`.
2. `builder`: copies source, applies build-time environment variables, and runs `npm run build`.
3. `runner`: runs the standalone Next.js server with `node server.js` as the non-root `node` user.

The app uses `output: "standalone"` in `next.config.js`, which is required for this runtime layout.

The repository also contains Yarn metadata, but this deployment path intentionally uses `package-lock.json` and `npm ci` because that is the lockfile used by the current Dockerfile and verified local build.

## Verification

Before deploying:

```bash
cd storefront
npm run build
```

From the repository root, test the Docker build:

```bash
docker build -f storefront/Dockerfile storefront
```

After deploying in Coolify:

- Open the generated storefront URL.
- Confirm `/` redirects to a valid country route.
- Confirm a store or product page loads.
- Check Coolify logs for missing environment variables or backend connectivity failures.
