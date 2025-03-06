import { Schema, model } from "mongoose";

const ArtistSchema = Schema({
  name: {
    type: String,
    required: true,
  },
  surname: String,
  artisticName: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    select: false,
  },
  password: {
    type: String,
    required: true,
    select: false,
  },
  role: {
    type: String,
    default: "artist_role",
  },
  avatar: {
    type: String,
    default: "default.jpg",
  },
  created_at: {
    type: Date,
    default: Date.now,
  },
});

export default model("Artist", ArtistSchema, "artists");
