import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';

interface Votes {
  voterEthnicity: string;
  voterGender: string;
  candidate: string;
};

interface VoteTally {
  [key: string]: number;
}

let votes: Votes[] = [];
let voteTally: VoteTally = { kamala: 0, trump: 0 };
let previousUserSession = new Set<string>();

export const getVotes = (req: Request, res: Response) => {
    let sessionId = req.cookies?.sessionId;
    const hasVoted = previousUserSession.has(sessionId);
    res.send({ voteTally, visitedUser: { disabledVote: hasVoted }});
};

export const castVote = (req: Request, res: Response) => {
  let sessionId = req.cookies?.sessionId;
  const { candidate, voterEthnicity, voterGender } = req.body as Votes;

  if (!sessionId) {
    sessionId = uuidv4();
  }

  if(previousUserSession.has(sessionId)) {
    res.status(403).send({ success: false, message: 'User has already voted' });
    return;
  }

  if (req.body !== undefined && candidate !== '') {
      votes.push({ candidate, voterEthnicity, voterGender });
      voteTally[candidate] += 1;

      res.cookie('sessionId', sessionId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 1000 * 60 * 60 * 24 * 60,
        sameSite: 'none',
      });

      previousUserSession.add(sessionId);
      res.status(200).send({ success: true, voteTally });
  } else {
    res.status(400).send({ success: false, message: 'Invalid candidate' });
  }
};
