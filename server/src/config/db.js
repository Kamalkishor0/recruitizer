import mongoose from "mongoose";

export default function connectDB() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("MONGODB_URI is not set");

  return mongoose
    .connect(uri)
    .then(() => console.log("Connected to MongoDB"))
    .catch(err => {
      console.error("Failed to connect to MongoDB", err);
      throw err;
    });
}