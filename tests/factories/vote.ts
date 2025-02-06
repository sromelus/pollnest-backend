import { Vote } from '../../src/models'

export const testVote = (
        options: {
            pollId?: any,
            voterId?: any,
            voteOptionText?: string,
            voterVoteOptionId?: string,
            voterIp?: string,
            voterCountry?: string,
            voterRegion?: string,
            voterCity?: string,
            voterEthnicity?: string,
            voterGender?: string
        } = {}
    ) => {
        const defaults = {
            pollId: '123',
            voterId: '123',
            voteOptionText: 'trump',
            voterVoteOptionId: '123',
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