import { Schema, model } from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";

const AlbumSchema = Schema({
  artist: {
    type: Schema.ObjectId,
    ref: "Artist",
  },
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  year: {
    type: String,
    required: true,
  },
  image: {
    type: String,
    required: true,
  },
  created_at: {
    type: Date,
    default: Date.now,
  },
});

AlbumSchema.plugin(mongoosePaginate);

export default model("Album", AlbumSchema, "albums");
