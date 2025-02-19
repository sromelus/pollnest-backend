import express from "express";
import request from 'supertest';
import { dbConnect, dbDisconnect, dropDatabase } from '../helpers/dbTestConfig';
import routes from "../../src/routes";
import { testPoll, testUser } from "../factories";
import { UserRole, IPoll, PollOptionType } from "../../src/models";
import { Vote, User, IUser } from "../../src/models";
import { generateAuthToken, verifyToken } from "../../src/utils";
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
app.use("/api/v1", routes);

describe('Vote Controller', () => {
    let authToken: string;
    let poll: IPoll;
    let voterId: Types.ObjectId;

    beforeEach(async () => {
        const user = testUser({ email: 'admin@example.com', role: UserRole.Admin });
        await user.save();
        const pollObj = testPoll({ creatorId: user.id, pollOptions: [{image: 'trump_img', pollOptionText: 'trump', count: 0}, {image: 'kamala_img', pollOptionText: 'kamala', count: 0}], public: true });
        await pollObj.save();
        poll = pollObj as IPoll;
        voterId = user.id;

        const loginRes = await request(app).post('/api/v1/auth/login').send({
            email: 'admin@example.com',
            password: testUser({}).password
        });

        authToken = loginRes.body.data.token;
    });

    describe('Create Vote', () => {
        describe('With an existing user', () => {
            it('should be able to create a vote', async () => {
                // Get the poll option directly from the saved poll document
                const kamalaOption = poll.pollOptions.find((option: PollOptionType) => option.pollOptionText === 'kamala') as PollOptionType;

                const res = await request(app)
                    .post(`/api/v1/polls/${poll.id}/votes`)
                    .set('Authorization', `Bearer ${authToken}`)
                    .send({
                        pollId: poll.id,
                        voterId,
                        voterEthnicity: 'black',
                        voterGender: 'male',
                        voteOptionText: 'kamala',
                        pollOptionId: kamalaOption._id,
                        voterIp: '127.0.0.1',
                        voterCountry: 'US',
                        voterRegion: 'MA',
                        voterCity: 'Natick'
                    });

                expect(res.status).toBe(201);
                expect(res.body.message).toBe('Vote created successfully');
                expect(res.body.data).toHaveProperty('optionVoteTally');
                expect(res.body.data.optionVoteTally.count).toBe(1);
            });

            it('should be able to create multiple votes', async () => {
                // Get the poll option directly from the saved poll document
                const kamalaOption = poll.pollOptions.find((option: PollOptionType) => option.pollOptionText === 'kamala') as PollOptionType;

                const requestPromises = async() => await request(app)
                    .post(`/api/v1/polls/${poll.id}/votes`)
                    .set('Authorization', `Bearer ${authToken}`)
                    .send({
                        pollId: poll.id,
                        voterId,
                        voterEthnicity: 'black',
                        voterGender: 'male',
                        voteOptionText: 'kamala',
                        pollOptionId: kamalaOption._id,
                        voterIp: '127.0.0.1',
                        voterCountry: 'US',
                        voterRegion: 'MA',
                        voterCity: 'Natick'
                    })

                const res1 = await requestPromises();
                const res2 = await requestPromises();
                const res3 = await requestPromises();
                const res4 = await requestPromises();
                const res5 = await requestPromises();
                const res6 = await requestPromises();
                const res7 = await requestPromises();
                const res8 = await requestPromises();
                const res9 = await requestPromises();
                const res10 = await requestPromises();

                const voteCount = await Vote.countDocuments({ voterIp: '127.0.0.1'});

                expect(res10.status).toBe(201);
                expect(res9.body.message).toBe('Vote created successfully');
                expect(voteCount).toBe(10);
            });

            it('should not create a vote if the pollOptionId is not found', async () => {
                const res = await request(app).post(`/api/v1/polls/${poll.id}/votes`).set('Authorization', `Bearer ${authToken}`).send({
                    pollId: poll.id,
                    voterId,
                    voterEthnicity: 'black',
                    voterGender: 'male',
                    voteOptionText: 'kamala',
                    pollOptionId: '67a2fc834e011d27320e4e79',
                    voterIp: '127.0.0.1',
                    voterCountry: 'US',
                    voterRegion: 'MA',
                    voterCity: 'Natick',
                })

                expect(res.status).toBe(400);
                expect(res.body.message).toContain('Vote validation failed: pollOptionId: Vote option must be one of the valid options from the poll.');
            })
        });

        describe('With a non auth user', () => {
            it('should be able to create a vote with the correct data', async () => {
                  // Get the poll option directly from the saved poll document
                const kamalaOption = poll.pollOptions.find((option: PollOptionType) => option.pollOptionText === 'kamala') as PollOptionType;

                const res = await request(app)
                    .post(`/api/v1/polls/${poll.id}/votes`)
                    .set('Authorization', `Bearer ${null}`)
                    .send({
                        pollId: poll.id,
                    //   voterId = null
                        voterEthnicity: 'black',
                        voterGender: 'male',
                        voteOptionText: 'kamala',
                        pollOptionId: kamalaOption._id,
                        voterIp: '127.0.0.1',
                        voterCountry: 'US',
                        voterRegion: 'MA',
                        voterCity: 'Natick'
                    });


                expect(res.status).toBe(201);
                expect(res.body.message).toBe('Vote created successfully');
                expect(res.body.data).toHaveProperty('optionVoteTally');
                expect(res.body.data.optionVoteTally.count).toBe(1);
            })

            it('should be able to create 5 votes', async () => {
                  // Get the poll option directly from the saved poll document
                const kamalaOption = poll.pollOptions.find((option: PollOptionType) => option.pollOptionText === 'kamala') as PollOptionType;

                const requestPromises = Array.from({ length: 5 }, () => request(app)
                    .post(`/api/v1/polls/${poll.id}/votes`)
                    .set('Authorization', `Bearer ${null}`)
                    .send({
                        pollId: poll.id,
                    //   voterId = null
                        voterEthnicity: 'black',
                        voterGender: 'male',
                        voteOptionText: 'kamala',
                        pollOptionId: kamalaOption._id,
                        voterIp: '127.0.0.1',
                        voterCountry: 'US',
                        voterRegion: 'MA',
                        voterCity: 'Natick'
                    })
                );

                const res = await Promise.all(requestPromises);

                const voteCount = await Vote.countDocuments({ voterIp: '127.0.0.1'});

                expect(res[0].status).toBe(201);
                expect(res[1].body.message).toBe('Vote created successfully');
                expect(voteCount).toBe(5);
            })

            it('should not be able to create more than 5 votes', async () => {
                  // Get the poll option directly from the saved poll document
                const kamalaOption = poll.pollOptions.find((option: PollOptionType) => option.pollOptionText === 'kamala') as PollOptionType;

                const requestPromises = () => request(app)
                    .post(`/api/v1/polls/${poll.id}/votes`)
                    .set('Authorization', `Bearer ${null}`)
                    .send({
                        pollId: poll.id,
                    //   voterId = null
                        voterEthnicity: 'black',
                        voterGender: 'male',
                        voteOptionText: 'kamala',
                        pollOptionId: kamalaOption._id,
                        voterIp: '127.0.0.1',
                        voterCountry: 'US',
                        voterRegion: 'MA',
                        voterCity: 'Natick'
                    })

                const res1 = await requestPromises();
                const res2 = await requestPromises();
                const res3 = await requestPromises();
                const res4 = await requestPromises();
                const res5 = await requestPromises();
                const res6 = await requestPromises();


                const voteCount = await Vote.countDocuments({ voterIp: '127.0.0.1' });

                expect(res6.status).toBe(403);
                expect(res6.body.message).toBe('You have reached the maximum number of free votes. Please create an account to vote more.');
                expect(voteCount).not.toBeGreaterThan(5);
            })
        })

        describe('Only allow one vote for Polls with allowMultipleVotes set to false', () => {
            it('registered users should be able to create only one vote', async () => {
                const poll = await testPoll({ creatorId: voterId, allowMultipleVotes: false}).save();
                const kamalaOption = poll.pollOptions.find((option: PollOptionType) => option.pollOptionText === 'kamala') as PollOptionType;

                const requestPromises = () => request(app)
                    .post(`/api/v1/polls/${poll.id}/votes`)
                    .set('Authorization', `Bearer ${authToken}`)
                    .send({
                        pollId: poll.id,
                        voterId,
                        voterEthnicity: 'black',
                        voterGender: 'male',
                        voteOptionText: 'kamala',
                        pollOptionId: kamalaOption._id,
                        voterIp: '127.0.0.1',
                        voterCountry: 'US',
                        voterRegion: 'MA',
                        voterCity: 'Natick'
                    })

                const res1 = await requestPromises();
                const res2 = await requestPromises();

                expect(res1.status).toBe(201);
                expect(res1.body.message).toBe('Vote created successfully');
                expect(res2.status).toBe(400);
                expect(res2.body.message).toContain('You have already voted for this poll.');
            })

            it('non registered users should not be able to create a vote', async () => {
                const poll = await testPoll({ creatorId: voterId, allowMultipleVotes: false}).save();
                const kamalaOption = poll.pollOptions.find((option: PollOptionType) => option.pollOptionText === 'kamala') as PollOptionType;

                const requestPromises = () => request(app)
                    .post(`/api/v1/polls/${poll.id}/votes`)
                    .set('Authorization', `Bearer ${authToken}`)
                    .send({
                        pollId: poll.id,
                        // voterId: undefined, non-registered user voterId
                        voterEthnicity: 'black',
                        voterGender: 'male',
                        voteOptionText: 'kamala',
                        pollOptionId: kamalaOption._id,
                        voterIp: '127.0.0.1',
                        voterCountry: 'US',
                        voterRegion: 'MA',
                        voterCity: 'Natick'
                    })

                const res1 = await requestPromises();
                const res2 = await requestPromises();

                expect(res1.status).toBe(400);
                expect(res2.body.message).toContain('Only registered users can vote. Please login or signup to vote.');
            })
        })
    })

    describe('Points for Voting', () => {
        it('should award 1 point to authenticated user for voting', async () => {
            const kamalaOption = poll.pollOptions.find((option: PollOptionType) => option.pollOptionText === 'kamala') as PollOptionType;

            const res = await request(app)
                .post(`/api/v1/polls/${poll.id}/votes`)
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    pollId: poll.id,
                    voterId,
                    voterEthnicity: 'black',
                    voterGender: 'male',
                    voteOptionText: 'kamala',
                    pollOptionId: kamalaOption._id,
                    voterIp: '127.0.0.1',
                    voterCountry: 'US',
                    voterRegion: 'MA',
                    voterCity: 'Natick'
                });

            expect(res.status).toBe(201);
            expect(res.body.data).toHaveProperty('pointsEarned', 1);
            expect(res.body.data).toHaveProperty('totalPoints');
        });

        it('should not award points to non-authenticated users', async () => {
            const kamalaOption = poll.pollOptions.find((option: PollOptionType) => option.pollOptionText === 'kamala') as PollOptionType;

            const res = await request(app)
                .post(`/api/v1/polls/${poll.id}/votes`)
                .set('Authorization', `Bearer ${null}`)
                .send({
                    pollId: poll.id,
                    voterEthnicity: 'black',
                    voterGender: 'male',
                    voteOptionText: 'kamala',
                    pollOptionId: kamalaOption._id,
                    voterIp: '127.0.0.1',
                    voterCountry: 'US',
                    voterRegion: 'MA',
                    voterCity: 'Natick'
                });

            expect(res.status).toBe(201);
            expect(res.body.data).not.toHaveProperty('pointsEarned');
            expect(res.body.data).not.toHaveProperty('totalPoints');
        });

        it('should accumulate points for multiple votes', async () => {
            const kamalaOption = poll.pollOptions.find((option: PollOptionType) => option.pollOptionText === 'kamala') as PollOptionType;

            const voteRequest = () => request(app)
                .post(`/api/v1/polls/${poll.id}/votes`)
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    pollId: poll.id,
                    voterId,
                    voterEthnicity: 'black',
                    voterGender: 'male',
                    voteOptionText: 'kamala',
                    pollOptionId: kamalaOption._id,
                    voterIp: '127.0.0.1',
                    voterCountry: 'US',
                    voterRegion: 'MA',
                    voterCity: 'Natick'
                });

            const res1 = await voteRequest();
            const res2 = await voteRequest();
            const res3 = await voteRequest();

            expect(res3.status).toBe(201);
            expect(res3.body.data).toHaveProperty('pointsEarned', 1);
            expect(res3.body.data).toHaveProperty('totalPoints', 3);
        });
    })

    describe('Vote Count Tracking', () => {
        it('should increment vote count for authenticated user when voting', async () => {
            const kamalaOption = poll.pollOptions.find((option: PollOptionType) => option.pollOptionText === 'kamala') as PollOptionType;

            const res = await request(app)
                .post(`/api/v1/polls/${poll.id}/votes`)
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    pollId: poll.id,
                    voterId,
                    voterEthnicity: 'black',
                    voterGender: 'male',
                    voteOptionText: 'kamala',
                    pollOptionId: kamalaOption._id,
                    voterIp: '127.0.0.1',
                    voterCountry: 'US',
                    voterRegion: 'MA',
                    voterCity: 'Natick'
                });

            expect(res.status).toBe(201);
            expect(res.body.data).toHaveProperty('voteCount', 1);
        });

        it('should accumulate vote count for multiple votes', async () => {
            const kamalaOption = poll.pollOptions.find((option: PollOptionType) => option.pollOptionText === 'kamala') as PollOptionType;

            const voteRequest = () => request(app)
                .post(`/api/v1/polls/${poll.id}/votes`)
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    pollId: poll.id,
                    voterId,
                    voterEthnicity: 'black',
                    voterGender: 'male',
                    voteOptionText: 'kamala',
                    pollOptionId: kamalaOption._id,
                    voterIp: '127.0.0.1',
                    voterCountry: 'US',
                    voterRegion: 'MA',
                    voterCity: 'Natick'
                });

            await voteRequest();
            await voteRequest();
            const res = await voteRequest();

            expect(res.status).toBe(201);
            expect(res.body.data).toHaveProperty('voteCount', 3);
        });

        it('should not track vote count for non-authenticated users', async () => {
            const kamalaOption = poll.pollOptions.find((option: PollOptionType) => option.pollOptionText === 'kamala') as PollOptionType;

            const res = await request(app)
                .post(`/api/v1/polls/${poll.id}/votes`)
                .send({
                    pollId: poll.id,
                    voterEthnicity: 'black',
                    voterGender: 'male',
                    voteOptionText: 'kamala',
                    pollOptionId: kamalaOption._id,
                    voterIp: '127.0.0.1',
                    voterCountry: 'US',
                    voterRegion: 'MA',
                    voterCity: 'Natick'
                });

            expect(res.status).toBe(201);
            expect(res.body.data).not.toHaveProperty('voteCount');
        });
    });

    describe('New user Vote on a public poll from a referral link', () => {
        it('should award 10 points to referrer on referred user\'s first vote only', async () => {
            // Generate referrer user
            const referrer = await testUser({ email: 'referrer@example.com', role: UserRole.User }).save();
            const referrerToken = await generateAuthToken(referrer.id);

            // Generate referrer create a share link token for the poll and share the link
            const shareRes = await request(app)
                .post(`/api/v1/poll_access/${poll.id}/share`)
                .set('Authorization', `Bearer ${referrerToken}`)

            const { shareToken } = shareRes.body.data;

            // Referred user navigate to poll shared by referrer link
            const shareLinkRes = await request(app)
                .get(`/api/v1/poll_access/${shareToken}/share`);

            // Get referral token from the cookie
            const cookie = shareLinkRes.headers['set-cookie'][0];
            const { referralToken } = cookie.match(/=(?<referralToken>.+?(?=;))/)?.groups || {};

            const token = verifyToken(referralToken) as { referrerId: string };

            // Referred user signup with the referrerId
            const referredUser = await testUser({ email: 'referreduser@example.com', role: UserRole.User, referrerId: new Types.ObjectId(token.referrerId) }).save();

            // Referred user votes on the poll and the referrer gets 10 points
            const voteResPromise = () => request(app)
                .post(`/api/v1/polls/${poll.id}/votes`)
                .set('Authorization', `Bearer ${shareToken}`)
                .send({
                    pollId: poll.id,
                    voterId: referredUser.id,
                    voterEthnicity: 'black',
                    voterGender: 'male',
                    voteOptionText: poll.pollOptions[1].pollOptionText,
                    pollOptionId: poll.pollOptions[1]._id,
                });

            await voteResPromise();
            const voteRes = await voteResPromise();

            const updatedReferrer = await User.findById(referrer.id) as IUser;

            expect(voteRes.status).toBe(201);
            expect(referredUser.referrerId.toString()).toBe(referrer.id);
            expect(updatedReferrer.referralPoints).toBe(referrer.referralPoints + 10);
            expect(updatedReferrer.referralPoints).not.toBe(20);
        });
    })

    describe('Any user Vote on a private poll from a referral link', () => {
        it('should be able to vote on poll successfully', async () => {
            // Allow authenticated user to generate invite links for a list of emails to access a private poll
            const emails = ['invite1@example.com', 'invite2@example.com'];

            const res = await request(app)
                .post(`/api/v1/poll_access/${poll.id}/invites`)
                .set('Authorization', `Bearer ${authToken}`)
                .send({ emails, expiresIn: 1000 * 60 });

            expect(res.status).toBe(200);
            expect(res.body.message).toBe('Poll invites generated successfully');
            expect(res.body.data.invites).toHaveLength(2);
            expect(res.body.data.invites[0]).toHaveProperty('email', emails[0]);
            expect(res.body.data.invites[0]).toHaveProperty('accessToken');
            expect(res.body.data.invites[0]).toHaveProperty('accessLink');


            // Allow user who has access link to vote on private poll
            // Do not allow user to vote if access link is expired


            //TBD..................
            const referrer = await testUser({ email: 'referrer@example.com', role: UserRole.User }).save();
            const referrerToken = await generateAuthToken(referrer.id);

            // Generate referrer create a share link token for the poll and share the link
            const shareRes = await request(app)
                .post(`/api/v1/poll_access/${poll.id}/share`)
                .set('Authorization', `Bearer ${referrerToken}`)

            const { shareToken } = shareRes.body.data;

            // Referred user navigate to poll shared by referrer link
            const shareLinkRes = await request(app)
                .get(`/api/v1/poll_access/${shareToken}/share`);

            // Get referral token from the cookie
            const cookie = shareLinkRes.headers['set-cookie'][0];
            const { referralToken } = cookie.match(/=(?<referralToken>.+?(?=;))/)?.groups || {};

            const token = verifyToken(referralToken) as { referrerId: string };

            // Referred user signup and create a new user with the referrerId
            const referredUser = await testUser({ email: 'referreduser@example.com', role: UserRole.User, referrerId: new Types.ObjectId(token.referrerId) }).save();

            // Referred user votes on the poll and the referrer gets 10 points
            const voteResPromise = () => request(app)
                .post(`/api/v1/polls/${poll.id}/votes`)
                .set('Authorization', `Bearer ${shareToken}`)
                .send({
                    pollId: poll.id,
                    voterId: referredUser.id,
                    voterEthnicity: 'black',
                    voterGender: 'male',
                    voteOptionText: poll.pollOptions[1].pollOptionText,
                    pollOptionId: poll.pollOptions[1]._id,
                });

            const voteRes = await voteResPromise();

            expect(voteRes.status).toBe(201);
            expect(voteRes.body.data).toHaveProperty('voteCount', 1);
        })
    })
})