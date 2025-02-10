import express from 'express';
import request from 'supertest';
import { dbConnect, dbDisconnect, dropDatabase } from '../helpers/dbTestConfig';
import { testPoll, testUser } from "../factories";
import routes from '../../src/routes';
import { UserRole } from '../../src/models/User';
import { Types } from 'mongoose';

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
    let creatorId: Types.ObjectId;

    beforeEach(async () => {
        const user = testUser({});
        user.role = UserRole.Admin;
        await user.save();
        creatorId = user._id as Types.ObjectId;

        const loginRes = await request(app).post('/api/v1/auth/login').send({
            email: testUser({}).email,
            password: testUser({}).password
        });

        authToken = loginRes.body.data.token;
    });

    describe('Get Polls', () => {
        it('should get a poll', async () => {
            const poll1 = testPoll({ creatorId });
            const poll2 = testPoll({ creatorId });
            await poll1.save();
            await poll2.save();
            const res = await request(app).get(`/api/v1/polls`);

            expect(res.status).toBe(200);
            expect(res.body.message).toBe('Polls fetched successfully');
            expect(res.body.data.polls).toHaveLength(2);
        });
    });

    describe('Get Poll', () => {
        it('should get a poll', async () => {
            const poll = testPoll({ creatorId });
            await poll.save();
            const res = await request(app).get(`/api/v1/polls/${poll.id}`);

            expect(res.status).toBe(200);
            expect(res.body.message).toBe('Poll fetched successfully');
            expect(res.body.data.poll.title).toBe(poll.title);
        });

        it('should not get a poll with an invalid id', async () => {
            const res = await request(app).get(`/api/v1/polls/67a19b4c133a020b8171b213`);

            expect(res.status).toBe(404);
            expect(res.body.success).toBe(false);
            expect(res.body.message).toBe('Poll not found');
        });
    });

    describe('Get Poll Options', () => {
        it('should get poll options', async () => {
            const poll = testPoll({ creatorId });
            await poll.save();
            const res = await request(app).get(`/api/v1/polls/${poll.id}/options`);

            expect(res.status).toBe(200);
            expect(res.body.message).toBe('Poll options fetched successfully');
            expect(res.body.data.voteTallies).toHaveLength(2);
        });
    });

    describe('Create Poll', () => {
        it('should create a poll', async () => {
            const res = await request(app).post('/api/v1/polls').set('Authorization', `Bearer ${authToken}`).send({
                title: 'Test Poll',
                description: 'This is a test poll',
                pollOptions: [{image: 'trump_img', pollOptionText: 'trump', count: 0}, {image: 'kamala_img', pollOptionText: 'kamala', count: 0}],
                creatorId: creatorId,
            });

            expect(res.status).toBe(201);
            expect(res.body.message).toBe('Poll created successfully');
        });

        it('should not create a poll when missing required fields', async () => {
            const res = await request(app).post('/api/v1/polls').set('Authorization', `Bearer ${authToken}`).send({
                //missing fields
                // title: 'Test Poll',
                // description: 'This is a test poll',
                // creatorId: creatorId,
                pollOptions: [
                    {image: 'trump_img', pollOptionText: 'trump', count: 0},
                    // {image: 'kamala_img', pollOptionText: 'kamala', count: 0}
                ],
            });

            expect(res.status).toBe(400);
            expect(res.body.message).toBe('validation error');
        });
    });

    describe('Update Poll', () => {
        let pollId: string;

        beforeEach(async () => {
            const poll = testPoll({ creatorId });
            await poll.save();
            pollId = poll.id;
        });

        it('should update a poll', async () => {
            const res = await request(app).put(`/api/v1/polls/${pollId}`).set('Authorization', `Bearer ${authToken}`).send({
                title: 'Updated Poll',
                description: 'This is an updated poll',
                creatorId: creatorId,
            });

            expect(res.status).toBe(200);
            expect(res.body.message).toBe('Poll updated successfully');
            expect(res.body.data.poll.title).toBe('Updated Poll');
        });
    });

    describe('Delete Poll', () => {
        let pollId: string;

        beforeEach(async () => {
            const poll = testPoll({ creatorId });
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