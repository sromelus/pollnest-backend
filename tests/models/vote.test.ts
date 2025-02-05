import { dbConnect, dbDisconnect, dropDatabase } from '../helpers/dbTestConfig';
import { testUser, testPoll, testVote } from '../factories';

beforeAll(async () => {
    await dbConnect();
});

beforeEach(async () => {
    await dropDatabase();
});

afterAll(async () => {
    await dbDisconnect();
});

describe('Vote Model', () => {
    //Happy Path
    it('should create new vote successfully', async () => {
        const subscriber = testUser({firstName: 'Jane', lastName: 'Doe', email: 'jane@example.com', password: '12345678Aa!', role: 'subscriber'});
        await subscriber.save();
        const poll = testPoll({ userId: subscriber.id });
        const savedPoll = await poll.save();

        const vote = testVote({pollId: savedPoll.id, voterId: subscriber.id, voteOptionText: 'trump'})
        const savedVote = await vote.save();

        expect(savedVote._id).toBeDefined();
    });

    //Sad Path
    it('should not create a vote when pollId or pollOptionText is missing', async () => {
        const vote = testVote({pollId: null, voterId: null, voteOptionText: ''})

        try {
            await vote.save();
            fail('Should not succeed in creating vote');
        } catch(error) {
            expect((error as any).errors.pollId.message).toBe('Path `pollId` is required.');
            expect((error as any).errors.voteOptionText.message).toBe('Path `voteOptionText` is required.');
        }
    });

    // Sad Path
    it('should not create a vote when pollOptionText is not valid', async () => {
        const subscriber = testUser({firstName: 'Jane', lastName: 'Doe', email: 'jane2@example.com', password: '12345678Aa!', role: 'subscriber'});
        await subscriber.save();
        const poll = testPoll({ userId: subscriber.id });
        const savedPoll = await poll.save();

        const vote = testVote({pollId: savedPoll.id, voterId: subscriber.id, voteOptionText: 'wrongOption'})

        try {
            await vote.save();
            fail('Should not succeed in creating vote');
        } catch(error) {
            expect((error as any).errors.voteOptionText.message).toBe('Vote option must be one of the valid options from the poll.');
        }
    });
});