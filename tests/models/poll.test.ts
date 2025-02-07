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
        const savedAdmin = testUser({email: 'admin@example.com', role: 'admin'});
        await savedAdmin.save();
        testUser({email: 'subscriber@example.com', role: 'subscriber'});
        testUser({email: 'user@example.com', role: 'user'});

        const poll = testPoll({ creatorId: savedAdmin.id });
        const savedPoll = await poll.save();

        expect(savedPoll._id).toBeDefined();
        expect(savedPoll.title).toEqual('2024 elections');
        expect(savedPoll.description).toEqual('Who do you think is going to win this election?');
        expect(savedPoll.messages).toHaveLength(2);
        expect(savedPoll.pollOptions).toHaveLength(2);
    });

    it('should create 2 new polls successfully', async () => {
        const savedAdmin = testUser({email: 'admin2@example.com', role: 'admin'});
        await savedAdmin.save();
        testUser({email: 'subscriber2@example.com', role: 'subscriber'});
        testUser({email: 'user2@example.com', role: 'user'});

        const poll1 = testPoll({ creatorId: savedAdmin.id });
        const poll2 = testPoll({ creatorId: savedAdmin.id });

        const savedPoll1 = await poll1.save();
        const savedPoll2 = await poll2.save();
        const pollCount = await Poll.find({});

        expect(savedPoll1._id).toBeDefined();
        expect(savedPoll2._id).toBeDefined();
        expect(pollCount).toHaveLength(2);
    });

    //Sad Path
    it('should not create a new poll with missing attributes', async () => {
        const savedAdmin = testUser({email: 'admin3@example.com', role: 'admin'});
        const savedUser = testUser({email: 'user3@example.com', role: 'user'});
        testUser({email: 'subscriber3@example.com', role: 'subscriber'});

        const messages = [{userId: savedUser._id, content: 'hello world', createdAt: Date.now()}];
        const poll = new Poll({ messages });

        try {
            await poll.save();
            fail('Should not succeed in saving invalid poll');
        } catch (error) {
            expect((error as any).errors.title.message).toBe('Path `title` is required.');
            expect((error as any).errors.description.message).toBe('Path `description` is required.');
            expect((error as any).errors.creatorId.message).toBe('Path `creatorId` is required.');
            expect((error as any).errors.pollOptions.message).toBe('You should provide at least 2 poll options');
        }
    });
});