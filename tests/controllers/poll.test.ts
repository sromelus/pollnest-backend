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
    let userId: string;

    beforeEach(async () => {
        const user = testUser();
        user.role = 'admin';
        await user.save();
        userId = user.id;
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
            const res = await request(app).post('/api/v1/polls').send({
                title: 'Test Poll',
                description: 'This is a test poll',
                pollOptions: [{img: 'trump_img', pollOptionText: 'trump', count: 0}, {img: 'kamala_img', pollOptionText: 'kamala', count: 0}],
                userId: userId,
            });

            expect(res.status).toBe(200);
        });

        it('should not create a poll when missing required fields', async () => {
            const res = await request(app).post('/api/v1/polls').send({
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
            expect(res.body.error.errors.title.message).toBe('Path `title` is required.');
            expect(res.body.error.errors.description.message).toBe('Path `description` is required.');
            expect(res.body.error.errors.userId.message).toBe('Path `userId` is required.');
            expect(res.body.error.errors.pollOptions.message).toBe('You should provide at least 2 poll options');
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
            const res = await request(app).put(`/api/v1/polls/${pollId}`).send({
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
            const res = await request(app).delete(`/api/v1/polls/${pollId}`);

            expect(res.status).toBe(200);
            expect(res.body.message).toBe('Poll deleted successfully');
        });
    });

    describe('Poll Chat', () => {
        let pollId: string;
        let poll: any;

        beforeEach(async () => {
            poll = testPoll({ userId });
            await poll.save();
            pollId = poll.id;
        });

        it('should return messages for a poll', async () => {
            const res = await request(app).get(`/api/v1/polls/${pollId}/chat`);

            expect(res.status).toBe(200);
            expect(res.body.messages).toHaveLength(poll.messages.length);
        });
    });

    describe('Poll Chat new message', () => {
        let pollId: string;
        let poll: any;

        beforeEach(async () => {
            poll = testPoll({ userId });
            await poll.save();
            pollId = poll.id;
        });

        it('should add a new message to a poll', async () => {
            const res = await request(app).post(`/api/v1/polls/${pollId}/chat/new`).send({
                content: 'This is a test message',
                userId: userId,
            });

            expect(res.status).toBe(200);
            expect(res.body.messages).toHaveLength(poll.messages.length + 1);
        });
    });
});