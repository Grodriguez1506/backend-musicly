import { Schema, model, mongo } from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";

const FollowSchema = Schema({
  user: {
    type: Schema.ObjectId,
    ref: "User",
  },
  artist: {
    type: Schema.ObjectId,
    ref: "Artist",
  },
  created_at: {
    type: Date,
    default: Date.now,
  },
});

FollowSchema.plugin(mongoosePaginate);

export default model("Follow", FollowSchema, "follows");
