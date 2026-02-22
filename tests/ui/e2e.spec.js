const { test, expect } = require('@playwright/test');

test.describe('E-Commerce E2E User Journey', () => {

    test('homepage loads with products', async ({ page }) => {
        await page.goto('/');
        await expect(page.locator('.hero h1')).toBeVisible();
        await expect(page.locator('.product-card').first()).toBeVisible();
        await expect(page.locator('.nav-logo')).toContainText('NovaMart');
    });

    test('can browse products and filter by category', async ({ page }) => {
        await page.goto('/#/products');
        await page.waitForSelector('.product-card');

        // Verify products are displayed
        const cards = page.locator('.product-card');
        await expect(cards.first()).toBeVisible();

        // Check filter bar exists
        await expect(page.locator('#category-filter')).toBeVisible();
        await expect(page.locator('#sort-filter')).toBeVisible();
    });

    test('can view product detail', async ({ page }) => {
        await page.goto('/#/products');
        await page.waitForSelector('.product-card');

        // Click first product
        await page.locator('.product-card').first().click();
        await page.waitForSelector('.product-detail-name');

        // Verify detail page elements
        await expect(page.locator('.product-detail-name')).toBeVisible();
        await expect(page.locator('.product-detail-desc')).toBeVisible();
        await expect(page.locator('.price-current')).toBeVisible();
        await expect(page.locator('.qty-controls')).toBeVisible();
    });

    test('full user journey: register → add to cart → checkout', async ({ page }) => {
        const uniqueEmail = `e2e_${Date.now()}@test.com`;

        // Step 1: Register
        await page.goto('/#/register');
        await page.waitForSelector('#reg-name');
        await page.fill('#reg-name', 'E2E Test User');
        await page.fill('#reg-email', uniqueEmail);
        await page.fill('#reg-password', 'testpass123');
        await page.click('#register-btn');

        // Wait for redirect to home
        await page.waitForSelector('.hero', { timeout: 5000 });
        await expect(page.locator('.user-menu-btn')).toBeVisible();

        // Step 2: Browse and add to cart
        await page.goto('/#/products');
        await page.waitForSelector('.product-card');
        await page.locator('.add-cart-btn').first().click();

        // Verify toast notification
        await expect(page.locator('.toast.success')).toBeVisible();

        // Verify cart badge
        await expect(page.locator('#cart-badge')).toBeVisible();

        // Step 3: Go to cart
        await page.click('#cart-btn');
        await page.waitForSelector('.cart-item');
        await expect(page.locator('.cart-item')).toHaveCount(1);
        await expect(page.locator('.cart-summary')).toBeVisible();

        // Step 4: Go to checkout
        await page.click('text=Proceed to Checkout');
        await page.waitForSelector('#shipping_name');

        // Fill shipping info
        await page.fill('#shipping_name', 'E2E Test User');
        await page.fill('#shipping_address', '123 E2E Street');
        await page.fill('#shipping_city', 'Test City');
        await page.fill('#shipping_zip', '90210');

        // Submit order
        await page.click('#place-order-btn');

        // Verify success page
        await page.waitForSelector('.success-icon', { timeout: 5000 });
        await expect(page.locator('.success-card h1')).toContainText('Order Placed');

        // Step 5: Check order history
        await page.click('text=View Orders');
        await page.waitForSelector('.order-card');
        await expect(page.locator('.order-card')).toHaveCount(1);
    });

    test('login and logout flow', async ({ page }) => {
        const uniqueEmail = `login_${Date.now()}@test.com`;

        // Register first
        await page.goto('/#/register');
        await page.waitForSelector('#reg-name');
        await page.fill('#reg-name', 'Login Test');
        await page.fill('#reg-email', uniqueEmail);
        await page.fill('#reg-password', 'testpass123');
        await page.click('#register-btn');
        await page.waitForSelector('.user-menu-btn', { timeout: 5000 });

        // Logout
        await page.click('.user-menu-btn');
        await page.waitForSelector('.dropdown-menu.open');
        await page.click('text=Sign Out');

        // Verify logged out
        await expect(page.locator('text=Sign In')).toBeVisible();

        // Login again
        await page.goto('/#/login');
        await page.waitForSelector('#login-email');
        await page.fill('#login-email', uniqueEmail);
        await page.fill('#login-password', 'testpass123');
        await page.click('#login-btn');
        await page.waitForSelector('.user-menu-btn', { timeout: 5000 });
        await expect(page.locator('.user-menu-btn')).toBeVisible();
    });

    test('search functionality', async ({ page }) => {
        await page.goto('/');
        await page.waitForSelector('#search-input');
        await page.fill('#search-input', 'headphones');
        await page.press('#search-input', 'Enter');

        await page.waitForSelector('.products-page');
        await expect(page.locator('.products-page-header h1')).toContainText('headphones');
    });

    test('cart requires authentication', async ({ page }) => {
        // Clear any stored tokens by visiting in a fresh context
        await page.goto('/#/cart');

        // Should redirect to login since not authenticated
        // The app navigates to login when not logged in
        await page.waitForTimeout(1000);
        const url = page.url();
        expect(url).toContain('login');
    });
});
