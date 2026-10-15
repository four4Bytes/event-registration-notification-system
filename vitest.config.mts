import path from "node:path";

import { storybookTest } from "@storybook/addon-vitest/vitest-plugin";
import { playwright } from "@vitest/browser-playwright";
import { defineConfig } from "vitest/config";

const dirname = import.meta.dirname;

// More info at: https://storybook.js.org/docs/next/writing-tests/integrations/vitest-addon
export default defineConfig({
  test: {
    passWithNoTests: true,
    projects: [
      {
        resolve: {
          tsconfigPaths: true,
        },
        test: {
          name: "unit",
          include: ["src/**/*.test.{ts,tsx}"],
          exclude: ["src/stories/**", "src/**/*.integration.test.{ts,tsx}"],
          setupFiles: ["./vitest.setup.ts"],
        },
      },
      {
        resolve: {
          tsconfigPaths: true,
        },
        test: {
          name: "integration",
          include: ["src/**/*.integration.test.{ts,tsx}"],
          exclude: ["src/stories/**"],
          setupFiles: ["./vitest.setup.ts", "./vitest.integration.setup.ts"],
          fileParallelism: false,
        },
      },
      {
        extends: false,
        plugins: [
          // The plugin will run tests for the stories defined in your Storybook config
          // See options at: https://storybook.js.org/docs/next/writing-tests/integrations/vitest-addon#storybooktest
          storybookTest({ configDir: path.join(dirname, ".storybook") }),
        ],
        test: {
          name: "storybook",
          browser: {
            enabled: true,
            headless: true,
            provider: playwright({}),
            instances: [{ browser: "chromium" }],
          },
        },
      },
    ],
  },
});
