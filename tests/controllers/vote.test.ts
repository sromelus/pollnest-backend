import express from "express";
import request from 'supertest';
import { dbConnect, dbDisconnect, dropDatabase } from '../helpers/dbTestConfig';
import routes from "../../src/routes";
import { testVote, testPoll, testUser } from "../factories";

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
    let poll: any;
    let voterId: string;

    beforeEach(async () => {
        const user = testUser({ role: 'admin' });
        await user.save();
        const pollObj = testPoll({ userId: user.id, pollOptions: [{img: 'trump_img', pollOptionText: 'trump', count: 0}, {img: 'kamala_img', pollOptionText: 'kamala', count: 0}] });
        await pollObj.save();
        poll = pollObj;
        voterId = user.id;
    });

    it('should create a vote', async () => {
        //get the vote tally before the vote is created
        const kamalaVote = poll.pollOptions.find((option: any) => option.pollOptionText === 'kamala');

        //get the vote tally after the vote is created
        const res = await request(app).post(`/api/v1/polls/${poll.id}/votes`).send({
            ...testVote({ pollId: poll.id, voterId, voteOptionText: 'kamala' }),
            voterVoteOptionId: kamalaVote._id
        })

        const kamalaOptionTally = res.body.voteTally.find((option: any) => option._id == kamalaVote._id);

        // .set('Authorization', `Bearer ${token}`);

        expect(res.status).toBe(201);
        expect(res.body).toHaveProperty('voteTally');
        expect(JSON.stringify(res.body.voteTally)).not.toEqual(JSON.stringify(poll.pollOptions));
        expect(kamalaOptionTally.count).toBe(kamalaVote.count + 1);
    })


    it('should not create a vote if the option is not found', async () => {
        const res = await request(app).post(`/api/v1/polls/${poll.id}/votes`).send({
            ...testVote({ pollId: poll.id, voterId, voteOptionText: 'trump' }),
            voterVoteOptionId: '67a2fc834e011d27320e4e79'
        })
        expect(res.status).toBe(404);
    })
})