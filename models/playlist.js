import { Schema, model } from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";

const PlaylistSchema = Schema({
  name: {
    type: String,
    required: true,
  },
  user: {
    type: Schema.ObjectId,
    ref: "User",
  },
  image: {
    type: String,
  },
  songs: [
    {
      type: Schema.ObjectId,
      ref: "Song",
    },
  ],
  created_at: {
    type: Date,
    default: Date.now,
  },
});

PlaylistSchema.plugin(mongoosePaginate);

export default model("Playlist", PlaylistSchema, "playlists");
