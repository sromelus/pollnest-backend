import { dbConnect, dbDisconnect, dropDatabase } from '../helpers/dbTestConfig';
import { testUser, testPoll, testVote } from '../factories';
import { UserRole } from '../../src/models';

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
        const subscriber = testUser({firstName: 'Jane', lastName: 'Doe', email: 'jane@example.com', password: '12345678Aa!', role: UserRole.Subscriber});
        await subscriber.save();
        const poll = testPoll({ creatorId: subscriber.id });
        const savedPoll = await poll.save();


        const vote = testVote(
            {
                pollId: savedPoll.id,
                voterId: subscriber.id,
                voteOptionText: 'trump',
                pollOptionId: (savedPoll.pollOptions[0] as any)._id,
                voterEthnicity: 'white',
                voterGender: 'male'
            })

        const savedVote = await vote.save();

        expect(savedVote._id).toBeDefined();
    });

    //Sad Path
    it('should not create a vote when pollId or pollOptionId is missing', async () => {
        const vote = testVote({pollId: undefined, voterId: undefined, voteOptionText: '', pollOptionId: undefined})

        try {
            await vote.save();
            fail('Should not succeed in creating vote');
        } catch(error) {
            expect((error as any).errors.pollId.message).toBe('Path `pollId` is required.');
            expect((error as any).errors.voteOptionText.message).toBe('Path `voteOptionText` is required.');
        }
    });

    // Sad Path
    it('should not create a vote when pollOptionId is not valid', async () => {
        const subscriber = testUser({firstName: 'Jane', lastName: 'Doe', email: 'jane2@example.com', password: '12345678Aa!', role: UserRole.Subscriber});
        await subscriber.save();
        const poll = testPoll({ creatorId: subscriber.id });
        const savedPoll = await poll.save();

        const vote = testVote({pollId: savedPoll.id, voterId: subscriber.id, pollOptionId: '67a26660f5de61f22181db3d'})

        try {
            await vote.save();
            fail('Should not succeed in creating vote');
        } catch(error) {
            expect((error as any).errors.pollOptionId.message).toBe('Vote option must be one of the valid options from the poll.');
        }
    });
});