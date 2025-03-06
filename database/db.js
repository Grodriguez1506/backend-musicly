import mongoose from "mongoose";

const connectDb = async () => {
  try {
    await mongoose.connect(process.env.DB_URI);
    console.log("<<<DB Connected>>>");
  } catch (error) {
    console.log("Connection error");
  }
};

export default connectDb;
