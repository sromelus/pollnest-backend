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


describe('Chat Controller', () => {
    let userId: string;

    beforeEach(async () => {
        const user = testUser();
        user.role = 'admin';
        await user.save();
        userId = user.id;
    });

    describe('Poll Chat', () => {
        let pollId: string;
        let poll: any;

        beforeEach(async () => {
            poll = testPoll({ userId });
            await poll.save();
            pollId = poll.id;
        });

        it('should return all chat messages on a poll', async () => {
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

        it('should add a new message to a poll chat', async () => {
            const res = await request(app).post(`/api/v1/polls/${pollId}/chat/new`).send({
                content: 'This is a test message',
                userId: userId,
            });

            expect(res.status).toBe(200);
            expect(res.body.messages).toHaveLength(poll.messages.length + 1);
        });
    });
});