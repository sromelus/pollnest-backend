import express from 'express';
import request from 'supertest';
import { dbConnect, dbDisconnect, dropDatabase } from '../helpers/dbTestConfig';
import { testPoll, testUser } from "../factories";
import routes from '../../src/routes';
import { UserRole } from '../../src/models';
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
        const userAdmin = await testUser({ role: UserRole.Admin, verified: true }).save();
        creatorId = userAdmin._id as Types.ObjectId;

        const loginRes = await request(app).post('/api/v1/auth/login').send({
            email: userAdmin.email,
            password: testUser({}).password
        });

        authToken = loginRes.body.data.token;
    });

    describe('.listPolls', () => {
        it('should only list public polls to non-admin users', async () => {
            await testPoll({ creatorId, public: true }).save();
            await testPoll({ creatorId, public: false }).save();
            const poll2 = await testPoll({ creatorId, public: true }).save();

            const res = await request(app).get(`/api/v1/polls`);

            expect(res.status).toBe(200);
            expect(res.body.message).toBe('Polls fetched successfully');
            //order descending - the latest poll should be first
            expect(res.body.data.polls[0]._id.toString()).toEqual((poll2._id as Types.ObjectId).toString());
            expect(res.body.data.polls).toHaveLength(2);
        });

        it('should not list private polls', async () => {
            await testPoll({ creatorId, public: false }).save();

            const res = await request(app).get(`/api/v1/polls`);

            expect(res.status).toBe(200);
            expect(res.body.data.polls).toHaveLength(0);
        });

        it('should list private and public polls if user is admin', async () => {
            const userAdmin = await testUser({ email: 'admin@example.com', role: UserRole.Admin, verified: true }).save();
            const loginRes = await request(app).post('/api/v1/auth/login').send({
                email: userAdmin.email,
                password: testUser({}).password
            });

            await testPoll({ creatorId, public: true }).save();
            await testPoll({ creatorId, public: false }).save();
            await testPoll({ creatorId, public: false }).save();

            const res = await request(app)
                .get(`/api/v1/polls`)
                .set('Authorization', `Bearer ${loginRes.body.data.token}`);

            expect(res.status).toBe(200);
            expect(res.body.data.polls).toHaveLength(3);
        });
    });

    describe('.getPoll', () => {
        it('should show public poll', async () => {
            const poll = testPoll({ creatorId, public: true });
            await poll.save();
            const res = await request(app).get(`/api/v1/polls/${poll.id}`);

            expect(res.status).toBe(200);
            expect(res.body.message).toBe('Poll fetched successfully');
            expect(res.body.data.poll.title).toBe(poll.title);
        });

        it('should show private poll if user is creator', async () => {
            const poll = await testPoll({ creatorId, public: false}).save();
            const res = await request(app)
                .get(`/api/v1/polls/${poll.id}`)
                .set('Authorization', `Bearer ${authToken}`);

            expect(res.status).toBe(200);
            expect(res.body.message).toBe('Poll fetched successfully');
            expect(res.body.data.poll.title).toBe(poll.title);
        });

        it('should show private poll if user is admin', async () => {
            const userAdmin = await testUser({ email: 'admin@example.com', role: UserRole.Admin, verified: true }).save();
            const loginRes = await request(app).post('/api/v1/auth/login').send({
                email: userAdmin.email,
                password: testUser({}).password
            });

            const userSubscriber = await testUser({ email: 'subscriber@example.com', role: UserRole.Subscriber }).save();

            const poll = await testPoll({ creatorId: userSubscriber.id, public: false }).save();
            const res = await request(app)
                .get(`/api/v1/polls/${poll.id}`)
                .set('Authorization', `Bearer ${loginRes.body.data.token}`);

            expect(res.status).toBe(200);
            expect(res.body.message).toBe('Poll fetched successfully');
            expect(res.body.data.poll.title).toBe(poll.title);
        });

        it('should not show private poll if user is not creator or admin', async () => {
            const userSubscriber = await testUser({ email: 'subscriber@example.com', role: UserRole.Subscriber, verified: true }).save();

            const loginRes = await request(app).post('/api/v1/auth/login').send({
                email: userSubscriber.email,
                password: testUser({}).password
            });

            const poll = await testPoll({ creatorId, public: false }).save();
            const res = await request(app)
                .get(`/api/v1/polls/${poll.id}`)
                .set('Authorization', `Bearer ${loginRes.body.data.token}`);

            expect(res.status).toBe(403);
            expect(res.body.message).toBe('Poll is not public');
        });

        it('should not get a poll with an invalid id', async () => {
            const res = await request(app).get(`/api/v1/polls/67a19b4c133a020b8171b213`);

            expect(res.status).toBe(404);
            expect(res.body.success).toBe(false);
            expect(res.body.message).toBe('Poll not found');
        });
    });

    describe('.getPollOptions', () => {
        it('should get poll options', async () => {
            const poll = testPoll({ creatorId });
            await poll.save();
            const res = await request(app).get(`/api/v1/polls/${poll.id}/options`);

            expect(res.status).toBe(200);
            expect(res.body.message).toBe('Poll options fetched successfully');
            expect(res.body.data.voteTallies).toHaveLength(2);
        });
    });

    describe('.createPoll', () => {
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
            expect(res.body.message).toContain("Title must be a string, Description must be a string, At least 2 poll options are required, Creator ID must be a string");
        });
    });

    describe('.updatePoll', () => {
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

    describe('.deletePoll', () => {
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