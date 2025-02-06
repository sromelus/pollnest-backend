import mongoose, { Schema, Document } from 'mongoose';

export interface Vote extends Document {
  pollId: string,
  voteOptionText: string;
  voterId: string;
  voterEthnicity: string;
  voterGender: string;
  createdAt: Date;
}

const VoteSchema: Schema = new Schema({
    pollId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Poll',
      validate: {
        validator: async function(this: any, pollId: string) {
          const Poll = mongoose.model('Poll');
          const poll = await Poll.findById(pollId);
          return poll !== null;
        },
        message: 'Poll not found'
      },
      required: true
    },
    voteOptionText: {
      type: String,
      required: true,
    },
    voterVoteOptionId: {
      type: String,
      required: true,
      validate: {
        validator: async function(this: any, voterVoteOptionId: string) {
          const Poll = mongoose.model('Poll');
          const poll = await Poll.findById(this.pollId);
          if(!poll) return false;
          return (poll.pollOptions as Array<{ _id: string }>).some((option) => option._id == voterVoteOptionId);
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
    },
    voterGender: {
      type: String,
    }
  },
  {
      timestamps: true
  }
);

export default mongoose.model<Vote>('Vote', VoteSchema);