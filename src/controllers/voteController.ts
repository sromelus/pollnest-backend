import { Request, Response } from 'express';

type Votes = {
  trump: number;
  kamala: number;
};

let votes: Votes = { trump: 0, kamala: 0 };

export const getVotes = (req: Request, res: Response) => {
  res.json(votes);
};

export const castVote = (req: Request, res: Response) => {
  const candidateName = Object.keys(req.body.candidate)[0] as keyof Votes;

  if (votes[candidateName] !== undefined) {
    votes[candidateName] += 1;
    res.status(200).json({ success: true, votes });
  } else {
    res.status(400).json({ success: false, message: 'Invalid candidate' });
  }
};
