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
    await User.syncIndexes();
});

afterAll(async () => {
    await dbDisconnect();
});

const app = express();
app.use(express.json());
app.use('/api/v1', routes);

describe('User Management', () => {
    let authToken: string;
    let userId: string;

    // Helper to create a test user before each test
    beforeEach(async () => {
        const res = await request(app).post('/api/v1/registration/signup').send({
            name: 'John Doe',
            email: 'john@example.com',
            password: 'ValidPass123!'
        });
        userId = res.body.user.id;
        // You'll need to implement login and get the auth token
        // authToken = res.body.token;
    });

    describe('Get User', () => {
        it('should get user profile successfully', async () => {
            const res = await request(app)
                .get(`/api/v1/users/${userId}`)
                // .set('Authorization', `Bearer ${authToken}`)

            expect(res.status).toBe(200);
            expect(res.body.user).toHaveProperty('name', 'John Doe');
            expect(res.body.user).toHaveProperty('email', 'john@example.com');
        });
    });

    describe('Get Users', () => {
        it('should get all users successfully', async () => {
            const res = await request(app).get('/api/v1/users');

            expect(res.status).toBe(200);
            expect(res.body.users).toBeInstanceOf(Array);
            expect(res.body.users.length).toBeGreaterThan(0);
        });
    });

    describe('Create User', () => {
        it('should create a new user successfully', async () => {
            const res = await request(app).post('/api/v1/users').send({
                name: 'Jane Doe',
                email: 'jane@example.com',
                password: 'ValidPass123!'
            });

            expect(res.status).toBe(200);
            expect(res.body.user).toHaveProperty('name', 'Jane Doe');
            expect(res.body.user).toHaveProperty('email', 'jane@example.com');
        });
    });

    describe('Update User', () => {
        it('should update user profile successfully', async () => {
            const res = await request(app)
                .put(`/api/v1/users/${userId}`)
                // .set('Authorization', `Bearer ${authToken}`)
                .send({
                    name: 'John Updated',
                    email: 'john.updated@example.com'
                });

            expect(res.status).toBe(200);
            expect(res.body.user).toHaveProperty('name', 'John Updated');
            expect(res.body.user).toHaveProperty('email', 'john.updated@example.com');
        });

        it('should fail to update with invalid email', async () => {
            const res = await request(app)
                .put(`/api/v1/users/${userId}`)
                // .set('Authorization', `Bearer ${authToken}`)
                .send({
                    email: 'invalid-email'
                });

            expect(res.status).toBe(400);
            expect(res.body).toHaveProperty('error');
        });
    });

    describe('Delete User', () => {
        it('should delete user successfully', async () => {
            const res = await request(app)
                .delete(`/api/v1/users/${userId}`)
                // .set('Authorization', `Bearer ${authToken}`);

            expect(res.status).toBe(200);

            // Verify user is actually deleted
            const deletedUser = await User.findById(userId);
            expect(deletedUser).toBeNull();
        });

        it('should fail to delete non-existent user', async () => {
            const fakeId = '507f1f77bcf86cd799439011';
            const res = await request(app)
                .delete(`/api/v1/users/${fakeId}`)
                // .set('Authorization', `Bearer ${authToken}`);

            expect(res.status).toBe(404);
        });
    });
});