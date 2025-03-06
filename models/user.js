import { Schema, model } from "mongoose";

const UserSchema = Schema({
  name: {
    type: String,
    required: true,
  },
  surname: String,
  username: {
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
    default: "user_role",
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

export default model("User", UserSchema);
