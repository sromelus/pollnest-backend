import { dbConnect, dbDisconnect, dropDatabase } from '../helpers/dbTestConfig';
import { Poll } from '../../src/models';
import { testUser, testPoll } from '../factories'


beforeAll(async () => {
    await dbConnect();
});

beforeEach(async () => {
    await dropDatabase();
});

afterAll(async () => {
    await dbDisconnect();
});


describe('Poll Model', () => {
    //Happy Path
    it('should create a new poll successfully', async () => {
        const savedAdmin = await testUser('admin@example.com', 'admin');
        await testUser('subscriber@example.com', 'subscriber');
        await testUser('user@example.com');

        const poll = await testPoll(savedAdmin._id);
        const savedPoll = await poll.save();

        expect(savedPoll._id).toBeDefined();
        expect(savedPoll.title).toEqual('2024 elections');
        expect(savedPoll.description).toEqual('Who do you think is going to win this election?');
        expect(savedPoll.messages).toEqual([]);
        expect(savedPoll.voteOptions).toHaveLength(2);
    });

    it('should create 2 new polls successfully', async () => {
        const savedAdmin = await testUser('admin2@example.com', 'admin');
        await testUser('subscriber2@example.com', 'subscriber');
        await testUser('user2@example.com');

        const poll1 = await testPoll(savedAdmin._id);
        const poll2 = await testPoll(savedAdmin._id);

        const savedPoll1 = await poll1.save();
        const savedPoll2 = await poll2.save();
        const pollCount = await Poll.find({});

        expect(savedPoll1._id).toBeDefined();
        expect(savedPoll2._id).toBeDefined();
        expect(pollCount).toHaveLength(2);
    });

    //Sad Path
    it('should not create a new poll with missing attributes', async () => {
        const savedAdmin = await testUser('admin3@example.com', 'admin');
        const savedUser = await testUser('user3@example.com');
        await testUser('subscriber3@example.com', 'subscriber');

        const messages = [{userId: savedUser._id, content: 'hello world', createdAt: Date.now()}];
        const poll = new Poll({ messages });

        try {
            await poll.save();
            fail('Should not succeed in saving invalid poll');
        } catch (error) {
            expect((error as any).errors.title.message).toBe('Path `title` is required.');
            expect((error as any).errors.description.message).toBe('Path `description` is required.');
            expect((error as any).errors.userId.message).toBe('Path `userId` is required.');
            expect((error as any).errors.voteOptions.message).toBe('You should provide at least 2 vote options');
        }
    });
});