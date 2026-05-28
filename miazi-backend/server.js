const express = require('express');
const multer = require('multer');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

const app = express();
require('dotenv').config();

const PORT = process.env.PORT || 5000;

mongoose.connect(process.env.MONGO_URL);


// =====================
// CONFIG (OPTION 2 BASE URL SYSTEM)
// =====================
const isProduction = process.env.NODE_ENV === 'production';

const BASE_URL = isProduction
    ? "https://miazi-shop-web.vercel.app"
    : "http://localhost:5000";


// =====================
// MIDDLEWARE
// =====================
app.use(express.json());

// CORS (production-safe)
app.use(cors({
    origin: [
        "https://www.miazishop.info",
        "https://miazi-shop-web.vercel.app",
        "http://127.0.0.1:5500",
        "http://localhost:3000"
    ]
}));

// serve uploads publicly
app.use('/uploads', express.static('uploads'));


// =====================
// MONGODB
// =====================
// mongoose.connect('mongodb://127.0.0.1:27017/miazi');


// =====================
// SCHEMA
// =====================
const AppSchema = new mongoose.Schema({
    posters: [String],

    notification: {
        badge: String,
        title: String,
        desc: String,
        body: String
    }
});

const AppData = mongoose.model('AppData', AppSchema);


// =====================
// MULTER CONFIG
// =====================
const storage = multer.memoryStorage();
const upload = multer({ storage });


// =====================
// GET OR CREATE GLOBAL DATA
// =====================
async function getGlobalData() {
    let data = await AppData.findOne();

    if (!data) {
        data = new AppData({
            posters: [],
            notification: {
                badge: "1",
                title: "New Updates!",
                desc: "Click to review announcements",
                body: "Welcome to Miazi Shop App"
            }
        });

        await data.save();
    }

    return data;
}


// =====================
// GET APP DATA
// =====================
app.get('/app-data', async (req, res) => {
    const data = await getGlobalData();
    res.json(data);
});


// =====================
// UPLOAD POSTERS
// =====================
app.post('/upload', upload.array('images'), async (req, res) => {
    try {
        const data = await getGlobalData();

        const base64Images = req.files.map(file =>
            `data:${file.mimetype};base64,${file.buffer.toString('base64')}`
        );

        data.posters = base64Images;

        await data.save();

        res.json({
            success: true,
            posters: base64Images
        });
    } catch (error) {
        console.error("Upload error:", error);
        res.status(500).json({ success: false, error: error.message });
    }
});


// =====================
// SAVE NOTIFICATION
// =====================
app.post('/save-settings', async (req, res) => {

    const data = await getGlobalData();

    data.notification = req.body.notification;

    await data.save();

    res.json({
        success: true,
        message: "Notification updated globally"
    });
});


// =====================
// START SERVER
// =====================
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

module.exports = app;