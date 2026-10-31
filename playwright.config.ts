import { defineConfig, devices } from "@playwright/test";
export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  workers: 1,
  use: {
    baseURL: "http://127.0.0.1:3100",
    channel: "chrome",
    trace: "retain-on-failure",
    viewport: { width: 1440, height: 900 },
  },
  webServer: {
    command:
      "PORT=3100 DEADNET_DB=.data/e2e.sqlite MODEL_PROVIDER=ollama OPENROUTER_API_KEY= ELEVENLABS_API_KEY= SENTRY_DSN= OLLAMA_URL=http://127.0.0.1:9 npm run dev",
    url: "http://127.0.0.1:3100/api/state",
    reuseExistingServer: false,
  },
  projects: [
    { name: "desktop" },
    {
      name: "mobile",
      use: {
        ...devices["iPhone 13"],
        defaultBrowserType: "chromium",
        channel: "chrome",
      },
    },
  ],
});
