import { defineConfig, devices } from '@playwright/test'
import { nxE2EPreset } from '@nx/playwright/preset'

// The UI dev server runs on 5173 and, via the `dev` configuration, loads
// `.env.dev` (which provides VITE_API_URL). Override with BASE_URL in CI.
const baseURL = process.env['BASE_URL'] || 'http://localhost:5173'

export default defineConfig({
  ...nxE2EPreset(__filename, { testDir: './src' }),
  use: {
    baseURL,
    trace: 'on-first-retry',
  },
  webServer: {
    command: 'npx nx run ui:serve:dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
})
