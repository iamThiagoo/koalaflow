# Next apps (`apps/app`, `apps/site`)

- No `@nx/next` (it pulls in webpack): targets come from `package.json` scripts; `typecheck` is `next typegen && tsc --noEmit` because `@nx/js/typescript` skips Next projects.
- `apps/site` stays fully static: no proxy, redirects, cookies, server actions or route handlers that read the request. It reads `SITE_URL`, `APP_URL` and `SALES_CONTACT_URL` at build time, with no defaults in code: locally from `apps/site/.env` (copy `.env.example`), in CI from repository variables.
- `apps/site/Dockerfile` is a local preview only (nginx mirroring the CloudFront rules); production is S3 + CloudFront, with no container or ECR. Build it from the repo root: `docker build -f apps/site/Dockerfile -t koalaflow-site . && docker run --rm -p 8080:8080 koalaflow-site`.
- `apps/site/tsconfig.json` excludes `.next/dev/types/validator.ts`: `next dev` generates it with unused imports when metadata routes exist, breaking `noUnusedLocals`; `.next/types/validator.ts` still validates the routes.
