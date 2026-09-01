import { existsSync } from 'node:fs'
import { defineConfig, devices } from '@playwright/test'

// The sandbox ships a pre-installed Chromium at /opt/pw-browsers/chromium whose
// build number may not match this @playwright/test release. Prefer it when present.
const localChromium = '/opt/pw-browsers/chromium'
const executablePath =
  process.env.PW_CHROMIUM_PATH ?? (existsSync(localChromium) ? localChromium : undefined)

const BASE = 'http://127.0.0.1:4173/Special4/'

export default defineConfig({
  testDir: './tests',
  timeout: 30_000,
  fullyParallel: true,
  reporter: [['list']],
  use: {
    baseURL: BASE,
    trace: 'retain-on-failure',
    launchOptions: executablePath ? { executablePath } : {},
  },
  webServer: {
    command: 'npm run preview -- --host 127.0.0.1 --port 4173 --strictPort',
    url: BASE,
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
  projects: [
    {
      name: 'desktop',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 800 } },
    },
    {
      name: 'mobile',
      use: { ...devices['Pixel 7'], viewport: { width: 375, height: 812 } },
    },
  ],
})
