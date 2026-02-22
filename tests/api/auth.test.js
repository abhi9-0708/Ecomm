const request = require('supertest');
const app = require('../../server');
const db = require('../../db/database');

describe('Auth API', () => {
    const testUser = {
        name: 'Test User',
        email: `test_${Date.now()}@example.com`,
        password: 'password123'
    };
    let authToken;

    afterAll(() => {
        // Clean up test user
        db.prepare('DELETE FROM users WHERE email = ?').run(testUser.email);
    });

    describe('POST /api/auth/register', () => {
        it('should register a new user', async () => {
            const res = await request(app)
                .post('/api/auth/register')
                .send(testUser)
                .expect(201);

            expect(res.body.message).toBe('Registration successful');
            expect(res.body.token).toBeDefined();
            expect(res.body.user.name).toBe(testUser.name);
            expect(res.body.user.email).toBe(testUser.email);
            authToken = res.body.token;
        });

        it('should reject duplicate email', async () => {
            const res = await request(app)
                .post('/api/auth/register')
                .send(testUser)
                .expect(409);

            expect(res.body.error).toContain('already registered');
        });

        it('should reject missing fields', async () => {
            const res = await request(app)
                .post('/api/auth/register')
                .send({ email: 'test@test.com' })
                .expect(400);

            expect(res.body.error).toBeDefined();
        });

        it('should reject short password', async () => {
            const res = await request(app)
                .post('/api/auth/register')
                .send({ name: 'X', email: 'short@test.com', password: '123' })
                .expect(400);

            expect(res.body.error).toContain('at least 6');
        });
    });

    describe('POST /api/auth/login', () => {
        it('should login with valid credentials', async () => {
            const res = await request(app)
                .post('/api/auth/login')
                .send({ email: testUser.email, password: testUser.password })
                .expect(200);

            expect(res.body.token).toBeDefined();
            expect(res.body.user.email).toBe(testUser.email);
            authToken = res.body.token;
        });

        it('should reject invalid password', async () => {
            await request(app)
                .post('/api/auth/login')
                .send({ email: testUser.email, password: 'wrongpassword' })
                .expect(401);
        });

        it('should reject non-existent email', async () => {
            await request(app)
                .post('/api/auth/login')
                .send({ email: 'nonexistent@test.com', password: 'password123' })
                .expect(401);
        });
    });

    describe('GET /api/auth/me', () => {
        it('should return current user with valid token', async () => {
            const res = await request(app)
                .get('/api/auth/me')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(res.body.user.email).toBe(testUser.email);
            expect(res.body.user.name).toBe(testUser.name);
        });

        it('should reject request without token', async () => {
            await request(app)
                .get('/api/auth/me')
                .expect(401);
        });

        it('should reject invalid token', async () => {
            await request(app)
                .get('/api/auth/me')
                .set('Authorization', 'Bearer invalidtoken123')
                .expect(403);
        });
    });
});
