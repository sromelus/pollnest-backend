import express from "express";
import request from 'supertest';
import { dbConnect, dbDisconnect, dropDatabase } from '../helpers/dbTestConfig';
import routes from "../../src/routes";
import { testPoll, testUser } from "../factories";
import { UserRole } from "../../src/models";

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
    let poll: any;
    let voterId: string;

    beforeEach(async () => {
        const user = testUser({ role: UserRole.Admin });
        await user.save();
        const pollObj = testPoll({ creatorId: user.id, pollOptions: [{image: 'trump_img', pollOptionText: 'trump', count: 0}, {image: 'kamala_img', pollOptionText: 'kamala', count: 0}] });
        await pollObj.save();
        poll = pollObj;
        voterId = user.id;

        const loginRes = await request(app).post('/api/v1/auth/login').send({
            email: testUser({}).email,
            password: testUser({}).password
        });

        authToken = loginRes.body.data.token;
    });

    it('should create a vote', async () => {
        //get the vote tally before the vote is created
        const kamalaVote = poll.pollOptions.find((option: any) => option.pollOptionText === 'kamala');

        //get the vote tally after the vote is created
        const res = await request(app).post(`/api/v1/polls/${poll.id}/votes`).set('Authorization', `Bearer ${authToken}`).send({
            pollId: poll.id,
            voterId,
            voterEthnicity: 'black',
            voterGender: 'male',
            voteOptionText: 'kamala',
            voteOptionId: kamalaVote._id,
            voterIp: '123',
            voterCountry: 'US',
            voterRegion: 'MA',
            voterCity: 'Natick'
        })

        const { optionVoteTally } = res.body.data;

        expect(res.status).toBe(201);
        expect(res.body.message).toBe('Vote created successfully');
        expect(res.body.data).toHaveProperty('optionVoteTally');
        expect(optionVoteTally.count).toBe(kamalaVote.count + 1);
    })


    it('should not create a vote if the voteOptionId is not found', async () => {
        const res = await request(app).post(`/api/v1/polls/${poll.id}/votes`).set('Authorization', `Bearer ${authToken}`).send({
            pollId: poll.id,
            voterId,
            voterEthnicity: 'black',
            voterGender: 'male',
            voteOptionText: 'kamala',
            voteOptionId: '67a2fc834e011d27320e4e79',
            voterIp: '123',
            voterCountry: 'US',
            voterRegion: 'MA',
            voterCity: 'Natick',
        })

        expect(res.status).toBe(400);
        expect(res.body.errors).toBe('Vote validation failed: voteOptionId: Vote option must be one of the valid options from the poll.');
    })
})