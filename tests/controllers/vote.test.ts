import express from "express";
import request from 'supertest';
import { dbConnect, dbDisconnect, dropDatabase } from '../helpers/dbTestConfig';
import routes from "../../src/routes";
import { testPoll, testUser } from "../factories";
import { UserRole, IPoll, PollOptionType } from "../../src/models";
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

    it('should create a vote', async () => {
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
                voterIp: '123',
                voterCountry: 'US',
                voterRegion: 'MA',
                voterCity: 'Natick'
            });

        expect(res.status).toBe(201);
        expect(res.body.message).toBe('Vote created successfully');
        expect(res.body.data).toHaveProperty('optionVoteTally');
        expect(res.body.data.optionVoteTally.count).toBe(1);
    });

    it('should not create a vote if the pollOptionId is not found', async () => {
        const res = await request(app).post(`/api/v1/polls/${poll.id}/votes`).set('Authorization', `Bearer ${authToken}`).send({
            pollId: poll.id,
            voterId,
            voterEthnicity: 'black',
            voterGender: 'male',
            voteOptionText: 'kamala',
            pollOptionId: '67a2fc834e011d27320e4e79',
            voterIp: '123',
            voterCountry: 'US',
            voterRegion: 'MA',
            voterCity: 'Natick',
        })

        expect(res.status).toBe(404);
        expect(res.body.message).toBe('Poll or option not found');
    })
})