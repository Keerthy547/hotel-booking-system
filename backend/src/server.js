import roomTypeRoutes from "./routes/roomTypeRoutes.js";
import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import availabilityRoutes from "./routes/availabilityRoutes.js";
import { connectPostgres, pool } from "./config/db.js";
import { connectMongo } from "./config/mongo.js";
import mongoose from "mongoose";
import hotelRoutes from "./routes/hotelRoutes.js";
import authRoutes from "./routes/authRoutes.js";

const app = express();

app.use(helmet());

app.use(
  cors({
    origin: process.env.CLIENT_URL,
  })
);

app.use(express.json());
app.use("/api/hotels", hotelRoutes);
app.use("/api/hotels", roomTypeRoutes);
app.use("/api/hotels", availabilityRoutes);
app.use("/api/auth", authRoutes);
app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "StayScape API is running!",
    databases: {
      postgres: "connected",
      mongodb: "connected",
    },
  });
});

const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    await connectPostgres();
    await connectMongo();

    const server = app.listen(PORT, () => {
      console.log(`StayScape API running on port ${PORT}`);
    });

    async function shutdown() {
      console.log("Shutting down StayScape API...");

      server.close(async () => {
        await pool.end();
        await mongoose.disconnect();
        console.log("Database connections closed.");
        process.exit(0);
      });
    }

    process.on("SIGINT", shutdown);
    process.on("SIGTERM", shutdown);
  } catch (error) {
    console.error("Failed to start StayScape:", error.message);
    await pool.end();
    await mongoose.disconnect();
    process.exit(1);
  }
}

startServer();
