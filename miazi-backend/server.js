const express = require("express");
const multer = require("multer");
const mongoose = require("mongoose");
const cors = require("cors");
const serverless = require("serverless-http");
require("dotenv").config();

const app = express();

// =====================
// MIDDLEWARE
// =====================
app.use(express.json());

// ✅ CORS (Vercel + production safe)
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"]
  })
);

// =====================
// MONGODB CONNECTION (IMPORTANT)
// =====================
let isConnected = false;

async function connectDB() {
  if (isConnected) return;

  await mongoose.connect(process.env.MONGO_URL);
  isConnected = true;

  console.log("MongoDB Connected");
}

connectDB();

// =====================
// SCHEMA
// =====================
const AppSchema = new mongoose.Schema({
  posters: [String],

  downloads: {
    type: Number,
    default: 0,
  },

  notification: {
    badge: String,
    title: String,
    desc: String,
    body: String,
  },
});

const AppData = mongoose.model("AppData", AppSchema);

// =====================
// MULTER
// =====================
const storage = multer.memoryStorage();
const upload = multer({ storage });

// =====================
// GET OR CREATE GLOBAL DATA
// =====================
async function getGlobalData() {
  await connectDB();

  let data = await AppData.findOne();

  if (!data) {
    data = new AppData({
      posters: [],
      downloads: 0,
      notification: {
        badge: "1",
        title: "New Updates!",
        desc: "Click to review announcements",
        body: "Welcome to Miazi Shop App",
      },
    });

    await data.save();
  }

  return data;
}

// =====================
// ROUTES
// =====================

// GET APP DATA
app.get("/app-data", async (req, res) => {
  const data = await getGlobalData();
  res.json(data);
});

// DOWNLOAD COUNT
app.get("/download-count", async (req, res) => {
  const data = await getGlobalData();

  res.json({
    downloads: data.downloads,
  });
});

// DOWNLOAD APK / AAB
app.get("/download/:type", async (req, res) => {
  try {
    const data = await getGlobalData();

    data.downloads += 1;
    await data.save();

    const type = req.params.type;

    if (type === "apk") {
      return res.redirect(
        "https://www.miazishop.info/Miazi%20Shop.apk"
      );
    }

    if (type === "aab") {
      return res.redirect(
        "https://www.miazishop.info/Miazi%20Shop.aab"
      );
    }

    return res.status(404).json({ success: false });
  } catch (err) {
    return res.status(500).json({ success: false });
  }
});

// UPLOAD POSTERS
app.post("/upload", upload.array("images"), async (req, res) => {
  try {
    const data = await getGlobalData();

    const base64Images = req.files.map(
      (file) =>
        `data:${file.mimetype};base64,${file.buffer.toString("base64")}`
    );

    data.posters = base64Images;
    await data.save();

    res.json({
      success: true,
      posters: base64Images,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// SAVE SETTINGS
app.post("/save-settings", async (req, res) => {
  const data = await getGlobalData();

  data.notification = req.body.notification;
  await data.save();

  res.json({
    success: true,
    message: "Notification updated globally",
  });
});

// =====================
// EXPORT FOR VERCEL
// =====================
module.exports = app;
module.exports.handler = serverless(app);