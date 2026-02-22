const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
    testDir: './tests/ui',
    fullyParallel: false,
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 2 : 0,
    workers: 1,
    reporter: [['html', { open: 'never' }], ['list']],
    use: {
        baseURL: 'http://localhost:3000',
        trace: 'on-first-retry',
        screenshot: 'only-on-failure',
    },
    webServer: {
        command: 'node server.js',
        port: 3000,
        timeout: 10000,
        reuseExistingServer: !process.env.CI,
    },
});
