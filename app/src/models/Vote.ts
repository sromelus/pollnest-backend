import mongoose, { Schema, Document } from 'mongoose';
import { Candidate } from './VoteTally';

export interface Vote extends Document {
  candidate: Candidate;
  voterId: string;
  voterEthnicity: string;
  voterGender: string;
  createdAt: Date;
}

const VoteSchema: Schema = new Schema({
  candidate: {
    type: String,
    required: true,
    enum: Object.values(Candidate)
  },
  voterId: {
    type: String,
    required: true,
    unique: true
  },
  voterIp: {
    type: String,
    required: true
  },
  voterCountry: {
    type: String,
    required: true
  },
  voterRegion: {
    type: String,
    required: false
  },
  voterCity: {
    type: String,
    required: false
  },
  voterEthnicity: {
    type: String,
    required: true
  },
  voterGender: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.model<Vote>('Vote', VoteSchema);