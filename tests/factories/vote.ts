import { Vote } from '../../src/models'

export const testVote = (options: {pollId: any, voterId: any, pollOptionText: string} = {pollId: '123', voterId: '123', pollOptionText: 'trump'}) => {
    const vote = new Vote({
        pollId: options.pollId,
        pollOptionText: options.pollOptionText,
        voterId: options.voterId,
        voterIp: '23',
        voterCountry: 'US',
        voterRegion: 'MA',
        voterCity: 'Boston',
        voterEthnicity: 'Black',
        voterGender: 'male'
    })

    return vote;
};