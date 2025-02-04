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
        const subscriber = testUser({email: 'jane@example.com', role: 'subscriber'});
        await subscriber.save();
        const poll = testPoll(subscriber.id);
        const savedPoll = await poll.save();

        const vote = testVote(savedPoll.id, subscriber._id, 'trump')
        const savedVote = await vote.save();

        expect(savedVote._id).toBeDefined();
    });

    //Sad Path
    it('should not create a vote when pollId or pollOptionText is missing', async () => {
        const vote = testVote(null, null, '')

        try {
            await vote.save();
            fail('Should not succeed in creating vote');
        } catch(error) {
            expect((error as any).errors.pollId.message).toBe('Path `pollId` is required.');
            expect((error as any).errors.pollOptionText.message).toBe('Path `pollOptionText` is required.');
        }
    });

    // Sad Path
    it('should not create a vote when pollOptionText is not valid', async () => {
        const subscriber = testUser({email: 'jane2@example.com', role: 'subscriber'});
        await subscriber.save();
        const poll = testPoll(subscriber.id);
        const savedPoll = await poll.save();

        const vote = testVote(savedPoll.id, subscriber.id, 'wrongOption')

        try {
            await vote.save();
            fail('Should not succeed in creating vote');
        } catch(error) {
            expect((error as any).errors.pollOptionText.message).toBe('Vote option must be one of the valid options from the poll.');
        }
    });
});