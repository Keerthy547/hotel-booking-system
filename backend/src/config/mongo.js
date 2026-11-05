
import "dotenv/config";
import mongoose from "mongoose";

export async function connectMongo() {
  await mongoose.connect(process.env.MONGODB_URI);

  console.log(
    "MongoDB connected successfully:",
    mongoose.connection.name
  );
}
