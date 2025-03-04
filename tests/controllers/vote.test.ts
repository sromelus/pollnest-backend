import express from "express";
import request from 'supertest';
import { dbConnect, dbDisconnect, dropDatabase } from '../helpers/dbTestConfig';
import routes from "../../src/routes";
import { testPoll, testUser } from "../factories";
import { UserRole, IPoll, PollOptionType, Poll } from "../../src/models";
import { Vote, User, IUser } from "../../src/models";
import { generateAuthAccessToken, verifyToken, JwtTokenType, generateRefreshToken } from "../../src/utils";
import { Types } from 'mongoose';
import cookieParser from "cookie-parser";
import { getCookieValue } from "../helpers/getCookieValue";

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

app.use(cookieParser());
app.use(express.json());
app.use("/api/v1", routes);

describe('Vote Controller', () => {
    let accessToken: string;
    let poll: IPoll;
    let voterId: Types.ObjectId;

    beforeEach(async () => {
        const user = testUser({ email: 'admin@example.com', role: UserRole.Admin, verified: true });
        await user.save();
        const pollObj = testPoll({ creatorId: user.id, pollOptions: [{image: 'trump_img', pollOptionText: 'trump', count: 0}, {image: 'kamala_img', pollOptionText: 'kamala', count: 0}], public: true });
        await pollObj.save();
        poll = pollObj as IPoll;
        voterId = user.id;

        const loginRes = await request(app).post('/api/v1/auth/login').send({
            email: 'admin@example.com',
            password: testUser({}).password
        });

        accessToken = loginRes.headers['auth-access-token'];
    });

    describe('.createVote', () => {
        describe('With an existing user', () => {
            it('should be able to create a vote', async () => {
                // Get the poll option directly from the saved poll document
                const kamalaOption = poll.pollOptions.find((option: PollOptionType) => option.pollOptionText === 'kamala') as PollOptionType;

                const res = await request(app)
                    .post(`/api/v1/polls/${poll.id}/votes`)
                    .set('Authorization', `Bearer ${accessToken}`)
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
                    .set('Authorization', `Bearer ${accessToken}`)
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
                const res = await request(app).post(`/api/v1/polls/${poll.id}/votes`).set('Authorization', `Bearer ${accessToken}`).send({
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
        });

        describe('Vote for a poll with allowMultipleVotes set to false', () => {
            it('registered users should be able to create only one vote', async () => {
                const poll = await testPoll({ creatorId: voterId, allowMultipleVotes: false}).save();
                const kamalaOption = poll.pollOptions.find((option: PollOptionType) => option.pollOptionText === 'kamala') as PollOptionType;

                const requestPromises = () => request(app)
                    .post(`/api/v1/polls/${poll.id}/votes`)
                    .set('Authorization', `Bearer ${accessToken}`)
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
                    .set('Authorization', `Bearer ${accessToken}`)
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
        });

        describe('Assign points for voting', () => {
            it('should award 1 point to authenticated user for voting', async () => {
                const kamalaOption = poll.pollOptions.find((option: PollOptionType) => option.pollOptionText === 'kamala') as PollOptionType;

                const res = await request(app)
                    .post(`/api/v1/polls/${poll.id}/votes`)
                    .set('Authorization', `Bearer ${accessToken}`)
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
                        // voterId: null non-authenticated user voterId
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
                    .set('Authorization', `Bearer ${accessToken}`)
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
        });

        describe('Track vote count', () => {
            it('should increment vote count for authenticated user when voting', async () => {
                const kamalaOption = poll.pollOptions.find((option: PollOptionType) => option.pollOptionText === 'kamala') as PollOptionType;

                const res = await request(app)
                    .post(`/api/v1/polls/${poll.id}/votes`)
                    .set('Authorization', `Bearer ${accessToken}`)
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
                    .set('Authorization', `Bearer ${accessToken}`)
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
            it("should award 10 points to the referrer when the referred user vote the first time", async () => {
                // Generate referrer user
                const referrer = await testUser({ email: 'referrer@example.com', role: UserRole.User, verified: true }).save();
                const referrerAuthAccessToken = await generateAuthAccessToken(referrer.id);
                const refreshToken = generateRefreshToken(referrer.id);

                // Referrer creates a share link token for the poll and share the link
                const shareRes = await request(app)
                    .post(`/api/v1/polls/${poll.id}/public_poll_share_link`)
                    .set('Authorization', `Bearer ${referrerAuthAccessToken}`)
                    .set('Cookie', `refreshToken=${refreshToken}`);

                const { accessToken } = shareRes.body.data;

                console.log('accessToken', accessToken);

                // Referred user navigate to poll shared from the referrer link
                const shareLinkRes = await request(app)
                    .get(`/api/v1/polls/public_poll_access/${accessToken}`);

                // Get referral token from the cookie
                const cookies: unknown = shareLinkRes.headers['set-cookie'];
                const referrerToken = getCookieValue(cookies as string[], 'referrerToken');

                const { decoded, error } = verifyToken(referrerToken as string) as JwtTokenType;

                // Referred user signup with the referrerId
                const referredUser = await testUser({
                    email: 'referreduser@example.com',
                    role: UserRole.User,
                    referrerId: decoded?.referrerId,
                    verified: true
                }).save();

                // Referred user votes on the poll and the referrer gets 10 points
                const voteResPromise = () => request(app)
                    .post(`/api/v1/polls/${poll.id}/votes`)
                    .set('Authorization', `Bearer ${accessToken}`)
                    .set('Cookie', `refreshToken=${refreshToken}`)
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
        });

        describe('User with referral link vote on a private poll', () => {
            let subscriber: IUser;
            let subscriberAccessToken: string;
            let poll: IPoll;
            let inviteAccessData: { email: string; inviteAccessToken: string; inviteAccessLink: string; expiresIn: number };
            let pollAccessWithTokenId: string;

            beforeEach(async () => {
                //Set up poll access with invite link
                subscriber = await testUser({
                    email: 'subscriber@example.com',
                    role: UserRole.Subscriber,
                    verified: true
                }).save();
                subscriberAccessToken = await generateAuthAccessToken(subscriber.id);
                const refreshToken = generateRefreshToken(subscriber.id);
                poll = await testPoll({ creatorId: subscriber.id, allowMultipleVotes: false, public: false }).save();

                const inviteRes = await request(app)
                    .post(`/api/v1/polls/${poll.id}/invites`)
                    .set('Authorization', `Bearer ${subscriberAccessToken}`)
                    .set('Cookie', `refreshToken=${refreshToken}`)
                    .send({ emails: ['test@example.com'], expiresIn: 1000 * 60 });

                inviteAccessData = inviteRes.body.data.invites[0];
                const pollAccessWithTokenRes = await request(app).get(`/api/v1/polls/private_poll_access/${inviteAccessData.inviteAccessToken}`);
                pollAccessWithTokenId = pollAccessWithTokenRes.body.data.poll._id;
             });

            it('should be able to vote on a private poll successfully', async () => {
                const pollAccessWithTokenData = await Poll.findById(pollAccessWithTokenId) as IPoll;
                const userWithAccessToken = await User.findOne({ email: inviteAccessData.email }) as IUser;

                const res = await request(app)
                    .post(`/api/v1/polls/${pollAccessWithTokenData._id}/votes`)
                    .set('Authorization', `Bearer ${null}`)
                    .set('Cookie', `refreshToken=${null}`)
                    .send({
                        pollId: pollAccessWithTokenData._id,
                        voterEthnicity: 'black',
                        voterId: userWithAccessToken.id,
                        voterGender: 'male',
                        voteOptionText: pollAccessWithTokenData.pollOptions[1].pollOptionText,
                        pollOptionId: pollAccessWithTokenData.pollOptions[1]._id,
                    });

                expect(res.status).toBe(201);
                expect(res.body.data).toHaveProperty('voteCount', 1);
                expect(userWithAccessToken).toBeDefined();
            })
        });
    });
})