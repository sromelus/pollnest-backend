import { Vote } from '../../src/models'

export const testVote = (pollId: any, voterId: any, pollOptionText: string) => {
    const vote = new Vote({
        pollId,
        pollOptionText,
        voterId,
        voterIp: '23',
        voterCountry: 'US',
        voterRegion: 'MA',
        voterCity: 'Boston',
        voterEthnicity: 'Black',
        voterGender: 'male'
    })

    return vote;
};