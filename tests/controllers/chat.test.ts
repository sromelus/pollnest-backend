import express from 'express';
import request from 'supertest';
import { dbConnect, dbDisconnect, dropDatabase } from '../helpers/dbTestConfig';
import { testPoll, testUser } from "../factories";
import routes from '../../src/routes';
import { UserRole, IPoll } from '../../src/models';
import { Types } from 'mongoose';
import { generateAuthToken } from '../../src/utils';

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
    let userId: Types.ObjectId;
    let userId2: Types.ObjectId;
    let token: string;

    beforeEach(async () => {
        const user = await testUser({ email: 'admin@example.com', role: UserRole.Admin, verified: true }).save();
        const user2 = testUser({});
        userId = user.id;
        userId2 = user2.id;
        token = await generateAuthToken(user.id);
    });

    describe('Poll Chat', () => {
        let pollId: string;
        let poll: IPoll;

        beforeEach(async () => {
            poll = await testPoll({ creatorId: userId }).save();
            pollId = poll.id;
        });

        it('should return all chat messages on a poll', async () => {
            const res = await request(app).get(`/api/v1/polls/${pollId}/chat`);

            expect(res.status).toBe(200);
            expect(res.body.message).toBe('Poll chat fetched successfully');
            expect(res.body.data.messages).toHaveLength(poll.messages.length);
        });
    });

    describe('Poll Chat new message', () => {
        let pollId: string;
        let poll: IPoll;

        beforeEach(async () => {
            poll = await testPoll({ creatorId: userId }).save();
            pollId = poll.id;
        });

        it('should add a new message to a poll chat', async () => {
            const messagePromises = [
                request(app).post(`/api/v1/polls/${pollId}/chat/message`)
                .set('Authorization', `Bearer ${token}`)
                .send({
                    content: 'This is a test message',
                    userId: userId,
                }),
                request(app).post(`/api/v1/polls/${pollId}/chat/message`)
                .set('Authorization', `Bearer ${token}`)
                .send({
                    content: 'This is a test message 2',
                    userId: userId2,
                })
            ];

            const [messageRes, messageRes2] = await Promise.all(messagePromises);

            expect(messageRes.status).toBe(201);
            expect(messageRes2.status).toBe(201);
            expect(messageRes.body.data.message.content).toBe('This is a test message');
            expect(messageRes2.body.data.message.content).toBe('This is a test message 2');
        });
    });
});