// Load environment variables from .env file
import "dotenv/config";

// Import required libraries
import express from "express";
import cors from "cors";
import { handleDemo } from "./routes/demo";
import { MongoClient } from "mongodb";

// MongoDB Atlas connection string
const uri = "mongodb+srv://team_user:team12345@cluster0.khlfwda.mongodb.net/?retryWrites=true&w=majority";

// Create MongoDB client
const client = new MongoClient(uri);

// This will hold our MongoDB collection (sensor data)
let collection: any;

// Function to connect to MongoDB
async function connectDB() {
  await client.connect(); // Connect to Atlas
  const db = client.db("iotbda_database"); // Select database
  collection = db.collection("sensor_data"); // Select collection
  console.log("MongoDB connected");
}

// Call the database connection function
connectDB();


// Function to create and configure Express server
export function createServer() {
  const app = express();

  // ---------------- MIDDLEWARE ----------------

  // Enable CORS (allow frontend to access backend)
  app.use(cors());

  // Parse incoming JSON data
  app.use(express.json());

  // Parse URL-encoded data
  app.use(express.urlencoded({ extended: true }));


  // ---------------- EXISTING ROUTES ----------------

  // Simple test endpoint
  app.get("/api/ping", (_req, res) => {
    const ping = process.env.PING_MESSAGE ?? "ping";
    res.json({ message: ping });
  });

  // Demo route
  app.get("/api/demo", handleDemo);


  // ---------------- YOUR API ENDPOINTS ----------------

  // GET latest sensor reading
  app.get("/api/latest", async (req, res) => {
    try {
      // Get most recent document (_id sorted descending)
      const data = await collection.find().sort({ _id: -1 }).limit(1).toArray();

      // Send latest record
      res.json(data[0]);

    } catch (error) {
      res.status(500).json({ error: "Failed to fetch latest data" });
    }
  });


  // GET last 50 sensor readings (history)
  app.get("/api/history", async (req, res) => {
    try {
      const data = await collection.find().sort({ _id: -1 }).limit(50).toArray();
      res.json(data);

    } catch (error) {
      res.status(500).json({ error: "Failed to fetch history" });
    }
  });


  // GET API status (used to check if server is running)
  app.get("/api/status", (req, res) => {
    res.json({ status: "API running" });
  });


  // GET analytics (simple average calculations)
  app.get("/api/analytics", async (req, res) => {
    try {
      // Fetch some data
      const data = await collection.find().limit(100).toArray();

      // Calculate average temperature
      const avgTemp =
        data.reduce((sum: number, d: any) => sum + d.temperature, 0) / data.length;

      // Send analytics result
      res.json({
        avg_temperature: avgTemp,
        records: data.length,
      });

    } catch (error) {
      res.status(500).json({ error: "Analytics failed" });
    }
  });


  // GET prediction (temporary dummy response)
  // Later this will use ML model
  app.get("/api/prediction", (req, res) => {
    res.json({
      plant1: "No Water Needed",
      plant2: "Water Needed",
      plant3: "No Water Needed",
    });
  });


  // Return configured app
  return app;
}