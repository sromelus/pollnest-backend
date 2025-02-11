import { Vote, IVote } from '../../src/models'

export const testVote = (options: Partial<IVote>): IVote => {
        const defaults = {
            pollId: '67a26660f5de61f22181db3d',
            voterId: '67a26660f5de61f22181db3d',
            voteOptionText: 'trump',
            pollOptionId: '67a26660f5de61f22181db3d',
            voterIp: '23',
            voterCountry: 'US',
            voterRegion: 'MA',
            voterCity: 'Boston',
            voterEthnicity: 'Black',
            voterGender: 'male'
        }

        const mergedOptions = { ...defaults, ...options };

        const vote = new Vote(mergedOptions);

        return vote;
};