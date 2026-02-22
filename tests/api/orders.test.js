const request = require('supertest');
const app = require('../../server');
const db = require('../../db/database');

describe('Orders API', () => {
    let authToken;
    let userId;
    let orderId;
    const testUser = {
        name: 'Order Test User',
        email: `order_test_${Date.now()}@example.com`,
        password: 'password123'
    };

    beforeAll(async () => {
        // Register a test user
        const res = await request(app)
            .post('/api/auth/register')
            .send(testUser);
        authToken = res.body.token;
        userId = res.body.user.id;

        // Add items to cart
        const products = await request(app).get('/api/products?limit=2');
        for (const product of products.body.products) {
            await request(app)
                .post('/api/cart')
                .set('Authorization', `Bearer ${authToken}`)
                .send({ product_id: product.id, quantity: 1 });
        }
    });

    afterAll(() => {
        db.prepare('DELETE FROM order_items WHERE order_id IN (SELECT id FROM orders WHERE user_id = ?)').run(userId);
        db.prepare('DELETE FROM orders WHERE user_id = ?').run(userId);
        db.prepare('DELETE FROM cart_items WHERE user_id = ?').run(userId);
        db.prepare('DELETE FROM users WHERE id = ?').run(userId);
    });

    describe('POST /api/orders', () => {
        it('should reject checkout without shipping info', async () => {
            await request(app)
                .post('/api/orders')
                .set('Authorization', `Bearer ${authToken}`)
                .send({})
                .expect(400);
        });

        it('should create order from cart', async () => {
            const res = await request(app)
                .post('/api/orders')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    shipping_name: 'Test User',
                    shipping_address: '123 Test St',
                    shipping_city: 'Test City',
                    shipping_zip: '12345',
                    payment_method: 'card'
                })
                .expect(201);

            expect(res.body.message).toContain('Order placed');
            expect(res.body.order_id).toBeDefined();
            expect(res.body.total).toBeGreaterThan(0);
            orderId = res.body.order_id;
        });

        it('should reject checkout with empty cart', async () => {
            const res = await request(app)
                .post('/api/orders')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    shipping_name: 'Test',
                    shipping_address: '123 St',
                    shipping_city: 'City',
                    shipping_zip: '00000'
                })
                .expect(400);

            expect(res.body.error).toContain('empty');
        });
    });

    describe('GET /api/orders', () => {
        it('should return order history', async () => {
            const res = await request(app)
                .get('/api/orders')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(res.body.orders.length).toBeGreaterThan(0);
            expect(res.body.orders[0].item_count).toBeGreaterThan(0);
        });
    });

    describe('GET /api/orders/:id', () => {
        it('should return order detail with items', async () => {
            const res = await request(app)
                .get(`/api/orders/${orderId}`)
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(res.body.order.id).toBe(orderId);
            expect(res.body.order.items.length).toBeGreaterThan(0);
            expect(res.body.order.shipping_name).toBe('Test User');
        });

        it('should return 404 for non-existent order', async () => {
            await request(app)
                .get('/api/orders/99999')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(404);
        });
    });
});
