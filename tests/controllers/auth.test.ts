import request from "supertest";
import express from "express";
import routes from "../../src/routes";
import { dbConnect, dbDisconnect, dropDatabase } from "../helpers/dbTestConfig";
import { testUser } from "../factories";

beforeAll(async () => {
    await dbConnect();
});

beforeEach(async () => {
    await dropDatabase();
});

afterAll(async () => {
    await dbDisconnect();
});


const app = express();

app.use(express.json());
app.use('/api/v1', routes);

describe('Auth Controller', () => {
    beforeEach(async () => {
        const user = testUser({email: "john@example.com"});
        await user.save();
    });

    describe('Login', () => {
        it('should login user successfully', async () => {
            const res = await request(app).post('/api/v1/auth/login').send({
                email: 'john@example.com',
                password: '12345678Aa!'
            });

            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('token');
        });

        it('should not login user with invalid credentials', async () => {
            const res = await request(app).post('/api/v1/auth/login').send({
                email: 'john@example.com',
                password: 'InvalidPass123!'
            });

            expect(res.status).toBe(401);
            expect(res.body).toHaveProperty('message', 'Invalid credentials');
        });
    });

    describe('Logout', () => {
        it('should logout user successfully', async () => {
            const loginRes = await request(app).post('/api/v1/auth/login').send({
                email: 'john@example.com',
                password: '12345678Aa!'
            });

            const token = loginRes.body.token;

            const logoutRes = await request(app).post('/api/v1/auth/logout').set('Authorization', `Bearer ${token}`);

            expect(logoutRes.status).toBe(200);
            expect(logoutRes.body).toHaveProperty('message', 'Logout successful');
        });
    });
});