import mongoose from "mongoose";

const connectDB = async (mongoUri) => {
  await mongoose.connect(mongoUri);
  // eslint-disable-next-line no-console
  console.log("MongoDB connected");
};

export default connectDB;
