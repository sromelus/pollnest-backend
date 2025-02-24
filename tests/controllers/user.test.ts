import express from 'express';
import request from 'supertest';
import { dbConnect, dbDisconnect, dropDatabase } from '../helpers/dbTestConfig';
import routes from '../../src/routes';
import { User } from '../../src/models';

beforeAll(async () => {
    await dbConnect();
});

beforeEach(async () => {
    await dropDatabase();
    await User.syncIndexes(); // reset indexes for testing
});

afterAll(async () => {
    await dbDisconnect();
});

const app = express();
app.use(express.json());
app.use('/api/v1', routes);

describe('User Controller', () => {
    let authToken: string;
    let userId: string;

    // Helper to create a test user before each test
    beforeEach(async () => {
        const user = await User.create({
            firstName: 'John',
            lastName: 'Doe',
            email: 'john@example.com',
            password: 'ValidPass123!',
            verified: true
        });

        const loginRes = await request(app).post('/api/v1/auth/login').send({
            email: 'john@example.com',
            password: 'ValidPass123!'
        });

        userId = user.id;
        authToken = loginRes.body.data.token;
    });

    describe('.listUsers', () => {
        it('should get all users successfully', async () => {
            const res = await request(app)
                .get('/api/v1/users')
                .set('Authorization', `Bearer ${authToken}`);

            expect(res.status).toBe(200);
            expect(res.body.message).toBe('Users fetched successfully');
            expect(res.body.data.users).toBeInstanceOf(Array);
            expect(res.body.data.users.length).toBeGreaterThan(0);
        });
    });

    describe('.getUser', () => {
        it('should get user profile successfully', async () => {
            const res = await request(app)
                .get(`/api/v1/users/${userId}`)
                .set('Authorization', `Bearer ${authToken}`);

            expect(res.status).toBe(200);
            expect(res.body.message).toBe('User fetched successfully');
            expect(res.body.data.user).toHaveProperty('name', 'John Doe');
            expect(res.body.data.user).toHaveProperty('email', 'john@example.com');
        });
    });

    describe('.createUser', () => {
        it('should create a new user successfully', async () => {
            const res = await request(app)
                .post('/api/v1/users')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    name: 'Jane Doe',
                    email: 'jane@example.com',
                    password: 'ValidPass123!',
                    role: 'user',
                    verified: true
                });

            console.log(res.body);

            expect(res.status).toBe(201);
            expect(res.body.message).toBe('User created successfully');
            expect(res.body.data.user).toHaveProperty('name', 'Jane Doe');
            expect(res.body.data.user).toHaveProperty('email', 'jane@example.com');
            expect(res.body.data.user).toHaveProperty('verified', true);
        });

        it('should create a new user with role successfully', async () => {
            const res = await request(app)
                .post('/api/v1/users')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    name: 'Jane Doe',
                    email: 'jane@example.com',
                    password: 'ValidPass123!',
                    role: 'admin'
                });

            expect(res.status).toBe(201);
            expect(res.body.message).toBe('User created successfully');
            expect(res.body.data.user).toHaveProperty('name', 'Jane Doe');
            expect(res.body.data.user).toHaveProperty('email', 'jane@example.com');
            expect(res.body.data.user).toHaveProperty('role', 'admin');
        });
    });

    describe('.updateUser', () => {
        it('should update user profile successfully', async () => {
            const res = await request(app)
                .put(`/api/v1/users/${userId}`)
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    name: 'John Updated',
                    email: 'john.updated@example.com'
                });

            expect(res.status).toBe(200);
            expect(res.body.message).toBe('User updated successfully');
            expect(res.body.data.user).toHaveProperty('name', 'John Updated');
            expect(res.body.data.user).toHaveProperty('email', 'john.updated@example.com');
        });

        it('should fail to update with invalid email', async () => {
            const res = await request(app)
                .put(`/api/v1/users/${userId}`)
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    email: 'invalid-email'
                });

            expect(res.status).toBe(400);
            expect(res.body.message).toContain("Invalid value");
        });
    });

    describe('.deleteUser', () => {
        it('should delete user successfully', async () => {
            const res = await request(app)
                .delete(`/api/v1/users/${userId}`)
                .set('Authorization', `Bearer ${authToken}`);

            expect(res.status).toBe(200);
            expect(res.body.message).toBe('User deleted successfully');
        });

        it('should fail to delete non-existent user', async () => {
            const fakeId = '507f1f77bcf86cd799439011';
            const res = await request(app)
                .delete(`/api/v1/users/${fakeId}`)
                .set('Authorization', `Bearer ${authToken}`);

            expect(res.status).toBe(404);
            expect(res.body.message).toBe('User not found');
        });
    });
});