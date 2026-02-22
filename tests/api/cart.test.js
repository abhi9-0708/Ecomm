const request = require('supertest');
const app = require('../../server');
const db = require('../../db/database');

describe('Cart API', () => {
    let authToken;
    let productId;
    let cartItemId;
    const testUser = {
        name: 'Cart Test User',
        email: `cart_test_${Date.now()}@example.com`,
        password: 'password123'
    };

    beforeAll(async () => {
        // Register a test user
        const res = await request(app)
            .post('/api/auth/register')
            .send(testUser);
        authToken = res.body.token;

        // Get a product ID
        const products = await request(app).get('/api/products?limit=1');
        productId = products.body.products[0].id;
    });

    afterAll(() => {
        db.prepare('DELETE FROM cart_items WHERE user_id = (SELECT id FROM users WHERE email = ?)').run(testUser.email);
        db.prepare('DELETE FROM users WHERE email = ?').run(testUser.email);
    });

    describe('POST /api/cart', () => {
        it('should require authentication', async () => {
            await request(app)
                .post('/api/cart')
                .send({ product_id: productId })
                .expect(401);
        });

        it('should add item to cart', async () => {
            const res = await request(app)
                .post('/api/cart')
                .set('Authorization', `Bearer ${authToken}`)
                .send({ product_id: productId, quantity: 2 })
                .expect(201);

            expect(res.body.message).toContain('Added to cart');
            cartItemId = res.body.id;
        });

        it('should increment quantity if product already in cart', async () => {
            const res = await request(app)
                .post('/api/cart')
                .set('Authorization', `Bearer ${authToken}`)
                .send({ product_id: productId, quantity: 1 })
                .expect(200);

            expect(res.body.message).toContain('Cart updated');
            expect(res.body.quantity).toBe(3);
        });

        it('should reject non-existent product', async () => {
            await request(app)
                .post('/api/cart')
                .set('Authorization', `Bearer ${authToken}`)
                .send({ product_id: 99999 })
                .expect(404);
        });
    });

    describe('GET /api/cart', () => {
        it('should return cart items with total', async () => {
            const res = await request(app)
                .get('/api/cart')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(res.body.items.length).toBeGreaterThan(0);
            expect(res.body.total).toBeGreaterThan(0);
            expect(res.body.count).toBeGreaterThan(0);
        });
    });

    describe('PUT /api/cart/:id', () => {
        it('should update item quantity', async () => {
            const res = await request(app)
                .put(`/api/cart/${cartItemId}`)
                .set('Authorization', `Bearer ${authToken}`)
                .send({ quantity: 5 })
                .expect(200);

            expect(res.body.quantity).toBe(5);
        });

        it('should reject invalid quantity', async () => {
            await request(app)
                .put(`/api/cart/${cartItemId}`)
                .set('Authorization', `Bearer ${authToken}`)
                .send({ quantity: 0 })
                .expect(400);
        });
    });

    describe('DELETE /api/cart/:id', () => {
        it('should remove item from cart', async () => {
            const res = await request(app)
                .delete(`/api/cart/${cartItemId}`)
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(res.body.message).toContain('removed');
        });

        it('should return 404 for non-existent cart item', async () => {
            await request(app)
                .delete(`/api/cart/${cartItemId}`)
                .set('Authorization', `Bearer ${authToken}`)
                .expect(404);
        });
    });
});
