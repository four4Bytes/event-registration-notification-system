This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Testing

```bash
pnpm test              # unit project only, no Postgres needed
pnpm test:integration  # DB-backed tests, needs TEST_DATABASE_URL
```

Integration tests run in the `integration` Vitest project (`src/**/*.integration.test.{ts,tsx}`), serialized, each file starting from a clean database. They refuse to run unless the database name contains `test`, so the dev database is never wiped.

```bash
# 1. Create the test database if needed, then apply migrations to it:
DATABASE_URL="postgresql://postgres:postgres@localhost:5545/kasama_test?schema=public" pnpm prisma:deploy

# 2. Run the integration suite:
TEST_DATABASE_URL="postgresql://postgres:postgres@localhost:5545/kasama_test?schema=public" pnpm test:integration
```

When port 5432 is already in use by another Postgres instance, point `TEST_DATABASE_URL` (or `DATABASE_URL`) at that instance's port — for example `localhost:5545` above. Never stop or remove another project's database container to free the port; run yours on a different port instead.

Seed note: `pnpm prisma:seed` is always refused when `NODE_ENV=production`, and it is refused against a non-local database host — seeding from inside Docker, where the host is not `localhost`, `127.0.0.1`, `::1` or `0.0.0.0` — unless `ALLOW_SEED=true` is set explicitly. `ALLOW_SEED` never overrides production.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
