import express from 'express';
import request from 'supertest';
import { dbConnect, dbDisconnect, dropDatabase } from '../helpers/dbTestConfig';
import { testPoll, testUser } from "../factories";
import routes from '../../src/routes';


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
app.use('/api/v1', routes)


describe('Poll Controller', () => {
    let authToken: string;
    let userId: string;

    beforeEach(async () => {
        const user = testUser();
        user.role = 'admin';
        await user.save();
        userId = user.id;

        const loginRes = await request(app).post('/api/v1/auth/login').send({
            email: testUser().email,
            password: testUser().password
        });

        authToken = loginRes.body.token;
    });

    describe('Get Polls', () => {
        it('should get a poll', async () => {
            const poll1 = testPoll({ userId });
            const poll2 = testPoll({ userId });
            await poll1.save();
            await poll2.save();
            const res = await request(app).get(`/api/v1/polls`);

            expect(res.status).toBe(200);
            expect(res.body.polls).toHaveLength(2);
        });
    });

    describe('Get Poll', () => {
        it('should get a poll', async () => {
            const poll = testPoll({ userId });
            await poll.save();
            const res = await request(app).get(`/api/v1/polls/${poll.id}`);

            expect(res.status).toBe(200);
            expect(res.body.poll.title).toBe(poll.title);
        });

        it('should not get a poll with an invalid id', async () => {
            const res = await request(app).get(`/api/v1/polls/67a19b4c133a020b8171b213`);

            expect(res.status).toBe(404);
            expect(res.body.error).toBe('Poll not found');
        });
    });

    describe('Create Poll', () => {
        it('should create a poll', async () => {
            const res = await request(app).post('/api/v1/polls').set('Authorization', `Bearer ${authToken}`).send({
                title: 'Test Poll',
                description: 'This is a test poll',
                pollOptions: [{img: 'trump_img', pollOptionText: 'trump', count: 0}, {img: 'kamala_img', pollOptionText: 'kamala', count: 0}],
                userId: userId,
            });

            expect(res.status).toBe(200);
        });

        it('should not create a poll when missing required fields', async () => {
            const res = await request(app).post('/api/v1/polls').set('Authorization', `Bearer ${authToken}`).send({
                //missing fields
                // title: 'Test Poll',
                // description: 'This is a test poll',
                // userId: userId,
                pollOptions: [
                    {img: 'trump_img', pollOptionText: 'trump', count: 0},
                    // {img: 'kamala_img', pollOptionText: 'kamala', count: 0}
                ],
            });

            expect(res.status).toBe(400);
        });
    });

    describe('Update Poll', () => {
        let pollId: string;

        beforeEach(async () => {
            const poll = testPoll({ userId });
            await poll.save();
            pollId = poll.id;
        });

        it('should update a poll', async () => {
            const res = await request(app).put(`/api/v1/polls/${pollId}`).set('Authorization', `Bearer ${authToken}`).send({
                title: 'Updated Poll',
                description: 'This is an updated poll',
                userId: userId,
            });

            expect(res.status).toBe(200);
            expect(res.body.poll.title).toBe('Updated Poll');
        });
    });

    describe('Delete Poll', () => {
        let pollId: string;

        beforeEach(async () => {
            const poll = testPoll({ userId });
            await poll.save();
            pollId = poll.id;
        });

        it('should delete a poll', async () => {
            const res = await request(app).delete(`/api/v1/polls/${pollId}`).set('Authorization', `Bearer ${authToken}`);

            expect(res.status).toBe(200);
            expect(res.body.message).toBe('Poll deleted successfully');
        });
    });
});