import mongoose, { Schema, Document } from 'mongoose';
import Poll from '../../src/models/Poll';

export interface Vote extends Document {
  pollId: string,
  pollOptionText: string;
  voterId: string;
  voterEthnicity: string;
  voterGender: string;
  createdAt: Date;
}

const VoteSchema: Schema = new Schema({
    pollId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true
    },
    pollOptionText: {
      type: String,
      required: true,
      validate: {
        validator: async function(this: any, pollOptionText: string) {
          const poll = await Poll.findById(this.pollId);
          if(!poll) return false;
          return (poll.pollOptions as Array<{ pollOptionText: string }>).some((option) => option.pollOptionText === pollOptionText);
        },
        message: 'Vote option must be one of the valid options from the poll.'
      }
    },
    voterId: {
      type: String,
      required: true,
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
    }
  },
  {
      timestamps: true
  }
);

export default mongoose.model<Vote>('Vote', VoteSchema);