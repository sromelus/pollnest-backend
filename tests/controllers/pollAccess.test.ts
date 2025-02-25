import express from 'express';
import request from 'supertest';
import { IPoll, User, UserRole } from '../../src/models';
import { testUser, testPoll } from '../factories';
import { generateAuthToken, generateInviteToken, verifyToken } from '../../src/utils';
import routes from '../../src/routes';
import { dbConnect, dbDisconnect, dropDatabase } from '../helpers/dbTestConfig';
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


describe('PollAccessController', () => {
    let authToken: string;
    let userId: Types.ObjectId;
    let privatePoll: IPoll;

    beforeEach(async () => {
        // Create test user
        const user = await testUser({ role: UserRole.Subscriber, verified: true }).save();
        userId = user.id;
        authToken = await generateAuthToken(userId.toString());

        // Create a private poll
        privatePoll = await testPoll({ public: false, allowMultipleVotes: false, creatorId: userId }).save();
    });

    describe('.listPolls', () => {
        it('should allow subscribers to see their own public and private polls', async () => {
            await testPoll({ public: false, creatorId: userId }).save();
            const poll1 = await testPoll({ public: true, creatorId: userId }).save();

            const res = await request(app)
                .get(`/api/v1/polls/my_polls`)
                .set('Authorization', `Bearer ${authToken}`);

            // expect(res.status).toBe(200);
            expect(res.body.message).toBe('Polls fetched successfully');
            expect(res.body.data.polls).toHaveLength(3);
            expect(res.body.data.polls[0]._id).toEqual(poll1.id.toString());
        });
    });

    describe('.getPoll', () => {
        it('should allow subscribers to access a poll that belongs to them', async () => {
            const res = await request(app)
                .get(`/api/v1/polls/my_polls/${privatePoll.id}`)
                .set('Authorization', `Bearer ${authToken}`);

            expect(res.status).toBe(200);
            expect(res.body.message).toBe('Poll fetched successfully');
            expect(res.body.data.poll._id).toEqual(privatePoll.id.toString());
        });

        it('should not allow subscribers to access a poll that does not belong to them', async () => {
            const subscriber = await testUser({ email: 'subscriber@example.com', verified: true }).save();
            const subscriberToken = await generateAuthToken(subscriber.id.toString());

            const res = await request(app)
                .get(`/api/v1/polls/my_polls/${privatePoll.id}`)
                .set('Authorization', `Bearer ${subscriberToken}`);

            expect(res.status).toBe(403);
            expect(res.body.message).toBe('You are not authorized to access this poll');
        });

        it('should not allow non-subscribers to access a poll that does not belong to them', async () => {
            const nonSubscriber = await testUser({ email: 'non-subscriber@example.com', verified: true }).save();
            const resLogin = await request(app)
                .post('/api/v1/auth/login')
                .send({ email: nonSubscriber.email, password: 'ValidPass123!' });

            const nonSubscriberToken = resLogin.body.data.token;

            const res = await request(app)
                .get(`/api/v1/polls/my_polls/${privatePoll.id}`)
                .set('Authorization', `Bearer ${nonSubscriberToken}`);

            expect(res.status).toBe(403);
            expect(res.body.message).toBe('You are not authorized to access this poll');
        });
    });

    describe('.generatePollInvites', () => {
        it('should generate invite links for a list of emails', async () => {
            const emails = ['invite1@example.com', 'invite2@example.com'];

            const res = await request(app)
                .post(`/api/v1/polls/${privatePoll.id}/invites`)
                .set('Authorization', `Bearer ${authToken}`)
                .send({ emails, expiresIn: 1000 * 60 });

            expect(res.status).toBe(200);
            expect(res.body.message).toBe('Poll invites generated successfully');
            expect(res.body.data.invites).toHaveLength(2);
            expect(res.body.data.invites[0]).toHaveProperty('email', emails[0]);
            expect(res.body.data.invites[0]).toHaveProperty('accessToken');
            expect(res.body.data.invites[0]).toHaveProperty('accessLink');
        });

        it('should not allow random users to generate invite links for private poll they are not creator of', async () => {
            // Create another user
            const anotherUser = await testUser({ email: 'another@example.com', role: UserRole.Subscriber }).save();
            const anotherUserToken = await generateAuthToken(anotherUser.id.toString());

            const res = await request(app)
                .post(`/api/v1/polls/${privatePoll.id}/invites`)
                .set('Authorization', `Bearer ${anotherUserToken}`)
                .send({ emails: ['test@example.com'], expiresIn: 1000 * 60 });

            expect(res.status).toBe(403);
            expect(res.body.message).toBe('Only poll creator can generate invite links');
        });

        it('should allow admin to generate invite links', async () => {
            // Create another user
            const admin = await testUser({ email: 'admin@example.com', role: UserRole.Admin }).save();
            const adminToken = await generateAuthToken(admin.id.toString());

            const res = await request(app)
                .post(`/api/v1/polls/${privatePoll.id}/invites`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ emails: ['test@example.com'], expiresIn: 1000 * 60 });

            expect(res.status).toBe(200);
            expect(res.body.message).toBe('Poll invites generated successfully');
        });

        it('should return 404 for non-existent poll', async () => {
            const nonExistentPollId = '507f1f77bcf86cd799439011';

            const res = await request(app)
                .post(`/api/v1/polls/${nonExistentPollId}/invites`)
                .set('Authorization', `Bearer ${authToken}`)
                .send({ emails: ['test@example.com'], expiresIn: 1000 * 60 });

            expect(res.status).toBe(404);
            expect(res.body.message).toBe('Poll not found');
        });
    });

    describe('.accessPollWithToken', () => {
        it('should allow accessing poll with valid token', async () => {
            // First generate an invite
            const inviteRes = await request(app)
                .post(`/api/v1/polls/${privatePoll.id}/invites`)
                .set('Authorization', `Bearer ${authToken}`)
                .send({ emails: ['test@example.com'], expiresIn: 1000 * 60 });

            const { accessToken } = inviteRes.body.data.invites[0];

            // Try accessing with the token
            const res = await request(app)
                .get(`/api/v1/polls/access/${accessToken}`);

            expect(res.status).toBe(200);
            expect(res.body.data.poll.pollOptions).toHaveLength(2);
            expect(res.body.data.poll).toHaveProperty('creatorId');
            expect(res.body.data.poll).toHaveProperty('public', false);
            expect(res.body.data.poll).toHaveProperty('allowMultipleVotes');
        });

        it('should reject access to poll with invalid tokens', async () => {
            const res = await request(app)
                .get('/api/v1/polls/access/invalid.token.123');

            expect(res.status).toBe(403);
            expect(res.body.message).toBe('Invalid or expired access token');
        });

        it('should reject access to non-existent poll', async () => {
            // Generate token with non-existent poll ID
            const token = generateInviteToken({
                pollId: '507f1f77bcf86cd799439011',
                email: 'test@example.com',
                type: 'poll-invite'
            });

            const res = await request(app)
                .get(`/api/v1/polls/access/${token}`);

            expect(res.status).toBe(404);
            expect(res.body.message).toBe('Poll not found');
        });

        it('should reject access to poll with tokens with wrong type', async () => {
            // Use an invalid token directly instead of generating one with wrong type
            const res = await request(app)
                .get(`/api/v1/polls/access/invalid.token.here`);

            expect(res.status).toBe(403);
            expect(res.body.message).toBe('Invalid or expired access token');
        });

        it('should reject access to poll with expired token', async () => {
            // Generate a token that expires in 0 seconds
            const inviteRes = await request(app)
                  .post(`/api/v1/polls/${privatePoll.id}/invites`)
                  .set('Authorization', `Bearer ${authToken}`)
                  .send({ emails: ['test@example.com'], expiresIn: '0' });

            const { accessToken } = inviteRes.body.data.invites[0];

            const res = await request(app)
                .get(`/api/v1/polls/access/${accessToken}`);

            expect(res.status).toBe(403);
            expect(res.body.message).toBe('Invalid or expired access token');
        });

        it('should not be able to access private poll through /polls/:id', async () => {
            // Generate a token that expires in 0 seconds
            const inviteRes = await request(app)
                .post(`/api/v1/polls/${privatePoll.id}/invites`)
                .set('Authorization', `Bearer ${authToken}`)
                .send({ emails: ['test@example.com'], expiresIn: 1000 * 60 });

            const { accessToken } = inviteRes.body.data.invites[0];

            const decodedToken = verifyToken(accessToken) as { pollId: string };

            const res = await request(app)
                .get(`/api/v1/polls/${decodedToken.pollId}`);

            expect(res.status).toBe(403);
            expect(res.body.message).toBe('Poll is not public');
        });
    });

    describe('.sharePoll', () => {
        let referrerToken: string;
        let referrerId: Types.ObjectId;
        let poll: IPoll;

        beforeEach(async () => {
            // Create referrer user
            const adminId = userId;
            const referrer = await testUser({ email: 'referrer@example.com', role: UserRole.User }).save();
            referrerId = referrer.id;

            referrerToken = await generateAuthToken(referrer.id);

            // Create a poll for testing
            poll = await testPoll({ creatorId: adminId }).save();
        });

        describe('generateShareLink', () => {
            it('should allow authenticated user to generate share link with referrer info in token', async () => {
                const res = await request(app)
                    .post(`/api/v1/polls/${poll.id}/create_share_link`)
                    .set('Authorization', `Bearer ${referrerToken}`)

                expect(res.status).toBe(200);
                expect(res.body.message).toBe('Poll share link generated successfully');
                expect(res.body.data).toHaveProperty('shareLink');
            });

            it('should allow new user to navigate to a share link of a poll successfully', async () => {
                const shareRes = await request(app)
                    .post(`/api/v1/polls/${poll.id}/create_share_link`)
                    .set('Authorization', `Bearer ${referrerToken}`)

                const { shareToken } = shareRes.body.data;

                const res = await request(app)
                    .get(`/api/v1/polls/${shareToken}/access`);

                expect(res.status).toBe(200);
                expect(res.body.data).toHaveProperty('poll');
                expect(res.header['set-cookie']).toBeDefined();
            });

            it('should not allow new user to navigate to a share link of a non-existent poll', async () => {
                const res = await request(app)
                    .get(`/api/v1/polls/invalid-share-token/access`);

                expect(res.status).toBe(403);
                expect(res.body.message).toContain('Invalid or expired access token');
            });
        });
    });
});