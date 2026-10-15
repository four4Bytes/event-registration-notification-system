import { beforeAll } from "vitest";

if (process.env.TEST_DATABASE_URL?.trim()) {
  process.env.DATABASE_URL = process.env.TEST_DATABASE_URL.trim();
}

function databaseNameOf(url: string): string {
  const path = new URL(url).pathname.replace(/^\//, "");
  return path.split("?")[0];
}

beforeAll(() => {
  const databaseUrl = process.env.DATABASE_URL?.trim();
  if (!databaseUrl) {
    throw new Error(
      "Integration tests need TEST_DATABASE_URL (or DATABASE_URL) pointing at a test database.",
    );
  }
  const name = databaseNameOf(databaseUrl);
  if (!name.includes("test")) {
    throw new Error(
      `Refusing to run integration tests against non-test database "${name}". Use a database with "test" in its name.`,
    );
  }
});
