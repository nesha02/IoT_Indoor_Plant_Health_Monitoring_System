import "dotenv/config";
import express from "express";
import cors from "cors";
import { MongoClient } from "mongodb";

// ─────────────────────────────────────────────
//  DATABASE SETUP
// ─────────────────────────────────────────────

const uri =
  process.env.MONGODB_URI || "mongodb+srv://team_user:team12345@cluster0.khlfwda.mongodb.net/?retryWrites=true&w=majority";

const client = new MongoClient(uri);
let sensorCollection: any;
let wateringCollection: any;

async function connectDB() {
  await client.connect();
  const db = client.db("iotbda_database");
  sensorCollection = db.collection("sensor_data");
  wateringCollection = db.collection("watering_events");
  console.log("✅ MongoDB connected");
}

connectDB().catch(console.error);
console.log("Gemini key loaded:", process.env.GEMINI_API_KEY ? "YES ✅" : "NO ❌");

// ─────────────────────────────────────────────
//  PLANT THRESHOLDS
//  Matched exactly to ESP32 defines in the .ino file:
//  MP_START=30, MP_STOP=55, MP_MAX=62
//  SP_START=25, SP_STOP=42, SP_MAX=50
//  CA_START=20, CA_STOP=28, CA_MAX=35
// ─────────────────────────────────────────────

const THRESHOLDS: Record<string, { dry: number; safe: number; overwet: number }> = {
  money_plant: { dry: 30, safe: 55, overwet: 62 },
  snake_plant:  { dry: 25, safe: 42, overwet: 50 },
  cactus:       { dry: 20, safe: 28, overwet: 35 },
};

const DEFAULT_THRESHOLDS = { dry: 30, safe: 55, overwet: 62 };

// ─────────────────────────────────────────────
//  HELPER FUNCTIONS
// ─────────────────────────────────────────────

function getSoil(data: any, id: string): number {
  if (id === "plant1") return data.soil1_pct ?? 0;
  if (id === "plant2") return data.soil2_pct ?? 0;
  return data.soil3_pct ?? 0;
}

function getPlantType(data: any, id: string): string {
  if (id === "plant1") return data.plant1_type ?? "unknown";
  if (id === "plant2") return data.plant2_type ?? "unknown";
  return data.plant3_type ?? "unknown";
}

function getThresholds(plantType: string) {
  return THRESHOLDS[plantType] ?? DEFAULT_THRESHOLDS;
}

function getAlertStatus(
  soil: number,
  thresholds: { dry: number; overwet: number }
): string {
  if (soil < thresholds.dry) return "Dry soil";
  if (soil > thresholds.overwet) return "Over-watering risk";
  return "Safe";
}



// ─────────────────────────────────────────────
//  SERVER
// ─────────────────────────────────────────────

export function createServer() {
  const app = express();

  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // ── Health Check ───────────────────────────
  app.get("/api/status", (_req, res) => {
    res.json({ status: "API running", timestamp: new Date().toISOString() });
  });

  // ─────────────────────────────────────────
  //  LIVE SENSOR DATA
  //  GET /api/plant/:id/live
  //  Returns latest sensor reading + thresholds for colored bar
  // ─────────────────────────────────────────

  app.get("/api/plant/:id/live", async (req, res) => {
    try {
      const id = req.params.id;

      const sensorData = await sensorCollection
        .find()
        .sort({ timestamp: -1 })
        .limit(1)
        .toArray();

      if (!sensorData.length) {
        return res.status(404).json({ error: "No sensor data found" });
      }

      const latest = sensorData[0];
      const plantType = getPlantType(latest, id);
      const soil = getSoil(latest, id);
      const thresholds = getThresholds(plantType);

      // pump_status and water_delivered come from watering_events, NOT sensor_data
      // ESP32 publishes watering event AFTER pump turns off, so "ON" means recently active
      const wateringData = await wateringCollection
        .find({ plant_id: id })
        .sort({ timestamp: -1 })
        .limit(1)
        .toArray();

      const latestWatering = wateringData[0] ?? null;

      // "ON" = watering event occurred within last 2 minutes
      let pumpStatus = "OFF";
      if (latestWatering) {
        const diffMinutes =
          (Date.now() - new Date(latestWatering.timestamp).getTime()) / 60000;
        if (diffMinutes < 2) pumpStatus = "ON";
      }

      res.json({
        plant_id: id,
        plant_type: plantType,
        soil_pct: soil,
        temperature: latest.temperature ?? null,
        humidity: latest.humidity ?? null,
        light: latest.light ?? null,
        is_valid: latest.is_valid ?? true,
        pump_status: pumpStatus,
        water_delivered: latestWatering?.impact_gain ?? 0,
        last_updated: latest.timestamp,
        // Thresholds for colored moisture bar
        thresholds: {
          dry: thresholds.dry,
          safe: thresholds.safe,
          overwet: thresholds.overwet,
        },
      });
    } catch (error) {
      console.error("Live endpoint error:", error);
      res.status(500).json({ error: "Live data failed" });
    }
  });

  // ─────────────────────────────────────────
  // SOIL MOISTURE HISTORY + WATERING MARKERS
  //  GET /api/plant/:id/history
  //  Returns time-series + watering markers + threshold zones for chart
  // ─────────────────────────────────────────

  app.get("/api/plant/:id/history", async (req, res) => {
    try {
      const id = req.params.id;

      const sensorData = await sensorCollection
        .find()
        .sort({ timestamp: 1 })
        .limit(100)
        .toArray();

      if (!sensorData.length) {
        return res.status(404).json({ error: "No history found" });
      }

      const plantType = getPlantType(sensorData[0], id);
      const thresholds = getThresholds(plantType);

      const history = sensorData.map((d: any) => ({
        time: d.timestamp,
        soil: getSoil(d, id),
      }));

      // Watering markers for chart overlay 
      const wateringEvents = await wateringCollection
        .find({ plant_id: id })
        .sort({ timestamp: 1 })
        .toArray();

      const wateringMarkers = wateringEvents.map((e: any) => ({
        time: e.timestamp,
        soil_before: e.soil_before,
        soil_after: e.soil_after,
        impact_gain: e.impact_gain,
      }));

      res.json({
        plant_id: id,
        plant_type: plantType,
        history,
        watering_markers: wateringMarkers,
        // Threshold zones for shaded chart areas 
        thresholds: {
          dry: thresholds.dry,
          safe: thresholds.safe,
          overwet: thresholds.overwet,
        },
      });
    } catch (error) {
      console.error("History endpoint error:", error);
      res.status(500).json({ error: "History failed" });
    }
  });

  // ─────────────────────────────────────────
  //  MOISTURE DROP RATE
  //  GET /api/plant/:id/drop-rate
  // ─────────────────────────────────────────

  app.get("/api/plant/:id/drop-rate", async (req, res) => {
    try {
      const id = req.params.id;

      const data = await sensorCollection
        .find()
        .sort({ timestamp: 1 })
        .limit(50)
        .toArray();

      if (data.length < 2) {
        return res.json({ drop_rate: 0, unit: "% per minute" });
      }

      const firstSoil = getSoil(data[0], id);
      const lastSoil = getSoil(data[data.length - 1], id);

      // Divide by actual elapsed time in minutes (not document count)
      const firstTime = new Date(data[0].timestamp).getTime();
      const lastTime = new Date(data[data.length - 1].timestamp).getTime();
      const timeDiffMinutes = (lastTime - firstTime) / 60000;

      const dropRate =
        timeDiffMinutes > 0
          ? parseFloat(((firstSoil - lastSoil) / timeDiffMinutes).toFixed(4))
          : 0;

      res.json({
        drop_rate: dropRate,
        unit: "% per minute",
        soil_start: firstSoil,
        soil_end: lastSoil,
        duration_minutes: parseFloat(timeDiffMinutes.toFixed(2)),
      });
    } catch (error) {
      console.error("Drop rate endpoint error:", error);
      res.status(500).json({ error: "Drop rate failed" });
    }
  });

  // ─────────────────────────────────────────
  //  ALERTS + ML DECISION SUPPORT
  //  GET /api/plant/:id/analytics
  // ─────────────────────────────────────────

  app.get("/api/plant/:id/analytics", async (req, res) => {
    try {
      const id = req.params.id;

      const sensorData = await sensorCollection
        .find()
        .sort({ timestamp: -1 })
        .limit(1)
        .toArray();

      if (!sensorData.length) {
        return res.status(404).json({ error: "No sensor data found" });
      }

      const latestSensor = sensorData[0];
      const plantType = getPlantType(latestSensor, id);
      const soil = getSoil(latestSensor, id);
      const thresholds = getThresholds(plantType);
      const sensorOffline = !latestSensor.is_valid;

      // Rule-based alert using plant-specific thresholds
      const alert = sensorOffline
        ? "Sensor offline"
        : getAlertStatus(soil, thresholds);

      // Latest ML decision from ESP32
      // prediction is a FLOAT from TinyML (e.g. 0.9821), NOT integer 1 or 0
      // Must compare against 0.5 threshold
      const eventData = await wateringCollection
        .find({ plant_id: id })
        .sort({ timestamp: -1 })
        .limit(1)
        .toArray();

      const latestEvent = eventData[0] ?? null;
      const predictionRaw: number = latestEvent?.prediction ?? 0;


      // Correct: TinyML outputs float — >0.5 means water needed
      let prediction = predictionRaw > 0.5 ? "Water Needed" : "No Water Needed";
      // OVERRIDE: If soil is above overwet threshold, never water
      if (soil > thresholds.overwet) {
        prediction = "No Water Needed";
      }

      // The raw prediction float IS the confidence (0.9821 = 98.21% confident)
      const confidence = latestEvent
        ? parseFloat(predictionRaw.toFixed(2))
        : parseFloat(
            Math.min(0.5 + Math.abs(soil - thresholds.dry) / 100, 1.0).toFixed(2)
          );

      // Estimate next watering time using recent drop rate
      const recentData = await sensorCollection
        .find()
        .sort({ timestamp: -1 })
        .limit(20)
        .toArray();


      // Plant-type-based fallback intervals (in days)
      const fallbackDays: Record<string, number> = {
        money_plant: 2,
        snake_plant: 4,
        cactus: 7,
      };
      let estimatedNextWatering: string | null = null;

      if (recentData.length >= 2) {
        const oldest = recentData[recentData.length - 1];
        const newest = recentData[0];
        const soilOld = getSoil(oldest, id);
        const soilNew = getSoil(newest, id);
        const timeDiffMin =
          (new Date(newest.timestamp).getTime() -
            new Date(oldest.timestamp).getTime()) /
          60000;
        const dropRatePerMin =
          timeDiffMin > 0 ? (soilOld - soilNew) / timeDiffMin : 0;

        if (dropRatePerMin > 0 && soilNew > thresholds.dry) {
          const minsUntilDry = (soilNew - thresholds.dry) / dropRatePerMin;
          estimatedNextWatering = new Date(
            Date.now() + minsUntilDry * 60000
          ).toISOString();
        }
      }

      // Fallback: always provide a value if null
      if (!estimatedNextWatering) {
        const fallback = fallbackDays[plantType] || 3;
        estimatedNextWatering = new Date(Date.now() + fallback * 24 * 60 * 60 * 1000).toISOString();
      }

      // Dynamic insight text
      let insight: string;
      if (sensorOffline) {
        insight = "Sensor appears offline. Please check hardware connection.";
      } else if (predictionRaw > 0.5) {
        insight = `${plantType.replace(/_/g, " ")} required watering. Irrigation was performed automatically.`;
      } else if (alert === "Dry soil") {
        insight = `Soil moisture is critically low at ${soil.toFixed(1)}%. Watering may be needed soon.`;
      } else if (alert === "Over-watering risk") {
        insight = `Soil moisture is very high at ${soil.toFixed(1)}%. Allow soil to dry before next watering.`;
      } else {
        insight = `${plantType.replace(/_/g, " ")} is healthy. No watering required at this time.`;
      }

      res.json({
        plant_id: id,
        plant_type: plantType,
        soil_pct: soil,
        alert,
        sensor_offline: sensorOffline,
        prediction,
        confidence,
        estimated_next_watering: estimatedNextWatering,
        insight,
        thresholds: {
          dry: thresholds.dry,
          safe: thresholds.safe,
          overwet: thresholds.overwet,
        },
      });
    } catch (error) {
      console.error("Analytics endpoint error:", error);
      res.status(500).json({ error: "Analytics failed" });
    }
  });

  // ─────────────────────────────────────────
  //  WATER ANALYTICS
  //  GET /api/plant/:id/water-analytics
  //  Today total, weekly usage, avg per event, last event
  // ─────────────────────────────────────────

  app.get("/api/plant/:id/water-analytics", async (req, res) => {
    try {
      const id = req.params.id;

      const allEvents = await wateringCollection
        .find({ plant_id: id })
        .sort({ timestamp: -1 })
        .toArray();

      if (!allEvents.length) {
        return res.json({
          plant_id: id,
          total_events: 0,
          avg_water_per_event: 0,
          total_water: 0,
          today_total: 0,
          weekly_total: 0,
          last_event: null,
          events: [],
        });
      }

      const now = new Date();

      const todayStart = new Date(now);
      todayStart.setHours(0, 0, 0, 0);

      const weekStart = new Date(now);
      weekStart.setDate(weekStart.getDate() - 7);
      weekStart.setHours(0, 0, 0, 0);

      const todayEvents = allEvents.filter(
        (e: any) => new Date(e.timestamp) >= todayStart
      );
      const weeklyEvents = allEvents.filter(
        (e: any) => new Date(e.timestamp) >= weekStart
      );

      const totalEvents = allEvents.length;
      const totalWater = allEvents.reduce(
        (sum: number, e: any) => sum + (e.impact_gain ?? 0),
        0
      );
      const avgWaterPerEvent = totalEvents > 0 ? totalWater / totalEvents : 0;
      const todayTotal = todayEvents.reduce(
        (sum: number, e: any) => sum + (e.impact_gain ?? 0),
        0
      );
      const weeklyTotal = weeklyEvents.reduce(
        (sum: number, e: any) => sum + (e.impact_gain ?? 0),
        0
      );

      const lastEvent = allEvents[0];

      res.json({
        plant_id: id,
        total_events: totalEvents,
        avg_water_per_event: parseFloat(avgWaterPerEvent.toFixed(2)),
        total_water: parseFloat(totalWater.toFixed(2)),
        today_total: parseFloat(todayTotal.toFixed(2)),
        weekly_total: parseFloat(weeklyTotal.toFixed(2)),
        // Last event details for Water Delivered card
        last_event: {
          water_delivered: lastEvent.impact_gain ?? 0,
          soil_before: lastEvent.soil_before ?? 0,
          soil_after: lastEvent.soil_after ?? 0,
          duration_sec: lastEvent.duration_sec ?? 0,
          timestamp: lastEvent.timestamp,
        },
        // Full event list for table or weekly chart
        events: allEvents.map((e: any) => ({
          timestamp: e.timestamp,
          impact_gain: e.impact_gain ?? 0,
          soil_before: e.soil_before ?? 0,
          soil_after: e.soil_after ?? 0,
          duration_sec: e.duration_sec ?? 0,
        })),
      });
    } catch (error) {
      console.error("Water analytics endpoint error:", error);
      res.status(500).json({ error: "Water analytics failed" });
    }
  });

  // ─────────────────────────────────────────
  //  PHASE 8 — CHATBOT (Gemini LLM — Free Tier)
  //  POST /api/chatbot
  //  Builds rich live context from MongoDB → sends to Gemini → returns answer
  // ─────────────────────────────────────────
 
  app.post("/api/chatbot", async (req, res) => {
    try {
      const { question, history, selectedPlant } = req.body;
 
      if (!question || typeof question !== "string") {
        return res.status(400).json({ error: "Question is required" });
      }
 
      // ── Gather live context from all 3 plants ────────────────────────────
 
      const sensorData = await sensorCollection
        .find()
        .sort({ timestamp: -1 })
        .limit(1)
        .toArray();
 
      if (!sensorData.length) {
        return res.json({ question, answer: "I can't access sensor data right now. Please check if the system is running." });
      }
 
      const latest = sensorData[0];
 
      const plantsContext = ["plant1", "plant2", "plant3"].map((pid) => {
        const plantType = getPlantType(latest, pid);
        const soil = getSoil(latest, pid);
        const thresholds = getThresholds(plantType);
        const alert = getAlertStatus(soil, thresholds);
        return { id: pid, plantType, soil, thresholds, alert };
      });
 
      // Last watering event per plant
      const wateringContext = await Promise.all(
        ["plant1", "plant2", "plant3"].map(async (pid) => {
          const events = await wateringCollection
            .find({ plant_id: pid })
            .sort({ timestamp: -1 })
            .limit(1)
            .toArray();
          return { plant_id: pid, last_watering: events[0] ?? null };
        })
      );
 
      // Recent moisture history for trend analysis (last 10 readings)
      const recentHistory = await sensorCollection
        .find()
        .sort({ timestamp: -1 })
        .limit(10)
        .toArray();
 
      const moistureTrend = recentHistory.reverse().map((d: any) => ({
        time: new Date(d.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        plant1: d.soil1_pct?.toFixed(1),
        plant2: d.soil2_pct?.toFixed(1),
        plant3: d.soil3_pct?.toFixed(1),
      }));
 
      // All watering events (last 5) for pattern analysis
      const recentWateringAll = await wateringCollection
        .find()
        .sort({ timestamp: -1 })
        .limit(5)
        .toArray();
 
      // ── Build rich system prompt ─────────────────────────────────────────
 
      const systemPrompt = `
      You are an intelligent plant care assistant for an IoT Indoor Plant Health Monitoring System.
      You have real-time access to sensor data and irrigation history. You help users understand their plants,
      explain trends and anomalies, and support data-driven decisions.
      
      === CURRENT SENSOR READINGS (${new Date(latest.timestamp).toLocaleString()}) ===
      Temperature: ${latest.temperature ?? "N/A"}°C
      Humidity: ${latest.humidity ?? "N/A"}%
      Light Level: ${latest.light ?? "N/A"} lux
      
      === PLANT STATUS ===
      ${plantsContext
        .map(
          (p) =>
            `${p.id} - ${p.plantType.replace(/_/g, " ")} (${p.plantType}):
        - Soil Moisture: ${p.soil.toFixed(1)}%
        - Status: ${p.alert}
        - Dry threshold: ${p.thresholds.dry}% | Safe target: ${p.thresholds.safe}% | Over-wet limit: ${p.thresholds.overwet}%`
        )
        .join("\n")}
      
      === LAST WATERING EVENTS ===
      ${wateringContext
        .map((w) =>
          w.last_watering
            ? `${w.plant_id}: watered at ${new Date(w.last_watering.timestamp).toLocaleString()}, soil ${w.last_watering.soil_before?.toFixed(1)}% → ${w.last_watering.soil_after?.toFixed(1)}% (gain: +${w.last_watering.impact_gain?.toFixed(1)}%, duration: ${w.last_watering.duration_sec}s, ML prediction confidence: ${(w.last_watering.prediction * 100).toFixed(0)}%)`
            : `${w.plant_id}: no watering events recorded yet`
        )
        .join("\n")}
      
      === RECENT MOISTURE TREND (last 10 readings) ===
      ${moistureTrend.map((t: any) => `${t.time} → Plant1: ${t.plant1}%, Plant2: ${t.plant2}%, Plant3: ${t.plant3}%`).join("\n")}
      
      === RECENT IRRIGATION HISTORY (last 5 events across all plants) ===
      ${recentWateringAll.length > 0
        ? recentWateringAll.map((e: any) =>
            `${e.plant_id} (${e.plant_type}): ${new Date(e.timestamp).toLocaleString()} — soil gain +${e.impact_gain?.toFixed(1)}%`
          ).join("\n")
        : "No irrigation events recorded yet."}
      
      === SYSTEM INFO ===
      - 3 plants monitored: Money Plant, Snake Plant, Cactus
      - TinyML model runs on ESP32 to predict watering needs
      - Pump activates automatically when ML prediction > 50% AND soil < dry threshold
      - Sensors: soil moisture (capacitive), DHT22 (temp/humidity), BH1750 (light)
      - Data flows: ESP32 → MQTT → Python bridge → MongoDB → This dashboard
      
      === YOUR ROLE ===
      - Answer natural language questions about the plants and sensor data
      - Explain trends, anomalies, and comparisons visible in the data
      - Guide users in understanding the dashboard sections
      - Support decision-making: "which plant needs attention?", "what factors affect moisture drop?"
      - Be conversational, friendly, and clear
      - Keep answers focused — 2-5 sentences for simple questions, more detail for complex ones
      - Use the actual numbers from the data above in your answers
            `.trim();
 
      // ── Build conversation history for multi-turn context ────────────────
 
      const contents: any[] = [];
 
      if (Array.isArray(history)) {
        for (const msg of history) {
          if (msg.role === "user") {
            contents.push({ role: "user", parts: [{ text: msg.content }] });
          } else if (msg.role === "assistant") {
            contents.push({ role: "model", parts: [{ text: msg.content }] });
          }
        }
      }
 
      contents.push({ role: "user", parts: [{ text: question }] });
 
      // ── Call Gemini API (free tier) ──────────────────────────────────────
 
      const geminiKey = process.env.GEMINI_API_KEY ?? "";
      const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${geminiKey}`;
 
      const response = await fetch(geminiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          system_instruction: {
            parts: [{ text: systemPrompt }],
          },
          contents,
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 512,
          },
        }),
      });
 
      if (!response.ok) {
        const errText = await response.text();
        console.error("Gemini API error:", errText);
        return res.status(500).json({ error: "Chatbot API call failed" });
      }
 
      const data: any = await response.json();
 
      // Extract text from Gemini response
      const answer =
        data?.candidates?.[0]?.content?.parts?.[0]?.text ??
        "Sorry, I couldn't generate a response. Please try again.";
 
      res.json({ question, answer });
 
    } catch (error) {
      console.error("Chatbot endpoint error:", error);
      res.status(500).json({ error: "Chatbot failed" });
    }
  });
 
  return app;
}
 