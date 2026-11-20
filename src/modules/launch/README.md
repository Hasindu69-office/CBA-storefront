# One-time storefront launch gate

Temporary ceremony + middleware lock. Delete this module after go-live.

## Env

**Storefront**

```env
LAUNCH_GATE_ENABLED=true
LAUNCH_UNLOCK_SECRET=shared-with-backend
LAUNCH_ALLOW_RESET=true
```

**Backend**

```env
LAUNCH_UNLOCK_SECRET=shared-with-storefront
LAUNCH_ALLOW_RESET=true
```

## Test

1. Gate on, not unlocked → any URL shows `/launch`.
2. Without key → Launch button refuses unlock; `T` runs animation only.
3. Presenter: `/launch?launch_key=YOUR_SECRET` → Space/Click unlocks globally → shop.
4. Second browser → after unlock, poll/middleware opens shop.
5. `POST /api/launch/reset` with secret (when `LAUNCH_ALLOW_RESET=true`) to rehearse again.
6. `LAUNCH_GATE_ENABLED=false` → normal shop without deleting code.

## Post-launch delete checklist

1. Set `LAUNCH_GATE_ENABLED=false` in Coolify (or remove vars).
2. Delete:
   - `storefront/src/modules/launch/`
   - `storefront/src/lib/launch/`
   - `storefront/src/app/launch/`
   - `storefront/src/app/api/launch/`
   - `storefront/public/launch/`
   - `backend/src/api/store/cba/v1/launch/`
   - `backend/src/lib/cba/launch-gate.ts`
3. Remove the launch-gate block from `storefront/src/middleware.ts`.
4. Remove launch env vars from storefront + backend.
5. Optional: remove CMS `feature_flags.site_launched` in admin.
6. Optional: remove standalone `Website Launch/` folder from the repo.
