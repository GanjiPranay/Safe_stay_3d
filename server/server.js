require("dotenv").config();
const mongoose = require("mongoose");
const express = require("express");
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const cors = require("cors");
const path = require("path");
const Report = require("./models/Report");
const authRoutes = require("./routes/auth");
const authMiddleware = require("./middleware/authMiddleware");
const adminMiddleware = require('./middleware/adminMiddleware');
const ownerMiddleware = require('./middleware/ownerMiddleware');
const User = require('./models/User');
const Accommodation = require('./models/Accommodation');
const CounterReport = require('./models/CounterReport');
const OTP = require('./models/OTP');
const { generateOTP, sendOTPEmail } = require('./utils/emailService');
const { cloudinary, upload } = require('./config/cloudinary');
const { updateAccommodationScore } = require('./utils/trustScore');

function escapeRegex(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

const app = express();

// Security headers
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

app.use(cors({
  origin: function(origin, callback) {
    const allowedOrigins = [
      'http://localhost:5173',
      'http://localhost:3000',
      process.env.FRONTEND_URL
    ].filter(Boolean);

    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Rate limiting — prevent brute force attacks
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { success: false, message: 'Too many attempts. Please try again after 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false
});

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { success: false, message: 'Too many requests. Please slow down.' },
  standardHeaders: true,
  legacyHeaders: false
});

// Apply rate limiters
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/signup', authLimiter);
app.use('/api/auth/register-owner', authLimiter);
app.use('/api/profile/password', authLimiter);
app.use('/api/', apiLimiter);

app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use("/api/auth", authRoutes);

app.get("/", (req, res) => {
  res.send("Backend Running Successfully");
});

app.get("/api/test", (req, res) => {
  res.json({ message: "Backend API working" });
});

// ============ IMAGE UPLOAD ROUTES ============

app.post('/api/upload', authMiddleware, upload.array('images', 5), (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ success: false, message: 'No files uploaded' });
    }

    const uploadedImages = req.files.map(file => {
      return {
        url: file.path,
        publicId: file.filename
      };
    });

    res.json({
      success: true,
      message: 'Images uploaded successfully',
      data: uploadedImages
    });
  } catch (error) {
    console.error('[Upload] Error:', error);
    res.status(500).json({ success: false, message: 'Error uploading images', error: error.message });
  }
});

app.delete('/api/upload/:publicId', authMiddleware, async (req, res) => {
  try {
    const { publicId } = req.params;
    const result = await cloudinary.uploader.destroy(publicId);

    if (result.result !== 'ok') {
      return res.status(400).json({ success: false, message: 'Error deleting image from cloud' });
    }

    res.json({ success: true, message: 'Image deleted successfully' });
  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({ success: false, message: 'Error deleting image', error: error.message });
  }
});

// ============ REPORT ROUTES ============

app.get('/api/reports/my-reports', authMiddleware, async (req, res) => {
  try {
    let page = parseInt(req.query.page) || 1;
    let limit = parseInt(req.query.limit) || 10;
    
    // Validate pagination
    if (page < 1) page = 1;
    if (limit < 1) limit = 10;
    if (limit > 100) limit = 100;

    const skip = (page - 1) * limit;

    const userReports = await Report.find({ user: req.user.id })
      .select('accommodationName accommodation issueType description images createdAt status upvotes upvotedBy user resolution verification')
      .populate('accommodation', 'name address city')
      .populate('resolution.resolvedBy', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await Report.countDocuments({ user: req.user.id });

    res.json({
      success: true,
      count: userReports.length,
      total,
      pages: Math.ceil(total / limit),
      currentPage: page,
      data: userReports
    });
  } catch (error) {
    console.error('MY REPORTS ERROR:', error.message);
    res.status(500).json({
      success: false,
      message: 'Error fetching your reports',
      error: error.message
    });
  }
});

app.get('/api/reports', async (req, res) => {
  try {
    const reports = await Report.find()
      .populate('accommodation', 'name address city')
      .sort({ createdAt: -1 })
      .lean();
    res.status(200).json({
      success: true,
      data: reports
    });
  } catch (error) {
    console.error("FETCH ERROR:", error.message);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// POST new report — NOW LINKS TO REGISTERED ACCOMMODATION
app.post('/api/reports', authMiddleware, async (req, res) => {
  try {
    const { accommodation, accommodationName, issueType, description, images } = req.body;

    // Must have either accommodation ID or name
    if (!accommodation && (!accommodationName || !accommodationName.trim())) {
      return res.status(400).json({ success: false, message: 'Please select or enter an accommodation name' });
    }

    if (!issueType || !issueType.trim()) {
      return res.status(400).json({ success: false, message: 'Issue type is required' });
    }

    if (!description || !description.trim()) {
      return res.status(400).json({ success: false, message: 'Description is required' });
    }

    const validIssueTypes = ['Food Safety', 'Water Quality', 'Hygiene', 'Security', 'Infrastructure'];
    if (!validIssueTypes.includes(issueType)) {
      return res.status(400).json({ success: false, message: 'Invalid issue type' });
    }

    if (description.length > 2000) {
      return res.status(400).json({ success: false, message: 'Description cannot exceed 2000 characters' });
    }

    // Validate and filter images
    let validatedImages = [];
    if (images && Array.isArray(images)) {
      validatedImages = images.filter(img => img && img.url && img.publicId);
    }

    // Resolve accommodation: if ID provided, validate it exists
    let accommodationId = null;
    let resolvedAccommodationName = accommodationName || '';

    if (accommodation) {
      if (!mongoose.Types.ObjectId.isValid(accommodation)) {
        return res.status(400).json({ success: false, message: 'Invalid accommodation ID' });
      }
      const accommodationDoc = await Accommodation.findById(accommodation);
      if (!accommodationDoc) {
        return res.status(404).json({ success: false, message: 'Selected accommodation not found. Please choose a registered accommodation.' });
      }
      accommodationId = accommodationDoc._id;
      resolvedAccommodationName = accommodationDoc.name;
    }

    const newReport = new Report({
      accommodationName: resolvedAccommodationName,
      accommodation: accommodationId,
      issueType,
      description,
      images: validatedImages,
      user: req.user.id
    });

    const saved = await newReport.save();

    // Update trust score if linked to accommodation
    if (accommodationId) {
      await updateAccommodationScore(Accommodation, Report, accommodationId);
    }

    res.status(201).json({
      success: true,
      message: 'Report submitted successfully',
      data: saved
    });
  } catch (error) {
    console.error('SAVE ERROR:', error);
    res.status(500).json({
      success: false,
      message: 'Error saving report',
      error: error.message
    });
  }
});

// UPDATE report
app.put('/api/reports/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { accommodation, accommodationName, issueType, description, images } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid report ID' });
    }

    const report = await Report.findById(id);

    if (!report) {
      return res.status(404).json({ success: false, message: 'Report not found' });
    }

    if (report.user.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'You can only edit your own reports' });
    }

    // If accommodation ID provided, validate and resolve
    if (accommodation) {
      if (!mongoose.Types.ObjectId.isValid(accommodation)) {
        return res.status(400).json({ success: false, message: 'Invalid accommodation ID' });
      }
      const accommodationDoc = await Accommodation.findById(accommodation);
      if (!accommodationDoc) {
        return res.status(404).json({ success: false, message: 'Selected accommodation not found' });
      }
      report.accommodation = accommodationDoc._id;
      report.accommodationName = accommodationDoc.name;
    } else if (accommodationName) {
      report.accommodationName = accommodationName;
    }

    if (issueType) report.issueType = issueType;
    if (description) report.description = description;
    if (images !== undefined) report.images = images;

    const updated = await report.save();

    // Recalculate trust score
    if (report.accommodation) {
      await updateAccommodationScore(Accommodation, Report, report.accommodation);
    }

    res.json({
      success: true,
      message: 'Report updated successfully',
      data: updated
    });
  } catch (error) {
    console.error('UPDATE ERROR:', error.message);
    res.status(500).json({
      success: false,
      message: 'Error updating report',
      error: error.message
    });
  }
});

// DELETE report
app.delete('/api/reports/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid report ID' });
    }

    const report = await Report.findById(id);

    if (!report) {
      return res.status(404).json({ success: false, message: 'Report not found' });
    }

    if (report.user.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'You can only delete your own reports' });
    }

    const accommodationId = report.accommodation;
    await Report.findByIdAndDelete(id);

    if (accommodationId) {
      await updateAccommodationScore(Accommodation, Report, accommodationId);
    }

    res.json({ success: true, message: 'Report deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error deleting report', error: error.message });
  }
});

// UPVOTE report
app.post('/api/reports/:id/upvote', authMiddleware, async (req, res) => {
  try {
    const reportId = req.params.id;
    
    if (!mongoose.Types.ObjectId.isValid(reportId)) {
      return res.status(400).json({ success: false, message: 'Invalid report ID' });
    }

    const userId = req.user.id;

    const report = await Report.findById(reportId);

    if (!report) {
      return res.status(404).json({ success: false, message: 'Report not found' });
    }

    if (report.user.toString() === userId) {
      return res.status(400).json({ success: false, message: 'Cannot upvote your own report' });
    }

    const alreadyUpvoted = report.upvotedBy.some(id => id.toString() === userId);

    if (alreadyUpvoted) {
      report.upvotedBy = report.upvotedBy.filter(id => id.toString() !== userId);
      report.upvotes = Math.max(0, report.upvotes - 1);
    } else {
      report.upvotedBy.push(userId);
      report.upvotes += 1;
    }

    await report.save();

    if (report.accommodation) {
      await updateAccommodationScore(Accommodation, Report, report.accommodation);
    }

    res.json({
      success: true,
      data: {
        upvotes: report.upvotes,
        hasUpvoted: !alreadyUpvoted
      }
    });
  } catch (error) {
    console.error('UPVOTE ERROR:', error.message);
    res.status(500).json({ success: false, message: 'Error processing upvote' });
  }
});

app.put('/api/reports/:id/verify', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { accepted, feedback, disputeReason } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid report ID' });
    }

    const report = await Report.findById(id);
    if (!report) {
      return res.status(404).json({ success: false, message: 'Report not found' });
    }

    if (report.user.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Only the original reporter can verify the fix' });
    }

    if (report.status !== 'resolved') {
      return res.status(400).json({ success: false, message: 'Report must be in resolved status to verify' });
    }

    if (accepted) {
      report.status = 'verified';
      report.verification = {
        isVerified: true,
        verifiedBy: req.user.id,
        verifiedAt: new Date(),
        feedback: feedback || ''
      };
    } else {
      if (!disputeReason || !disputeReason.trim()) {
        return res.status(400).json({ success: false, message: 'Dispute reason is required' });
      }
      report.status = 'disputed';
      report.verification = {
        isDisputed: true,
        disputeReason: disputeReason.trim(),
        verifiedBy: req.user.id,
        verifiedAt: new Date()
      };
    }

    await report.save();

    if (report.accommodation) {
      await updateAccommodationScore(Accommodation, Report, report.accommodation);
    }

    res.json({ success: true, message: accepted ? 'Resolution verified' : 'Resolution disputed', data: report });
  } catch (error) {
    console.error('VERIFY ERROR:', error);
    res.status(500).json({ success: false, message: 'Error verifying report', error: error.message });
  }
});

app.get('/api/reports/:id/resolution', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid report ID' });
    }

    const report = await Report.findById(id)
      .populate('resolution.resolvedBy', 'name')
      .populate('user', 'name')
      .lean();

    if (!report) {
      return res.status(404).json({ success: false, message: 'Report not found' });
    }

    res.json({ success: true, data: report });
  } catch (error) {
    console.error('GET RESOLUTION ERROR:', error);
    res.status(500).json({ success: false, message: 'Error fetching resolution details' });
  }
});

// ============ ADMIN ROUTES ============

app.get('/api/admin/stats', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const totalReports = await Report.countDocuments();
    const pendingReports = await Report.countDocuments({ status: 'pending' });
    const approvedReports = await Report.countDocuments({ status: 'approved' });
    const rejectedReports = await Report.countDocuments({ status: 'rejected' });
    const totalUsers = await User.countDocuments({ role: 'student' });
    const bannedUsers = await User.countDocuments({ isBanned: true });

    const issueStats = await Report.aggregate([
      { $group: { _id: '$issueType', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    res.json({
      success: true,
      data: {
        totalReports,
        pendingReports,
        approvedReports,
        rejectedReports,
        totalUsers,
        bannedUsers,
        issueStats
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching stats', error: error.message });
  }
});

app.get('/api/admin/reports', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const reports = await Report.find()
      .populate('user', 'name email')
      .populate('accommodation', 'name address city')
      .sort({ createdAt: -1 })
      .lean();

    res.json({ success: true, data: reports });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching reports', error: error.message });
  }
});

app.put('/api/admin/reports/:id/status', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid report ID' });
    }

    if (!['pending', 'approved', 'rejected'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }

    const report = await Report.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    ).populate('user', 'name email');

    if (!report) {
      return res.status(404).json({ success: false, message: 'Report not found' });
    }

    if (report.accommodation) {
      await updateAccommodationScore(Accommodation, Report, report.accommodation);
    }

    res.json({ success: true, message: `Report ${status}`, data: report });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error updating report', error: error.message });
  }
});

app.delete('/api/admin/reports/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid report ID' });
    }

    const report = await Report.findByIdAndDelete(id);

    if (!report) {
      return res.status(404).json({ success: false, message: 'Report not found' });
    }

    res.json({ success: true, message: 'Report deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error deleting report', error: error.message });
  }
});

app.get('/api/admin/users', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const users = await User.find({ role: 'student' })
      .select('-password')
      .sort({ createdAt: -1 })
      .lean();

    res.json({ success: true, data: users });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching users', error: error.message });
  }
});

app.put('/api/admin/users/:id/ban', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { isBanned } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid user ID' });
    }

    const user = await User.findByIdAndUpdate(
      id,
      { isBanned },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.json({
      success: true,
      message: isBanned ? 'User banned successfully' : 'User unbanned successfully',
      data: user
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error updating user', error: error.message });
  }
});

app.get('/api/admin/counter-reports', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const counterReports = await CounterReport.find()
      .populate('originalReport')
      .populate('accommodation', 'name')
      .populate('owner', 'name email')
      .sort({ createdAt: -1 })
      .lean();

    res.json({ success: true, data: counterReports });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching counter reports', error: error.message });
  }
});

app.put('/api/admin/counter-reports/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, adminNotes } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid counter report ID' });
    }

    if (!['accepted', 'rejected'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }

    const counterReport = await CounterReport.findByIdAndUpdate(
      id,
      { status, adminNotes, reviewedAt: new Date() },
      { new: true }
    );

    if (!counterReport) {
      return res.status(404).json({ success: false, message: 'Counter report not found' });
    }

    await Report.findByIdAndUpdate(counterReport.originalReport, {
      counterStatus: status,
      status: status === 'accepted' ? 'rejected' : undefined
    });

    res.json({ success: true, message: `Counter report ${status}`, data: counterReport });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error reviewing counter report', error: error.message });
  }
});

app.put('/api/admin/reports/:id/reopen', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid report ID' });
    }

    const report = await Report.findById(id);

    if (!report) {
      return res.status(404).json({ success: false, message: 'Report not found' });
    }

    if (report.status !== 'disputed') {
      return res.status(400).json({ success: false, message: 'Only disputed reports can be reopened' });
    }

    report.status = 'approved';
    report.resolution = {
      description: '',
      actionTaken: '',
      images: [],
      resolvedBy: null,
      resolvedAt: null
    };
    report.verification = {
      isVerified: false,
      isDisputed: false,
      verifiedBy: null,
      verifiedAt: null,
      feedback: '',
      disputeReason: ''
    };

    await report.save();

    if (report.accommodation) {
      await updateAccommodationScore(Accommodation, Report, report.accommodation);
    }

    res.json({ success: true, message: 'Report reopened for owner', data: report });
  } catch (error) {
    console.error('REOPEN ERROR:', error);
    res.status(500).json({ success: false, message: 'Error reopening report', error: error.message });
  }
});

// ============ OWNER ROUTES ============

app.post('/api/auth/register-owner', async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;

    const existingUser = await User.findOne({ email }).select('-password');
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Email already registered' });
    }

    const bcrypt = require('bcryptjs');
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      name,
      email,
      password: hashedPassword,
      role: 'owner',
      phone
    });

    await newUser.save();

    // Generate verification OTP for owner and send email
    const otp = generateOTP();
    const otpDoc = new OTP({
      email: newUser.email.toLowerCase(),
      otp,
      type: 'verification',
      expiresAt: new Date(Date.now() + 10 * 60 * 1000)
    });
    await otpDoc.save();

    const emailResult = await sendOTPEmail(newUser.email, otp, 'verification');
    if (!emailResult.success) {
      console.error('Owner verification email failed:', emailResult.error);
      // continue anyway, user can request resend from verify-email
    }

    res.status(201).json({
      success: true,
      message: 'Owner registered successfully. Please verify your email.',
      requiresVerification: true,
      email: newUser.email
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error registering owner', error: error.message });
  }
});

app.get('/api/owner/stats', authMiddleware, ownerMiddleware, async (req, res) => {
  try {
    const accommodations = await Accommodation.find({ owner: req.user.id });

    const totalAccommodations = accommodations.length;
    const totalRooms = accommodations.reduce((sum, a) => sum + a.totalRooms, 0);
    const occupiedRooms = accommodations.reduce((sum, a) => sum + a.occupiedRooms, 0);
    const occupancyRate = totalRooms > 0 ? Math.round((occupiedRooms / totalRooms) * 100) : 0;

    // Use accommodation IDs for accurate report counting
    const accommodationIds = accommodations.map(a => a._id);
    const totalReports = await Report.countDocuments({
      accommodation: { $in: accommodationIds }
    });
    const pendingCounters = await CounterReport.countDocuments({
      owner: req.user.id,
      status: 'pending'
    });

    res.json({
      success: true,
      data: {
        totalAccommodations,
        totalRooms,
        occupiedRooms,
        occupancyRate,
        totalReports,
        pendingCounters
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching stats', error: error.message });
  }
});

app.get('/api/owner/accommodations', authMiddleware, ownerMiddleware, async (req, res) => {
  try {
    const accommodations = await Accommodation.find({ owner: req.user.id }).sort({ createdAt: -1 }).lean();
    res.json({ success: true, data: accommodations });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching accommodations', error: error.message });
  }
});

app.post('/api/owner/accommodations', authMiddleware, ownerMiddleware, async (req, res) => {
  try {
    const { name, address, city, description, amenities, totalRooms, pricePerMonth, contactPhone, latitude, longitude } = req.body;

    // Parse latitude and longitude as numbers
    const parsedLat = latitude ? parseFloat(latitude) : null;
    const parsedLng = longitude ? parseFloat(longitude) : null;
    const validLat = parsedLat !== null && !isNaN(parsedLat) ? parsedLat : null;
    const validLng = parsedLng !== null && !isNaN(parsedLng) ? parsedLng : null;

    const newAccommodation = new Accommodation({
      name,
      address,
      city,
      description,
      amenities: amenities || [],
      totalRooms,
      pricePerMonth,
      contactPhone,
      owner: req.user.id,
      latitude: validLat,
      longitude: validLng,
      location: validLat && validLng ? {
        type: 'Point',
        coordinates: [validLng, validLat]
      } : undefined
    });

    const saved = await newAccommodation.save();
    res.status(201).json({ success: true, message: 'Accommodation added successfully', data: saved });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error adding accommodation', error: error.message });
  }
});

app.put('/api/owner/accommodations/:id', authMiddleware, ownerMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid ID' });
    }

    const accommodation = await Accommodation.findById(id);
    if (!accommodation) {
      return res.status(404).json({ success: false, message: 'Accommodation not found' });
    }

    if (accommodation.owner.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    // Parse lat/lng if provided in update
    if (req.body.latitude !== undefined || req.body.longitude !== undefined) {
      const parsedLat = req.body.latitude ? parseFloat(req.body.latitude) : null;
      const parsedLng = req.body.longitude ? parseFloat(req.body.longitude) : null;
      req.body.latitude = parsedLat !== null && !isNaN(parsedLat) ? parsedLat : null;
      req.body.longitude = parsedLng !== null && !isNaN(parsedLng) ? parsedLng : null;

      if (req.body.latitude && req.body.longitude) {
        req.body.location = {
          type: 'Point',
          coordinates: [req.body.longitude, req.body.latitude]
        };
      }
    }

    const updated = await Accommodation.findByIdAndUpdate(id, req.body, { new: true });
    res.json({ success: true, message: 'Accommodation updated', data: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error updating accommodation', error: error.message });
  }
});

app.delete('/api/owner/accommodations/:id', authMiddleware, ownerMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid ID' });
    }

    const accommodation = await Accommodation.findById(id);
    if (!accommodation) {
      return res.status(404).json({ success: false, message: 'Accommodation not found' });
    }

    if (accommodation.owner.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    await Accommodation.findByIdAndDelete(id);
    res.json({ success: true, message: 'Accommodation deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error deleting accommodation', error: error.message });
  }
});

// Get reports on owner's accommodations — USES ACCOMMODATION IDs
app.get('/api/owner/reports', authMiddleware, ownerMiddleware, async (req, res) => {
  try {
    const accommodations = await Accommodation.find({ owner: req.user.id }).lean();
    const accommodationIds = accommodations.map(a => a._id);

    const reports = await Report.find({
      $or: [
        { accommodation: { $in: accommodationIds } },
        { accommodationName: { $in: accommodations.map(a => a.name) } }
      ]
    })
    .populate('user', 'name email')
    .populate('accommodation', 'name address city')
    .sort({ createdAt: -1 })
    .lean();

    res.json({ success: true, data: reports });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching reports', error: error.message });
  }
});

app.put('/api/owner/reports/:id/resolve', authMiddleware, ownerMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid ID' });
    }

    const { description, actionTaken, images } = req.body;

    if (!description || description.length < 10) {
      return res.status(400).json({ success: false, message: 'Description must be at least 10 characters' });
    }
    if (!actionTaken) {
      return res.status(400).json({ success: false, message: 'Action taken is required' });
    }

    const report = await Report.findById(id);
    if (!report) {
      return res.status(404).json({ success: false, message: 'Report not found' });
    }

    // Verify ownership
    let accommodation = null;
    if (report.accommodation) {
      accommodation = await Accommodation.findOne({ _id: report.accommodation, owner: req.user.id });
    }
    if (!accommodation) {
      accommodation = await Accommodation.findOne({ name: report.accommodationName, owner: req.user.id });
    }

    if (!accommodation) {
      return res.status(403).json({ success: false, message: 'Not authorized to resolve this report' });
    }

    if (report.status !== 'approved' && report.status !== 'disputed') {
      return res.status(400).json({ success: false, message: 'Can only resolve approved or disputed reports' });
    }

    report.status = 'resolved';
    report.resolution = {
      description,
      actionTaken,
      images: images || [],
      resolvedBy: req.user.id,
      resolvedAt: new Date()
    };

    await report.save();

    if (report.accommodation) {
      await updateAccommodationScore(Accommodation, Report, report.accommodation);
    }

    res.json({ success: true, message: 'Report resolved successfully', data: report });
  } catch (error) {
    console.error('RESOLVE ERROR:', error);
    res.status(500).json({ success: false, message: 'Error resolving report', error: error.message });
  }
});

app.post('/api/owner/counter-report', authMiddleware, ownerMiddleware, async (req, res) => {
  try {
    const { reportId, reason, explanation, evidenceUrls, evidenceDescription } = req.body;

    const originalReport = await Report.findById(reportId);
    if (!originalReport) {
      return res.status(404).json({ success: false, message: 'Report not found' });
    }

    // Check by accommodation ID first, then by name
    let accommodation = null;
    if (originalReport.accommodation) {
      accommodation = await Accommodation.findOne({
        _id: originalReport.accommodation,
        owner: req.user.id
      });
    }
    if (!accommodation) {
      accommodation = await Accommodation.findOne({
        name: originalReport.accommodationName,
        owner: req.user.id
      });
    }

    if (!accommodation) {
      return res.status(403).json({ success: false, message: 'Not authorized to counter this report' });
    }

    const existingCounter = await CounterReport.findOne({ originalReport: reportId });
    if (existingCounter) {
      return res.status(400).json({ success: false, message: 'Counter report already submitted for this report' });
    }

    const counterReport = new CounterReport({
      originalReport: reportId,
      accommodation: accommodation._id,
      owner: req.user.id,
      reason,
      explanation,
      evidenceUrls: evidenceUrls || [],
      evidenceDescription
    });

    await counterReport.save();

    await Report.findByIdAndUpdate(reportId, {
      isCountered: true,
      counterStatus: 'pending'
    });

    res.status(201).json({ success: true, message: 'Counter report submitted successfully', data: counterReport });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error submitting counter report', error: error.message });
  }
});

app.get('/api/owner/counter-reports', authMiddleware, ownerMiddleware, async (req, res) => {
  try {
    const counterReports = await CounterReport.find({ owner: req.user.id })
      .populate('originalReport')
      .populate('accommodation', 'name')
      .sort({ createdAt: -1 })
      .lean();

    res.json({ success: true, data: counterReports });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching counter reports', error: error.message });
  }
});

app.put('/api/owner/accommodations/:id/occupancy', authMiddleware, ownerMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid ID' });
    }

    const { occupiedRooms } = req.body;

    const accommodation = await Accommodation.findById(id);
    if (!accommodation) {
      return res.status(404).json({ success: false, message: 'Accommodation not found' });
    }

    if (accommodation.owner.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    if (occupiedRooms > accommodation.totalRooms) {
      return res.status(400).json({ success: false, message: 'Occupied rooms cannot exceed total rooms' });
    }

    accommodation.occupiedRooms = occupiedRooms;
    await accommodation.save();

    res.json({ success: true, message: 'Occupancy updated', data: accommodation });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error updating occupancy', error: error.message });
  }
});

// ============ PROFILE ROUTES ============

app.get('/api/profile', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password').lean();

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const totalReports = await Report.countDocuments({ user: req.user.id });

    const upvoteResult = await Report.aggregate([
      { $match: { user: new mongoose.Types.ObjectId(req.user.id) } },
      { $group: { _id: null, totalUpvotes: { $sum: '$upvotes' } } }
    ]);

    const totalUpvotes = upvoteResult.length > 0 ? upvoteResult[0].totalUpvotes : 0;

    res.json({
      success: true,
      data: {
        ...user,
        totalReports,
        totalUpvotes
      }
    });
  } catch (error) {
    console.error('PROFILE ERROR:', error.message);
    res.status(500).json({ success: false, message: 'Error fetching profile' });
  }
});

app.put('/api/profile', authMiddleware, async (req, res) => {
  try {
    const { name } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Name is required' });
    }

    if (name.trim().length < 2) {
      return res.status(400).json({ success: false, message: 'Name must be at least 2 characters' });
    }

    if (name.trim().length > 50) {
      return res.status(400).json({ success: false, message: 'Name cannot exceed 50 characters' });
    }

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { name: name.trim() },
      { new: true }
    ).select('-password');

    res.json({ success: true, data: user });
  } catch (error) {
    console.error('PROFILE UPDATE ERROR:', error.message);
    res.status(500).json({ success: false, message: 'Error updating profile' });
  }
});

app.put('/api/profile/password', authMiddleware, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: 'Both current and new password are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'New password must be at least 6 characters' });
    }

    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const bcrypt = require('bcryptjs');
    const isMatch = await bcrypt.compare(currentPassword, user.password);

    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Current password is incorrect' });
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();

    res.json({ success: true, message: 'Password changed successfully' });
  } catch (error) {
    console.error('PASSWORD CHANGE ERROR:', error.message);
    res.status(500).json({ success: false, message: 'Error changing password' });
  }
});

// ============ OTP ROUTES ============

app.post('/api/otp/send-verification', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email || !email.trim()) {
      return res.status(400).json({ success: false, message: 'Email is required' });
    }

    const normalizedEmail = email.toLowerCase().trim();

    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return res.status(404).json({ success: false, message: 'No account found with this email' });
    }

    if (user.isVerified) {
      return res.status(400).json({ success: false, message: 'Email already verified' });
    }

    await OTP.deleteMany({ email: normalizedEmail, type: 'verification' });

    const otp = generateOTP();
    const otpDoc = new OTP({
      email: normalizedEmail,
      otp,
      type: 'verification',
      expiresAt: new Date(Date.now() + 10 * 60 * 1000)
    });

    await otpDoc.save();

    const emailResult = await sendOTPEmail(normalizedEmail, otp, 'verification');

    if (!emailResult.success) {
      return res.status(500).json({ success: false, message: 'Failed to send OTP email' });
    }

    res.json({ success: true, message: 'Verification OTP sent to your email' });
  } catch (error) {
    console.error('SEND VERIFICATION OTP ERROR:', error.message);
    res.status(500).json({ success: false, message: 'Error sending OTP' });
  }
});

app.post('/api/otp/verify-email', async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ success: false, message: 'Email and OTP are required' });
    }

    const normalizedEmail = email.toLowerCase().trim();

    const otpDoc = await OTP.findOne({
      email: normalizedEmail,
      type: 'verification',
      expiresAt: { $gt: new Date() }
    });

    if (!otpDoc) {
      return res.status(400).json({ success: false, message: 'OTP expired or invalid. Please request a new one.' });
    }

    if (otpDoc.otp !== otp.trim()) {
      return res.status(400).json({ success: false, message: 'Incorrect OTP. Please try again.' });
    }

    await User.findOneAndUpdate(
      { email: normalizedEmail },
      { isVerified: true }
    );

    await OTP.deleteMany({ email: normalizedEmail, type: 'verification' });

    res.json({ success: true, message: 'Email verified successfully! You can now login.' });
  } catch (error) {
    console.error('VERIFY EMAIL ERROR:', error.message);
    res.status(500).json({ success: false, message: 'Error verifying OTP' });
  }
});

app.post('/api/otp/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email || !email.trim()) {
      return res.status(400).json({ success: false, message: 'Email is required' });
    }

    const normalizedEmail = email.toLowerCase().trim();

    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return res.status(400).json({ success: false, message: 'No account found with this email' });
    }

    await OTP.deleteMany({ email: normalizedEmail, type: 'password-reset' });

    const otp = generateOTP();
    const otpDoc = new OTP({
      email: normalizedEmail,
      otp,
      type: 'password-reset',
      expiresAt: new Date(Date.now() + 10 * 60 * 1000)
    });

    await otpDoc.save();

    const emailResult = await sendOTPEmail(normalizedEmail, otp, 'password-reset');

    if (!emailResult.success) {
      return res.status(500).json({ success: false, message: 'Failed to send OTP email' });
    }

    res.json({ success: true, message: 'Password reset OTP sent to your email' });
  } catch (error) {
    console.error('FORGOT PASSWORD OTP ERROR:', error.message);
    res.status(500).json({ success: false, message: 'Error sending OTP' });
  }
});

app.post('/api/otp/reset-password', async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) {
      return res.status(400).json({ success: false, message: 'Emaiil, OTP, and new password are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
    }

    const normalizedEmail = email.toLowerCase().trim();

    const otpDoc = await OTP.findOne({
      email: normalizedEmail,
      type: 'password-reset',
      expiresAt: { $gt: new Date() }
    });

    if (!otpDoc) {
      return res.status(400).json({ success: false, message: 'OTP expired or invalid. Please request a new one.' });
    }

    if (otpDoc.otp !== otp.trim()) {
      return res.status(400).json({ success: false, message: 'Incorrect OTP. Please try again.' });
    }

    const bcrypt = require('bcryptjs');
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    await User.findOneAndUpdate(
      { email: normalizedEmail },
      { password: hashedPassword }
    );

    await OTP.deleteMany({ email: normalizedEmail, type: 'password-reset' });

    res.json({ success: true, message: 'Password reset successfully! You can now login with your new password.' });
  } catch (error) {
    console.error('RESET PASSWORD ERROR:', error.message);
    res.status(500).json({ success: false, message: 'Error resetting password' });
  }
});

// Apply rate limiting to OTP routes (prevent spam)
app.use('/api/otp/send-verification', authLimiter);
app.use('/api/otp/forgot-password', authLimiter);

// ============ ACCOMMODATION ROUTES ============
// IMPORTANT: Route order matters! Specific routes BEFORE parameterized routes

// 1. General list (no parameters)
app.get('/api/accommodations', async (req, res) => {
  try {
    const { search, city, type } = req.query;
    let query = {};

    if (search) {
      const escapedSearch = escapeRegex(search);
      query.$or = [
        { name: { $regex: escapedSearch, $options: 'i' } },
        { address: { $regex: escapedSearch, $options: 'i' } },
        { city: { $regex: escapedSearch, $options: 'i' } }
      ];
    }

    if (city) {
      query.city = { $regex: escapeRegex(city), $options: 'i' };
    }

    if (type) {
      query.type = type;
    }

    const accommodations = await Accommodation.find(query)
      .select('_id name address city description amenities totalRooms occupiedRooms pricePerMonth contactPhone type latitude longitude trustScore trustScoreLabel trustScoreColor totalReports isVerified riskScore createdAt')
      .sort({ trustScore: 1, createdAt: -1 })
      .lean();

    res.json({ success: true, data: accommodations });
  } catch (error) {
    console.error('GET ACCOMMODATIONS ERROR:', error.message);
    res.status(500).json({ success: false, message: 'Error fetching accommodations' });
  }
});

// 2. Dropdown list for report form (minimal data, specific route)
app.get('/api/accommodations/dropdown', async (req, res) => {
  try {
    const accommodations = await Accommodation.find({})
      .select('_id name address city type')
      .sort({ name: 1 })
      .lean();

    res.json({ success: true, data: accommodations });
  } catch (error) {
    console.error('GET DROPDOWN ACCOMMODATIONS ERROR:', error.message);
    res.status(500).json({ success: false, message: 'Error fetching accommodations' });
  }
});

// 3. Accommodations with location data for map (specific route)
app.get('/api/accommodations/with-location', async (req, res) => {
  try {
    console.log('=== FETCHING ACCOMMODATIONS WITH LOCATION ===');

    // Get ALL accommodations first
    const allAccommodations = await Accommodation.find({})
      .select('_id name address city latitude longitude trustScore trustScoreLabel totalReports type')
      .lean();

    console.log('Total accommodations in DB:', allAccommodations.length);

    if (allAccommodations.length === 0) {
      return res.json({ success: true, data: [], message: 'No accommodations registered yet' });
    }

    // Filter those with valid numeric coordinates
    const withValidLocation = allAccommodations.filter(acc => {
      const lat = parseFloat(acc.latitude);
      const lng = parseFloat(acc.longitude);
      return !isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0;
    });

    console.log('With valid location:', withValidLocation.length);

    // Normalize coordinates to ensure they are numbers
    const normalizedData = withValidLocation.map(acc => ({
      ...acc,
      latitude: parseFloat(acc.latitude),
      longitude: parseFloat(acc.longitude)
    }));

    // If none have location, return all with default coordinates
    if (normalizedData.length === 0) {
      const withDefaultLocation = allAccommodations.map(acc => ({
        ...acc,
        latitude: 20.5937,
        longitude: 78.9629,
        hasDefaultLocation: true
      }));

      return res.json({ success: true, data: withDefaultLocation });
    }

    res.json({ success: true, data: normalizedData });
  } catch (error) {
    console.error('GET ACCOMMODATIONS WITH LOCATION ERROR:', error);
    res.status(500).json({ success: false, message: 'Error fetching accommodations' });
  }
});

// 4. Single accommodation by ID (parameterized — MUST BE LAST)
app.get('/api/accommodations/:id', async (req, res) => {
  try {
    const accommodation = await Accommodation.findById(req.params.id).lean();
    if (!accommodation) {
      return res.status(404).json({ success: false, message: 'Accommodation not found' });
    }

    // Fetch approved reports for this accommodation
    const reports = await Report.find({
      $or: [
        { accommodation: req.params.id },
        { accommodationName: accommodation.name }
      ],
      status: 'approved'
    })
    .populate('user', 'name')
    .sort({ createdAt: -1 })
    .lean();

    res.json({
      success: true,
      data: {
        ...accommodation,
        reports
      }
    });
  } catch (error) {
    console.error('GET ACCOMMODATION BY ID ERROR:', error);
    res.status(500).json({ success: false, message: 'Error fetching accommodation' });
  }
});

// Recalculate trust score
app.post('/api/accommodations/:id/recalculate-score', authMiddleware, async (req, res) => {
  try {
    await updateAccommodationScore(Accommodation, Report, req.params.id);
    const acc = await Accommodation.findById(req.params.id)
      .select('trustScore trustScoreLabel trustScoreColor totalReports').lean();
    res.json({ success: true, data: acc });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error recalculating score' });
  }
});

// 404 handler for undefined routes
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.originalUrl} not found`
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('UNHANDLED ERROR:', err.message);
  console.error(err.stack);

  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map(e => e.message);
    return res.status(400).json({ success: false, message: messages.join(', ') });
  }

  if (err.name === 'CastError') {
    return res.status(400).json({ success: false, message: 'Invalid ID format' });
  }

  if (err.code === 11000) {
    return res.status(400).json({ success: false, message: 'Duplicate entry found' });
  }

  res.status(err.status || 500).json({
    success: false,
    message: process.env.NODE_ENV === 'production'
      ? 'Internal server error'
      : err.message
  });
});

const PORT = process.env.PORT || 5000;

console.log('DB config:', {
  MONGO_URI_defined: Boolean(process.env.MONGO_URI),
  EMAIL_USER_defined: Boolean(process.env.EMAIL_USER),
  EMAIL_PASS_defined: Boolean(process.env.EMAIL_PASS),
  PORT: process.env.PORT
});

mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB connected successfully");
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch(err => console.error("MongoDB connection error:", err));

