import Vote from '../../src/models/Vote'

export const testVote = (pollId: any, voterId: any, voteOptionText: string) => {
    const vote = new Vote({
        pollId,
        voteOptionText,
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