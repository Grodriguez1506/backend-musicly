import { Schema, model } from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";

const SongSchema = Schema({
  name: String,
  artist: {
    type: Schema.ObjectId,
    ref: "Artist",
  },
  album: {
    type: Schema.ObjectId,
    ref: "Album",
  },
  track: Number,
  file: {
    type: String,
    required: true,
  },
  likes: [
    {
      type: Schema.ObjectId,
      ref: "User",
    },
  ],
  created_at: {
    type: Date,
    default: Date.now,
  },
});

SongSchema.plugin(mongoosePaginate);

export default model("Song", SongSchema, "songs");
