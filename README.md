# 🎯 Student Accommodation Safety Platform

A production-quality full-stack web application designed to ensure safety and transparency in student accommodations (Hostels, PGs, Private Student Housing).

This platform enables **verified students** to report safety issues securely, helps future students make informed decisions, and creates accountability for accommodation providers.

![Platform Banner](https://img.shields.io/badge/Status-Production%20Ready-brightgreen) ![Version](https://img.shields.io/badge/Version-2.0.0-blue) ![License](https://img.shields.io/badge/License-MIT-yellow)

---

## 🚀 Why This Platform Exists

Students often choose accommodation based on:
- Fake or manipulated online reviews
- Broker influence
- Misleading advertisements
- Lack of verified safety data

This leads to real-world risks:
- Food poisoning incidents
- Poor sanitation
- Unsafe infrastructure
- Security threats
- Water quality issues etc..

This platform introduces **verified, accountable, student-driven safety intelligence**.

---

## ⭐ Core Features

### 🔐 Authentication & Security
- JWT-based Secure Authentication
- Password Hashing using bcrypt
- Role-Based User System (Student / Owner / Admin)
- Protected API Routes
- Profile Management with Password Change
- OTP Email Verification
- Forgot Password with OTP Reset
- Role-Based Dashboard Redirects

### 📊 Safety Reporting System
- Verified Student Reporting
- Reports Linked to Registered Accommodations Only (Dropdown Selection)
- Anonymous Public Identity ("Verified Resident")
- Categorized Incident Reporting:
  - Food Safety
  - Water Quality
  - Hygiene
  - Security
  - Infrastructure
- Cloudinary Image Evidence Upload
- Report Edit & Delete

### 🔧 Report Resolution System
- Complete Lifecycle: Report → Approve → Resolve → Verify/Dispute
- Owner resolves reports with action description and proof images
- Student verifies fix ("Yes, Issue is Fixed") or disputes ("No, Issue Persists")
- Admin can reopen disputed reports for owner to retry
- Trust score updates dynamically based on resolution outcomes
- 6 Report Statuses: Pending → Approved → Resolved → Verified / Disputed / Rejected
- In-Page Resolution Modal (Owner can resolve directly from accommodation detail)

### 🗺️ Interactive Map with Location Search
- OpenStreetMap Integration with colored safety markers
- 🟢 Green = Safe (Trust Score ≥ 80)
- 🟡 Yellow = Caution (Trust Score 50-79)
- 🔴 Red = Unsafe (Trust Score < 50)
- Location Search Bar (Search any city, area, landmark)
- GPS "My Location" Button for nearby accommodation discovery
- Radius Filter (2km, 5km, 10km, 20km, 50km)
- Nearby Accommodations List sorted by distance
- Fly-to animation when searching locations
- Embedded Map on Accommodation Detail Page
- Powered by OpenStreetMap Nominatim API (FREE, no API key needed)

### 📈 Dynamic Trust Score System
- 0-100 Trust Score per accommodation
- Automatically calculated based on:
  - Number and severity of reports
  - Report categories and upvotes
  - Resolution outcomes (verified fixes improve score)
  - Disputed resolutions increase penalties
- Color-coded badges (Safe / Caution / Unsafe)

### 👍 Upvote & Confirm System
- "I experienced this too" confirmation button
- Toggle upvote (click to confirm, click again to remove)
- Users cannot upvote their own reports
- Upvote count displayed on all report cards
- Optimistic UI updates for instant feedback

### 🧠 Accountability Architecture
- Reports linked to verified users (Prevents fake reviews)
- Reports linked to registered accommodations via ObjectId
- One user → Multiple reports tracking
- Upvote validation prevents fake confirmations
- Owner resolution with proof images
- Student verification creates accountability loop

### 📈 Dashboard System
- Real-time Report Data
- Safety Risk Classification
- Accommodation Risk Visibility
- Paginated Report Listing
- Error States with Retry Buttons
- Role-Based Dashboard Navigation

### 👤 User Profile (Role-Based UI)
- View profile info (name, email, role, member since)
- Edit display name
- Change password securely
- Student Profile:
  - Activity stats (total reports, upvotes received, issues resolved)
  - Blue/Indigo theme
  - Student-focused notifications
- Owner Profile:
  - Property stats (properties managed, avg trust score, resolution rate)
  - Emerald/Teal theme
  - Owner-focused notifications
  - Quick action buttons (View Dashboard, Add Property)

### 🏢 Owner Dashboard
- View reports against owned properties
- Resolve safety issues with proof
- Submit counter-evidence against reports
- Property management (Add/Edit/Delete accommodations)
- Edit Property Mode (Pre-filled form with existing data)
- Location picker with latitude/longitude
- Room occupancy tracking
- Role-Based Accommodation Detail View:
  - Owner sees: Edit buttons, Resolve buttons, Analytics
  - Student sees: Report button, Contact info, Living Here card

### 🛡 Admin Moderation Panel
- Review submitted reports with status filters
- Approve or reject reports
- View resolution details and proof
- Reopen disputed reports for owner to resolve again
- User management (Ban/Unban)
- Review counter reports
- Overview stats (Pending, Approved, Resolved, Verified, Disputed)

---

## 🛠 Tech Stack

### 🌐 Frontend
| Technology | Purpose |
|------------|---------|
| React 18 | UI Library |
| TypeScript | Type Safety |
| Vite | Build Tool |
| Tailwind CSS | Styling |
| React Router | Navigation |
| Context API | State Management |
| Leaflet | Interactive Maps |
| OpenStreetMap | Map Tiles & Geocoding |
| React Icons | Icon Library |
| date-fns | Date Formatting |

### ⚙ Backend
| Technology | Purpose |
|------------|---------|
| Node.js | Runtime Environment |
| Express.js | Web Framework |
| MongoDB Atlas | Cloud Database |
| Mongoose | ODM |
| JWT | Authentication |
| bcrypt | Password Security |
| Cloudinary | Image Storage |
| Nodemailer | Email OTP Service |

---

## 🧱 System Architecture

    Frontend (React + TypeScript + Leaflet Maps)
             ↓
    Auth Context + Protected Routes + Role-Based UI
             ↓
    Backend (Express REST API)
             ↓
    Auth Middleware (JWT Verification)
             ↓
    MongoDB Atlas (Users + Reports + Accommodations + CounterReports + OTPs)
             ↓
    Cloudinary (Image Storage) + Nominatim (Geocoding)

---

## 📂 Project Structure

    student-accommodation-safety-platform/
    │
    ├── client/                              # React Frontend
    │   ├── src/
    │   │   ├── components/
    │   │   │   ├── AccommodationMap.tsx      # Interactive map with search & GPS
    │   │   │   ├── ErrorBoundary.tsx         # Graceful error handling wrapper
    │   │   │   ├── Footer.tsx                # Footer (Home page only)
    │   │   │   ├── Header.tsx                # Navigation header
    │   │   │   ├── ImageGallery.tsx          # Gallery with empty state
    │   │   │   ├── ImageUpload.tsx           # Cloudinary upload component
    │   │   │   ├── ImageWithFallback.tsx     # Image with loading/error states
    │   │   │   ├── LocationPicker.tsx        # Lat/Lng picker for owners
    │   │   │   ├── ReportCard.tsx            # Report card with resolution UI
    │   │   │   ├── TrustScoreBadge.tsx       # Trust score color badge
    │   │   │   └── UpvoteButton.tsx          # Upvote toggle component
    │   │   │
    │   │   ├── pages/
    │   │   │   ├── AccommodationDetail.tsx   # Role-based accommodation view
    │   │   │   ├── AccommodationList.tsx     # Search & browse accommodations
    │   │   │   ├── AddProperty.tsx           # Add/Edit property (dual mode)
    │   │   │   ├── AdminDashboard.tsx        # Admin moderation panel
    │   │   │   ├── Dashboard.tsx             # Student dashboard
    │   │   │   ├── ForgotPassword.tsx        # Password reset with OTP
    │   │   │   ├── Home.tsx                  # Landing page with role-based CTA
    │   │   │   ├── Login.tsx                 # Student login
    │   │   │   ├── MyReports.tsx             # User reports with verification
    │   │   │   ├── OwnerDashboard.tsx        # Owner property management
    │   │   │   ├── OwnerLogin.tsx            # Owner login
    │   │   │   ├── OwnerRegister.tsx         # Owner registration
    │   │   │   ├── Profile.tsx               # Role-based profile (Student/Owner)
    │   │   │   ├── Register.tsx              # Student registration
    │   │   │   ├── ReportIncident.tsx        # Submit report form
    │   │   │   ├── ReportSafety.tsx          # Safety report page
    │   │   │   └── VerifyEmail.tsx           # Email OTP verification
    │   │   │
    │   │   ├── contexts/
    │   │   │   ├── AccommodationContext.tsx  # Accommodation state
    │   │   │   └── AuthContext.tsx           # Authentication state
    │   │   │
    │   │   ├── utils/
    │   │   │   └── cn.ts                     # Utility functions
    │   │   │
    │   │   ├── App.tsx                       # Router & conditional footer
    │   │   ├── index.css                     # Global styles
    │   │   └── main.tsx                      # App entry point
    │   │
    │   ├── package.json
    │   └── vite.config.ts
    │
    ├── server/                              # Express Backend
    │   ├── models/
    │   │   ├── Accommodation.js             # Accommodation schema with trust score
    │   │   ├── CounterReport.js             # Counter evidence schema
    │   │   ├── OTP.js                       # OTP verification schema
    │   │   ├── Report.js                    # Report schema with resolution
    │   │   └── User.js                      # User schema
    │   │
    │   ├── middleware/
    │   │   ├── adminMiddleware.js           # Admin role check
    │   │   ├── authMiddleware.js            # JWT verification
    │   │   └── ownerMiddleware.js           # Owner role check
    │   │
    │   ├── routes/
    │   │   └── auth.js                      # Authentication routes
    │   │
    │   ├── utils/
    │   │   ├── emailService.js              # Email sending service
    │   │   ├── emailTemplates.js            # Email HTML templates
    │   │   └── trustScore.js                # Trust score algorithm
    │   │
    │   ├── config/
    │   │   └── cloudinary.js                # Cloudinary configuration
    │   │
    │   ├── server.js                        # Express app & API routes
    │   ├── package.json
    │   ├── .env.example
    │   └── .gitignore
    │
    └── README.md

---

## 🔥 Implemented Features

### ✅ Authentication & Authorization
- User Signup & Login API
- JWT Token Generation & Verification
- Auth Middleware Protection
- Role-Based Access Control (Student / Owner / Admin)
- OTP Email Verification & Password Reset
- Role-Based Dashboard Redirects (Home page "Go to Dashboard" button)

### ✅ Data Models
- User Collection (MongoDB Atlas)
- Report Collection with Resolution & Verification Fields
- Accommodation Collection with Trust Scores
- Counter Report Collection
- OTP Collection

### ✅ Report System
- User → Report Relational Mapping
- Report → Accommodation Linking (ObjectId)
- Protected Report Submission (Dropdown Only)
- Cloudinary Image Evidence Upload
- My Reports with Pagination & Verification UI
- Report Edit & Delete
- Report Resolution System (Owner Resolves → Student Verifies)
- In-Page Resolution Modal

### ✅ Admin Features
- Admin Moderation Panel (Approve / Reject / Reopen)
- User Management (Ban/Unban)
- Overview Stats Dashboard

### ✅ Owner Features
- Owner Dashboard & Property Management
- Owner Resolution with Proof Images
- Add/Edit Property (Dual Mode)
- Role-Based Accommodation Detail View

### ✅ Search & Discovery
- Accommodation Search & Trust Score Ratings
- Interactive Map with OpenStreetMap
- Location Search (Nominatim Geocoding)
- GPS-based Nearby Accommodation Discovery
- Radius-based Filtering (2-50 km)
- Embedded Maps on Accommodation Detail

### ✅ Engagement
- Dynamic Trust Score Algorithm (0-100)
- Upvote & Confirm Reports ("I experienced this too")

### ✅ Profile System
- User Profile Page (Edit Name, Change Password, Stats)
- Role-Based Profile UI (Different stats for Student vs Owner)
- Owner Quick Actions (Dashboard, Add Property links)
- Notification Preferences

### ✅ UI/UX
- Image Error Handling (ImageWithFallback component)
- Error Boundaries for Graceful Crash Recovery
- Error States with Retry Buttons
- Footer only on Home Page
- Conditional UI based on User Role

### ✅ Security
- Input Validation & Regex Injection Prevention
- ObjectId Validation on All Routes
- Rate Limiting
- CORS Configuration

### ✅ Performance
- React.memo & useCallback optimizations
- Pagination
- .lean() for MongoDB queries
- Database Indexing

---

## 📡 API Endpoints

### Authentication
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | /api/auth/signup | Register new student | No |
| POST | /api/auth/login | Login user | No |
| POST | /api/auth/register-owner | Register new owner | No |

### OTP & Password Reset
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | /api/otp/send-verification | Send email verification OTP | No |
| POST | /api/otp/verify-email | Verify email with OTP | No |
| POST | /api/otp/forgot-password | Send password reset OTP | No |
| POST | /api/otp/reset-password | Reset password with OTP | No |

### Reports
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | /api/reports | Submit new report | Yes |
| GET | /api/reports | Get all reports | No |
| GET | /api/reports/my-reports | Get user reports (paginated) | Yes |
| PUT | /api/reports/:id | Update report | Yes |
| DELETE | /api/reports/:id | Delete report | Yes |
| POST | /api/reports/:id/upvote | Toggle upvote | Yes |
| PUT | /api/reports/:id/verify | Verify/dispute resolution | Yes |
| GET | /api/reports/:id/resolution | Get resolution details | Yes |

### Accommodations
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | /api/accommodations | List all (with search/filter) | No |
| GET | /api/accommodations/dropdown | Minimal list for forms | No |
| GET | /api/accommodations/with-location | Map data with coordinates | No |
| GET | /api/accommodations/:id | Single accommodation with reports | No |

### Profile
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | /api/profile | Get profile with stats | Yes |
| PUT | /api/profile | Update display name | Yes |
| PUT | /api/profile/password | Change password | Yes |
| PUT | /api/profile/notifications | Update notification prefs | Yes |

### Admin
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | /api/admin/stats | Dashboard statistics | Admin |
| GET | /api/admin/reports | Get all reports with details | Admin |
| PUT | /api/admin/reports/:id/status | Approve/Reject report | Admin |
| PUT | /api/admin/reports/:id/reopen | Reopen disputed report | Admin |
| DELETE | /api/admin/reports/:id | Delete report | Admin |
| GET | /api/admin/users | Get all users | Admin |
| PUT | /api/admin/users/:id/ban | Ban/Unban user | Admin |
| GET | /api/admin/counter-reports | Get all counter reports | Admin |
| PUT | /api/admin/counter-reports/:id | Accept/Reject counter report | Admin |

### Owner
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | /api/owner/stats | Owner dashboard stats | Owner |
| GET | /api/owner/accommodations | Get owned accommodations | Owner |
| POST | /api/owner/accommodations | Add new accommodation | Owner |
| PUT | /api/owner/accommodations/:id | Update accommodation | Owner |
| DELETE | /api/owner/accommodations/:id | Delete accommodation | Owner |
| PUT | /api/owner/accommodations/:id/occupancy | Update room occupancy | Owner |
| GET | /api/owner/reports | Get reports on owned properties | Owner |
| PUT | /api/owner/reports/:id/resolve | Resolve a report with proof | Owner |
| POST | /api/owner/counter-report | Submit counter evidence | Owner |
| GET | /api/owner/counter-reports | Get submitted counter reports | Owner |

### Images
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | /api/upload | Upload images (max 5) | Yes |
| DELETE | /api/upload/:publicId | Delete uploaded image | Yes |

---

## ⚡ Installation Guide

### Prerequisites
- Node.js (v16 or higher)
- npm
- MongoDB Atlas account
- Cloudinary account
- Git

### 1. Clone Repository

    git clone https://github.com/YOUR_USERNAME/student-accommodation-safety-platform.git
    cd student-accommodation-safety-platform

### 2. Backend Setup

    cd server
    npm install

Create server/.env file:

    MONGO_URI=your_mongodb_atlas_connection_string
    JWT_SECRET=your_jwt_secret_key_minimum_32_characters
    PORT=5000
    NODE_ENV=development
    CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
    CLOUDINARY_API_KEY=your_cloudinary_api_key
    CLOUDINARY_API_SECRET=your_cloudinary_api_secret
    EMAIL_USER=your_email@gmail.com
    EMAIL_PASS=your_email_app_password

Start backend:

    npm run dev

### 3. Frontend Setup

    cd client
    npm install

Create client/.env file:

    VITE_API_URL=http://localhost:5000

Start frontend:

    npm run dev

### 4. Access Application
- Frontend: http://localhost:5173
- Backend API: http://localhost:5000

---

## 🔄 Report Resolution Lifecycle

    1. 📝 Student files report → Status: PENDING
    2. ✅ Admin approves → Status: APPROVED
    3. 🔧 Owner resolves with proof → Status: RESOLVED
    4. 👨‍🎓 Student verifies:
       ├── ✅ "Yes, Fixed" → Status: VERIFIED (Trust score improves)
       └── ❌ "No, Persists" → Status: DISPUTED (Trust score worsens)
    5. 🔄 Admin reopens disputed → Status: APPROVED (Owner retries)

---

## 🗺️ Map Feature - How It Works

    Parent/Student opens map
             ↓
    Searches "Nampally, Hyderabad"
             ↓
    Map flies to location with markers
             ↓
    🟢 Safe  🟡 Caution  🔴 Unsafe
             ↓
    Selects radius (2-50 km)
             ↓
    Sees nearby accommodations sorted by distance
             ↓
    Clicks accommodation → Views trust score & reports
             ↓
    Makes informed decision ✅

---

## 👥 Role-Based Features

### 🎓 Student Experience
| Feature | Description |
|---------|-------------|
| Dashboard | View reports, safety alerts, nearby accommodations |
| Report Issues | File safety reports with evidence |
| My Reports | Track report status, verify resolutions |
| Profile | Blue theme, reports filed stats, confirmations received |
| Accommodation View | See contact info, report issues, "Living Here?" card |

### 🏢 Owner Experience
| Feature | Description |
|---------|-------------|
| Dashboard | Manage properties, view reports, resolve issues |
| Add Property | Register new accommodations with map location |
| Edit Property | Update existing property details |
| Resolve Reports | Submit proof of resolution directly from accommodation page |
| Profile | Emerald theme, properties managed, trust score, resolution rate |
| Accommodation View | See analytics, edit buttons, resolve buttons |

### 🛡️ Admin Experience
| Feature | Description |
|---------|-------------|
| Dashboard | Overview stats, moderation queue |
| Approve/Reject | Review and moderate reports |
| Reopen Reports | Allow owners to retry disputed resolutions |
| User Management | Ban/unban users |

---

## 🛡️ Security Features

- JWT Token Authentication with Expiry
- bcrypt Password Hashing (Salt Rounds: 10)
- Rate Limiting on Auth Routes (20 attempts/15 min)
- API Rate Limiting (100 requests/15 min)
- Helmet Security Headers
- CORS Configuration
- Input Validation & Sanitization
- Regex Injection Prevention
- ObjectId Validation on All Routes
- Role-Based Access Control
- Owner Ownership Verification

---

## 🚀 Future Roadmap

- [ ] Email Notifications (report status change, owner alerts)
- [ ] Accommodation Comparison Tool (side-by-side comparison)
- [ ] Export & Share Reports (PDF download, WhatsApp sharing)
- [ ] Report Analytics Dashboard (Charts, Trends, Heatmaps)
- [ ] Anonymous Commenting on Reports
- [ ] Real-time Updates (WebSocket)
- [ ] Mobile App (React Native)
- [ ] University Partnership Portal
- [ ] Multi-language Support
- [ ] Dark Mode

---

## 🌍 Real-World Impact

| Stakeholder | Benefit |
|-------------|---------|
| 👨‍🎓 Students | Make safer housing choices based on verified data |
| 👨‍👩‍👧 Parents | Search any location and verify accommodation safety |
| 🏢 Good Hostels | Build genuine reputation with authentic reviews |
| 🏛️ Society | Improve overall student housing standards |
| 🏫 Universities | Partner for student welfare initiatives |

---

## 📝 Recent Updates (v2.0.0)

### 🔧 Bug Fixes
- ✅ Fixed "Go to Dashboard" button redirecting wrong role to wrong dashboard
- ✅ Fixed AccommodationDetail page showing same UI for owner and student
- ✅ Fixed blank page when viewing accommodation details (missing component import)
- ✅ Fixed AddProperty page not supporting edit mode
- ✅ Fixed Footer showing on all pages instead of just Home
- ✅ Fixed Profile page showing same UI for owner and student

### 🆕 New Features
- ✅ Role-based AccommodationDetail view (Owner sees edit/resolve buttons)
- ✅ In-page resolution modal for owners
- ✅ Edit Property mode (pre-filled form with existing data)
- ✅ Role-based Profile UI (different stats for Student vs Owner)
- ✅ Owner Quick Actions in profile
- ✅ Embedded OpenStreetMap on accommodation detail
- ✅ Conditional footer rendering

### 🎨 UI Improvements
- ✅ Owner profile uses emerald/teal theme
- ✅ Student profile uses blue/indigo theme
- ✅ "Your Property" badge for owners on accommodation detail
- ✅ Role-specific notification messages

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create your feature branch (git checkout -b feature/AmazingFeature)
3. Commit your changes (git commit -m 'Add some AmazingFeature')
4. Push to the branch (git push origin feature/AmazingFeature)
5. Open a Pull Request

---

## 👨‍💻 Author

**Praneeth M**
Full Stack Developer | MERN Stack | Problem Solver

---

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

## ⭐ If You Like This Project

Give it a ⭐ on GitHub!

---

**Made with ❤️ for student safety and welfare**