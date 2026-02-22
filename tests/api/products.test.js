const request = require('supertest');
const app = require('../../server');

describe('Products API', () => {
    describe('GET /api/products', () => {
        it('should return a list of products', async () => {
            const res = await request(app)
                .get('/api/products')
                .expect(200);

            expect(res.body.products).toBeDefined();
            expect(Array.isArray(res.body.products)).toBe(true);
            expect(res.body.total).toBeGreaterThan(0);
            expect(res.body.page).toBe(1);
            expect(res.body.categories).toBeDefined();
        });

        it('should support pagination', async () => {
            const res = await request(app)
                .get('/api/products?page=1&limit=2')
                .expect(200);

            expect(res.body.products.length).toBeLessThanOrEqual(2);
            expect(res.body.totalPages).toBeGreaterThan(0);
        });

        it('should filter by category', async () => {
            const res = await request(app)
                .get('/api/products?category=Electronics')
                .expect(200);

            res.body.products.forEach(p => {
                expect(p.category).toBe('Electronics');
            });
        });

        it('should search by keyword', async () => {
            const res = await request(app)
                .get('/api/products?search=headphones')
                .expect(200);

            expect(res.body.products.length).toBeGreaterThan(0);
        });

        it('should sort by price ascending', async () => {
            const res = await request(app)
                .get('/api/products?sort=price_asc')
                .expect(200);

            const prices = res.body.products.map(p => p.price);
            for (let i = 1; i < prices.length; i++) {
                expect(prices[i]).toBeGreaterThanOrEqual(prices[i - 1]);
            }
        });

        it('should sort by price descending', async () => {
            const res = await request(app)
                .get('/api/products?sort=price_desc')
                .expect(200);

            const prices = res.body.products.map(p => p.price);
            for (let i = 1; i < prices.length; i++) {
                expect(prices[i]).toBeLessThanOrEqual(prices[i - 1]);
            }
        });

        it('should return featured products', async () => {
            const res = await request(app)
                .get('/api/products?featured=1')
                .expect(200);

            res.body.products.forEach(p => {
                expect(p.featured).toBe(1);
            });
        });
    });

    describe('GET /api/products/:id', () => {
        it('should return a single product with related products', async () => {
            const listRes = await request(app).get('/api/products?limit=1');
            const productId = listRes.body.products[0].id;

            const res = await request(app)
                .get(`/api/products/${productId}`)
                .expect(200);

            expect(res.body.product).toBeDefined();
            expect(res.body.product.id).toBe(productId);
            expect(res.body.product.name).toBeDefined();
            expect(res.body.product.price).toBeDefined();
            expect(res.body.related).toBeDefined();
        });

        it('should return 404 for non-existent product', async () => {
            await request(app)
                .get('/api/products/99999')
                .expect(404);
        });
    });
});
