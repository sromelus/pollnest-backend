import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IVote extends Document {
  pollId: Types.ObjectId,
  voteOptionText: string;
  voteOptionId: string,
  voterId: Types.ObjectId;
  voterIp: string,
  voterCountry: string,
  voterRegion: string,
  voterCity: string,
  voterEthnicity: string;
  voterGender: string;
}

const VoteSchema = new Schema<IVote>({
    pollId: {
      type: Schema.Types.ObjectId,
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
    voteOptionId: {
      type: Schema.Types.String,
      required: true,
      validate: {
        validator: async function(this: IVote, voteOptionId: string) {
          const Poll = mongoose.model('Poll');
          const poll = await Poll.findById(this.pollId);
          if(!poll) return false;
          return (poll.pollOptions as Array<{ _id: string }>).some((option) => option._id == voteOptionId);
        },
        message: 'Vote option must be one of the valid options from the poll.'
      }
    },
    voterId: {
      type: Schema.Types.ObjectId,
      required: true,
    },
    voterIp: {
      type: Schema.Types.String,
      required: true
    },
    voterCountry: {
      type: Schema.Types.String,
      required: true
    },
    voterRegion: {
      type: Schema.Types.String,
      required: false
    },
    voterCity: {
      type: Schema.Types.String,
      required: false
    },
    voterEthnicity: {
      type: Schema.Types.String,
    },
    voterGender: {
      type: Schema.Types.String,
    }
  },
  {
      timestamps: true
  }
);

export default mongoose.model<IVote>('Vote', VoteSchema);