const express = require('express');
const multer = require('multer');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

const app = express();
require('dotenv').config();

const PORT = process.env.PORT || 5000;

mongoose.connect('mongodb+srv://<huzaifajavid7532>:<huzaifa7532>@cluster.jfqgf4b.mongodb.net/');


// =====================
// CONFIG (OPTION 2 BASE URL SYSTEM)
// =====================
const isProduction = process.env.NODE_ENV === 'production';

const BASE_URL = isProduction
    ? "https://www.miazishop.info"
    : "http://localhost:5000";


// =====================
// MIDDLEWARE
// =====================
app.use(express.json());

// CORS (production-safe)
app.use(cors({
    origin: [
        "http://localhost:3000",
        "http://127.0.0.1:5500",
        "https://www.miazishop.info"
    ]
}));


// serve uploads publicly
app.use('/uploads', express.static('uploads'));


// =====================
// MONGODB
// =====================
mongoose.connect('mongodb://127.0.0.1:27017/miazi');


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
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

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

    const data = await getGlobalData();

    const imageUrls = req.files.map(file =>
        `${BASE_URL}/uploads/${file.filename}`
    );

    data.posters = imageUrls;

    await data.save();

    res.json({
        success: true,
        posters: imageUrls
    });
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