// server.js - Robust AgriXpress Backend (Node.js + Express + MongoDB/Mongoose + Twilio SMS)
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const bodyParser = require('body-parser');
const twilio = require('twilio');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const nodemailer = require('nodemailer');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(__dirname));
app.use('/uploads', express.static('uploads'));

// Create uploads directory if it doesn't exist
if (!fs.existsSync('uploads')) {
    fs.mkdirSync('uploads');
}

// Configure multer for image upload
const storage = multer.diskStorage({
    destination: function(req, file, cb) {
        cb(null, 'uploads/');
    },
    filename: function(req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: function(req, file, cb) {
        if (!file.originalname.match(/\.(jpg|jpeg|png)$/)) {
            return cb(new Error('Only image files are allowed!'), false);
        }
        cb(null, true);
    }
});

// Email configuration
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'your-email@gmail.com', // Replace with your email
        pass: 'your-app-password' // Replace with your app password
    }
});

// Generate verification token
function generateVerificationToken() {
    return crypto.randomBytes(32).toString('hex');
}

// Send verification email
async function sendVerificationEmail(email, roles, verificationToken) {
    const verificationLink = `http://localhost:3000/verify-email?token=${verificationToken}`;
    
    const mailOptions = {
        from: 'your-email@gmail.com',
        to: email,
        subject: 'Verify Your AgriXpress Roles',
        html: `
            <h2>Welcome to AgriXpress!</h2>
            <p>You have registered for the following roles:</p>
            <ul>
                ${roles.map(role => `<li>${role}</li>`).join('')}
            </ul>
            <p>Please click the link below to verify your email and activate your roles:</p>
            <a href="${verificationLink}">${verificationLink}</a>
            <p>This link will expire in 24 hours.</p>
        `
    };
    
    return transporter.sendMail(mailOptions);
}

// --- MongoDB Atlas Connection ---
const MONGO_URI = 'mongodb+srv://rajnipe:raj@agrixpress.ugt032u.mongodb.net/?retryWrites=true&w=majority&appName=AgriXpress';
mongoose.connect(MONGO_URI)
    .then(() => console.log('MongoDB connected'))
    .catch(err => console.error('MongoDB connection error:', err));

// --- Twilio Setup ---
const TWILIO_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_AUTH = process.env.TWILIO_AUTH_TOKEN;
const TWILIO_PHONE = '+15707553210'; // Replace with your Twilio phone number
const twilioClient = twilio(TWILIO_SID, TWILIO_AUTH);

// --- Mongoose Schemas & Models ---
const userSchema = new mongoose.Schema({
    fullName: { type: String, required: true, minlength: 2, maxlength: 100 },
    phone: { type: String, required: true, unique: true, match: /^\+?\d{8,15}$/ },
    email: { type: String, required: true, unique: true, match: /.+@.+\..+/ },
    passwordHash: { type: String, required: true },
    roles: { type: [String], required: true, enum: ['Farmer', 'Trader', 'Customer', 'Service Partner', 'Admin'], default: ['Customer'] },
    verifiedRoles: { type: [String] },
    activeRole: { type: String, enum: ['Farmer', 'Trader', 'Customer', 'Service Partner', 'Admin'] },
    orgFarm: { type: String, maxlength: 100 },
    isVerified: { type: Boolean, default: false },
    verificationToken: String,
    verificationExpires: Date,
    rating: { type: Number, min: 0, max: 5, default: 0 },
    ratingCount: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now }
});

const otpSchema = new mongoose.Schema({
    phone: { type: String, required: true, unique: true, match: /^\+?\d{8,15}$/ },
    otp: { type: String, required: true },
    expiresAt: { type: Date, required: true },
    attempts: { type: Number, default: 0 }
});

const produceSchema = new mongoose.Schema({
    farmerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    cropName: { type: String, required: true },
    quantity: { type: Number, required: true, min: 0 },
    unit: { type: String, required: true, enum: ['kg', 'tons', 'pieces'] },
    price: { type: Number, required: true, min: 0 },
    dispatchDate: { type: Date, required: true },
    image: { type: String },
    description: { type: String, maxlength: 500 },
    status: { type: String, enum: ['available', 'pending', 'sold'], default: 'available' },
    createdAt: { type: Date, default: Date.now }
});

const orderSchema = new mongoose.Schema({
    buyerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    sellerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    produceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Produce', required: true },
    quantity: { type: Number, required: true, min: 0 },
    totalPrice: { type: Number, required: true, min: 0 },
    deliveryAddress: { type: String, required: true },
    status: { type: String, enum: ['pending', 'confirmed', 'in_transit', 'delivered', 'cancelled'], default: 'pending' },
    createdAt: { type: Date, default: Date.now }
});

const fleetSchema = new mongoose.Schema({
    servicePartnerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    vehicleType: { type: String, required: true, enum: ['truck', 'van', 'pickup'] },
    capacity: { type: Number, required: true, min: 0 },
    status: { type: String, enum: ['available', 'busy', 'maintenance'], default: 'available' },
    rating: { type: Number, min: 0, max: 5 },
    totalTrips: { type: Number, default: 0 }
});

const jobSchema = new mongoose.Schema({
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },
    fleetId: { type: mongoose.Schema.Types.ObjectId, ref: 'Fleet' },
    pickupLocation: { type: String, required: true },
    dropLocation: { type: String, required: true },
    status: { type: String, enum: ['pending', 'assigned', 'in_progress', 'completed'], default: 'pending' },
    price: { type: Number, required: true, min: 0 },
    createdAt: { type: Date, default: Date.now }
});

const disputeSchema = new mongoose.Schema({
    reporterId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    againstId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },
    reason: { type: String, required: true },
    description: { type: String, required: true },
    status: { type: String, enum: ['open', 'under_review', 'resolved'], default: 'open' },
    resolution: { type: String },
    createdAt: { type: Date, default: Date.now }
});

const aiPredictionSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    soilType: { type: String, required: true },
    season: { type: String, required: true },
    suggestedCrops: [{
        cropName: String,
        confidence: Number,
        expectedYield: Number,
        marketDemand: String
    }],
    createdAt: { type: Date, default: Date.now }
});

// --- Initialize Models ---
const User = mongoose.model('User', userSchema);
const OTP = mongoose.model('OTP', otpSchema);
const Produce = mongoose.model('Produce', produceSchema);
const Order = mongoose.model('Order', orderSchema);
const Fleet = mongoose.model('Fleet', fleetSchema);
const Job = mongoose.model('Job', jobSchema);
const Dispute = mongoose.model('Dispute', disputeSchema);
const AIPrediction = mongoose.model('AIPrediction', aiPredictionSchema);

// --- Helper: Validate email ---
function isValidEmail(email) {
    return /.+@.+\..+/.test(email);
}

// --- JWT middleware for protected routes ---
const JWT_SECRET = 'your-secret-key';

function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) return res.status(401).json({ error: 'Access denied' });
    
    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.status(403).json({ error: 'Invalid token' });
        req.user = user;
        next();
    });
}

// --- OTP SEND (Twilio SMS, max 3 per 5 min) ---
app.post('/api/send-otp', async (req, res) => {
    const { phone } = req.body;
    if (!/^\+?\d{8,15}$/.test(phone)) return res.status(400).json({ error: 'Invalid phone' });
    // Rate limit: max 3 OTPs per 5 minutes
    const now = new Date();
    const minAgo = new Date(now.getTime() - 5 * 60 * 1000);
    const recent = await OTP.findOne({ phone, expiresAt: { $gt: minAgo } });
    if (recent && recent.attempts >= 3) {
        return res.status(429).json({ error: 'Too many OTP requests. Try again later.' });
    }
    // Generate a random 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);
    try {
        await OTP.findOneAndUpdate(
            { phone },
            { otp, expiresAt, $inc: { attempts: 1 } },
            { upsert: true, new: true, setDefaultsOnInsert: true }
        );
        // Send OTP via Twilio
        await twilioClient.messages.create({
            body: `Your AgriXpress OTP is: ${otp}`,
            from: TWILIO_PHONE,
            to: phone // Use the phone as entered (with + if present)
        });
        res.json({ success: true, message: 'OTP sent to your phone!' });
    } catch (err) {
        console.error('Twilio/DB error:', err);
        res.status(500).json({ error: err.message || 'DB or SMS error' });
    }
});

// --- OTP VERIFY (max 5 attempts, then block) ---
app.post('/api/verify-otp', async (req, res) => {
    const { phone, otp } = req.body;
    try {
        const record = await OTP.findOne({ phone });
        if (!record) return res.status(400).json({ error: 'OTP not found' });
        if (record.expiresAt < new Date()) {
            await OTP.deleteOne({ phone });
            return res.status(400).json({ error: 'OTP expired' });
        }
        if (record.attempts >= 5) {
            await OTP.deleteOne({ phone });
            return res.status(429).json({ error: 'Too many verification attempts. Request a new OTP.' });
        }
        if (record.otp !== otp) {
            await OTP.updateOne({ phone }, { $inc: { attempts: 1 } });
            return res.status(400).json({ error: 'Incorrect OTP' });
        }
        await OTP.deleteOne({ phone }); // OTP can only be used once
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: 'DB error' });
    }
});

// Signup endpoint with email verification
app.post('/api/signup', async (req, res) => {
    const { fullName, phone, email, password, roles, orgFarm } = req.body;
    
    try {
        // Validate roles
        if (!roles || !Array.isArray(roles) || roles.length === 0) {
            return res.status(400).json({ error: 'Please select at least one role' });
        }

        // Check if user exists
        const existingUser = await User.findOne({ $or: [{ phone }, { email }] });
        if (existingUser) {
            return res.status(409).json({ error: 'User already exists' });
        }

        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);
        const verificationToken = generateVerificationToken();
        
        const user = new User({
            fullName,
            phone,
            email,
            passwordHash,
            roles,
            verifiedRoles: [],
            activeRole: roles[0],
            orgFarm,
            verificationToken,
            verificationExpires: Date.now() + 24 * 60 * 60 * 1000 // 24 hours
        });
        
        await user.save();
        
        // Send verification email
        await sendVerificationEmail(email, roles, verificationToken);
        
        res.json({ 
            success: true, 
            message: 'Please check your email to verify your roles'
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Email verification endpoint
app.post('/api/verify-email', async (req, res) => {
    const { token } = req.body;
    try {
        const user = await User.findOne({ verificationToken: token });
        if (!user) {
            return res.status(400).json({ error: 'Invalid verification token' });
        }

        if (Date.now() > user.verificationExpires) {
            return res.status(400).json({ error: 'Verification token has expired' });
        }

        // Update user verification status
        user.isVerified = true;
        user.verifiedRoles = user.roles;
        user.verificationToken = undefined;
        user.verificationExpires = undefined;
        await user.save();

        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Update login endpoint to check verification and return roles
app.post('/api/login', async (req, res) => {
    const { identifier, password } = req.body;
    
    try {
        // Find user by email or phone
        const user = await User.findOne({
            $or: [
                { email: identifier },
                { phone: identifier }
            ]
        });

        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Verify password
        const isMatch = await bcrypt.compare(password, user.passwordHash);
        if (!isMatch) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Check if email is verified
        if (!user.isVerified) {
            return res.status(403).json({ 
                error: 'Please verify your email first',
                verificationPending: true 
            });
        }

        // Generate JWT token
        const token = jwt.sign(
            { id: user._id, roles: user.verifiedRoles },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({
            success: true,
            token,
            user: {
                id: user._id,
                fullName: user.fullName,
                roles: user.verifiedRoles,
                activeRole: user.activeRole || user.verifiedRoles[0]
            }
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Get user roles endpoint
app.get('/api/user/roles', authenticateToken, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('verifiedRoles activeRole');
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.json({ success: true, roles: user.verifiedRoles, activeRole: user.activeRole });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Resend verification email
app.post('/api/resend-verification', async (req, res) => {
    const { email } = req.body;
    
    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        if (user.isVerified) {
            return res.status(400).json({ error: 'Email already verified' });
        }
        
        const verificationToken = generateVerificationToken();
        user.verificationToken = verificationToken;
        user.verificationExpires = Date.now() + 24 * 60 * 60 * 1000;
        
        await user.save();
        await sendVerificationEmail(email, user.roles, verificationToken);
        
        res.json({ 
            success: true, 
            message: 'Verification email sent' 
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// --- Fetch available roles for email/phone (for login page role selection) ---
app.post('/api/fetch-roles', async (req, res) => {
    const { identifier, email, phone } = req.body;
    let query = {};
    if (identifier) {
        if (/^\+?\d{8,15}$/.test(identifier)) {
            query.phone = identifier;
        } else if (/.+@.+\..+/.test(identifier)) {
            query.email = identifier;
        }
    } else if (email) {
        query.email = email;
    } else if (phone) {
        query.phone = phone;
    }
    if (!Object.keys(query).length) {
        return res.status(400).json({ error: 'Missing identifier, email, or phone' });
    }
    try {
        const user = await User.findOne(query);
        if (!user) return res.status(404).json({ error: 'User not found' });
        res.json({
            success: true,
            roles: user.roles || [],
            verifiedRoles: user.verifiedRoles || [],
            activeRole: user.activeRole || null
        });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

// --- Get current user data ---
app.get('/api/user', authenticateToken, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-passwordHash');
        if (!user) return res.status(404).json({ error: 'User not found' });
        res.json(user);
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

// --- Switch Role ---
app.post('/api/switch-role', authenticateToken, async (req, res) => {
    const { newRole } = req.body;
    if (!newRole) return res.status(400).json({ error: 'Missing parameters' });
    try {
        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ error: 'User not found' });
        if (!user.verifiedRoles.includes(newRole)) return res.status(403).json({ error: 'Role not assigned to user' });
        user.activeRole = newRole;
        await user.save();
        res.json({ success: true, activeRole: user.activeRole });
    } catch (err) {
        res.status(500).json({ error: 'DB error' });
    }
});

// --- Farmer Dashboard APIs ---
app.post('/api/produce/create', authenticateToken, async (req, res) => {
    const { cropName, quantity, unit, price, dispatchDate, image, description } = req.body;
    try {
        const produce = new Produce({
            farmerId: req.user.id,
            cropName,
            quantity,
            unit,
            price,
            dispatchDate,
            image,
            description
        });
        await produce.save();
        res.json({ success: true, produce });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/produce/farmer/:farmerId', authenticateToken, async (req, res) => {
    try {
        const listings = await Produce.find({ farmerId: req.params.farmerId });
        res.json({ success: true, listings });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/orders/farmer/:farmerId', authenticateToken, async (req, res) => {
    try {
        const orders = await Order.find({ sellerId: req.params.farmerId })
            .populate('buyerId', 'fullName phone')
            .populate('produceId');
        res.json({ success: true, orders });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- Trader/Customer Dashboard APIs ---
app.get('/api/produce/search', authenticateToken, async (req, res) => {
    const { cropName, minPrice, maxPrice } = req.query;
    try {
        let query = { status: 'available' };
        if (cropName) query.cropName = new RegExp(cropName, 'i');
        if (minPrice || maxPrice) {
            query.price = {};
            if (minPrice) query.price.$gte = minPrice;
            if (maxPrice) query.price.$lte = maxPrice;
        }

        const produce = await Produce.find(query).populate('farmerId', 'fullName rating');
        res.json({ success: true, produce });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/orders/create', authenticateToken, async (req, res) => {
    const { produceId, quantity, deliveryAddress } = req.body;
    try {
        const produce = await Produce.findById(produceId);
        if (!produce) return res.status(404).json({ error: 'Produce not found' });
        if (produce.status !== 'available') return res.status(400).json({ error: 'Produce not available' });
        if (produce.quantity < quantity) return res.status(400).json({ error: 'Insufficient quantity' });

        const order = new Order({
            buyerId: req.user.id,
            sellerId: produce.farmerId,
            produceId,
            quantity,
            totalPrice: produce.price * quantity,
            deliveryAddress
        });
        await order.save();

        // Update produce quantity and status
        produce.quantity -= quantity;
        if (produce.quantity === 0) produce.status = 'sold';
        await produce.save();

        res.json({ success: true, order });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- Service Partner Dashboard APIs ---
app.post('/api/fleet/register', authenticateToken, async (req, res) => {
    const { vehicleType, capacity } = req.body;
    try {
        const fleet = new Fleet({
            servicePartnerId: req.user.id,
            vehicleType,
            capacity
        });
        await fleet.save();
        res.json({ success: true, fleet });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/jobs/available', authenticateToken, async (req, res) => {
    try {
        const jobs = await Job.find({ 
            status: 'pending'
        }).populate('orderId');
        res.json({ success: true, jobs });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- Admin Dashboard APIs ---
app.get('/api/admin/users', authenticateToken, async (req, res) => {
    try {
        const users = await User.find({}, '-passwordHash');
        res.json({ success: true, users });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/admin/verify-user', authenticateToken, async (req, res) => {
    const { userId, isVerified } = req.body;
    try {
        const user = await User.findByIdAndUpdate(
            userId,
            { isVerified },
            { new: true }
        );
        res.json({ success: true, user });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/admin/disputes', authenticateToken, async (req, res) => {
    try {
        const disputes = await Dispute.find()
            .populate('reporterId', 'fullName')
            .populate('againstId', 'fullName')
            .populate('orderId');
        res.json({ success: true, disputes });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- AI Crop Prediction API ---
app.post('/api/ai/predict-crops', authenticateToken, async (req, res) => {
    const { soilType, season } = req.body;
    try {
        // In a real app, this would call an AI service
        // For demo, returning mock predictions
        const prediction = new AIPrediction({
            userId: req.user.id,
            soilType,
            season,
            suggestedCrops: [
                { cropName: 'Wheat', confidence: 0.85, expectedYield: 4.5, marketDemand: 'High' },
                { cropName: 'Rice', confidence: 0.75, expectedYield: 5.0, marketDemand: 'Medium' }
            ]
        });
        await prediction.save();
        res.json({ success: true, prediction });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Image upload endpoint
app.post('/api/upload-image', authenticateToken, upload.single('image'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No image file provided' });
    }
    const imageUrl = `/uploads/${req.file.filename}`;
    res.json({ success: true, imageUrl });
});

// --- Start Server ---
app.listen(PORT, () => {
    console.log(`AgriXpress backend running at http://localhost:${PORT}`);
});
