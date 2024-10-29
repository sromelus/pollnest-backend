import { Request, Response } from 'express';

interface Votes {
  votedUser: object;
  voterEthnicity: string;
  voterGender: string;
  candidate: string;
};

interface VoteTally {
  [key: string]: number;
}

let votes: Votes[] = [];
let voteTally: VoteTally = { kamala: 0, trump: 0 };

export const getVotes = (req: Request, res: Response) => {
    res.json(voteTally);
};

export const castVote = (req: Request, res: Response) => {
  const { votedUser, candidate, voterEthnicity, voterGender } = req.body as Votes;

  if (req.body !== undefined && candidate !== '') {
    votes.push({ votedUser, candidate, voterEthnicity, voterGender });
    voteTally[candidate] += 1;

    res.status(200).json({ success: true, voteTally });
  } else {
    res.status(400).json({ success: false, message: 'Invalid candidate' });
  }
};
