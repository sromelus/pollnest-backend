import express from "express";
import request from 'supertest';
import { dbConnect, dbDisconnect, dropDatabase } from '../helpers/dbTestConfig';
import routes from "../../src/routes";
import { testPoll, testUser } from "../factories";
import { UserRole, IPoll, PollOptionType } from "../../src/models";
import { Vote } from "../../src/models";
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
        const user = testUser({ role: UserRole.Admin });
        await user.save();
        const pollObj = testPoll({ creatorId: user.id, pollOptions: [{image: 'trump_img', pollOptionText: 'trump', count: 0}, {image: 'kamala_img', pollOptionText: 'kamala', count: 0}] });
        await pollObj.save();
        poll = pollObj as IPoll;
        voterId = user.id;

        const loginRes = await request(app).post('/api/v1/auth/login').send({
            email: testUser({}).email,
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
                expect(res6.body.message).toBe('You have reached the maximum number of votes. Please create an account to vote more.');
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
})