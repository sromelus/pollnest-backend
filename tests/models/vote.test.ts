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
        const subscriber = await testUser('jane@example.com', 'subscriber');
        const savedSubscriber = await subscriber.save();
        const poll = await testPoll(savedSubscriber._id);
        const savedPoll = await poll.save();

        const vote = testVote(savedPoll.id, subscriber._id, 'trump')
        const savedVote = await vote.save();

        expect(savedVote._id).toBeDefined();
    });

    //Sad Path
    it('should not create a vote when pollId or voteOptionText is missing', async () => {
        const vote = testVote(null, null, '')

        try {
            await vote.save();
            fail('Should not succeed in creating vote');
        } catch(error) {
            expect((error as any).errors.pollId.message).toBe('Path `pollId` is required.');
            expect((error as any).errors.voteOptionText.message).toBe('Path `voteOptionText` is required.');
        }
    });

    // Sad Path
    it('should not create a vote when voteOptionText is not valid', async () => {
        const subscriber = await testUser('jane2@example.com', 'subscriber');
        const poll = await testPoll(subscriber._id);
        const savedSubscriber = await subscriber.save();
        const savedPoll = await poll.save();

        const vote = testVote(savedPoll._id, savedSubscriber._id, 'wrongOption')

        try {
            await vote.save();
            fail('Should not succeed in creating vote');
        } catch(error) {
            expect((error as any).errors.voteOptionText.message).toBe('Vote option must be one of the valid options from the poll.');
        }
    });
});