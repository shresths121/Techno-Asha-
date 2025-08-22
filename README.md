# Cureva

## Team Detail:

Team : Techno Asha

Member 1 : Shresth Sharma (Backend Developer)

Member 2 : Sanyyam Doye (Frontend Developer)

Member 3 : Aania Khan (Presenter)

Member 4 : Harshit Aryan Singh (Presentation Designer)

## Problem Statement

Cureva- A healthcare platform which bridges tech with treatment and helps people to get easy access to medical facilities.

## Project Description

Core Features

**AI-driven Doctor Matching**
Patients upload symptoms, test results, or prescriptions.
AI analyzes the data and instantly matches them to the most relevant specialist nearby, avoiding wrong referrals.

**Multi-language AI Assistance**
Chatbot that understands local dialects & translates symptoms into medical terms.

**Emergency SOS Button**
One-tap alert that shares patient’s location + medical summary with the nearest hospital.
Ensures faster emergency response in critical cases.

**Blockchain-powered Medical Security**
All reports, prescriptions, and histories are stored in tamper-proof encrypted blockchain records.
Builds trust by ensuring data privacy and authenticity.

**Government Scheme Integration**
Updates patients about schemes like Ayushman Bharat Card and eligibility criteria.
Provides real-time notifications on new government health benefits.

**Remote Health Camp Notifications**
Patients get pop-up alerts when free health camps are organized nearby.

Helps rural and low-income communities access free medical services.

**Awareness & Education**
Curated YouTube health awareness videos embedded in the platform.
Spreads preventive healthcare knowledge and lifestyle tips.

**Pharmacy & Lab Integration**
Patients can directly book lab tests and order medicines from within the platform.
Saves time and ensures end-to-end healthcare service.

⚙ Workflow
Patient registers/login → uploads symptoms/tests.
AI engine processes data → recommends verified doctors.
Doctor reviews patient info → provides prescription/treatment digitally.
Blockchain stores records securely → accessible anytime by patient & authorized doctors.
Patient receives treatment & feedback loop updates doctor trust score.
Emergency or awareness notifications (SOS, health camps, government schemes) keep patients engaged.

🏥 Modules
Patient Module – Registration, uploads, doctor suggestions, awareness updates, feedback.
Doctor Module – Verified registration, view cases, give prescriptions, receive ratings.
Hospital Module – Assign doctors, maintain centralized patient records, performance analytics.
Trust & Security Module – Blockchain storage + doctor authenticity score.
AI & Chatbot Module – Doctor matching, multilingual support, OCR for prescriptions.

## Features

- **User Authentication**: Secure JWT-based authentication for patients and doctors
- **Role-based Access Control**: Separate patient and doctor dashboards with appropriate permissions
- **AI Symptom Analysis**: Intelligent doctor recommendation based on symptom descriptions
- **Document Management**: Secure medical report upload and analysis
- **Appointment System**: Full appointment lifecycle with conflict detection
- **File Upload**: Secure document upload with validation and size limits
- **Rate Limiting**: Protection against abuse with configurable rate limits
- **Input Validation**: Comprehensive validation for all user inputs
- **Error Handling**: Robust error handling with appropriate HTTP status codes

## Tech Stack

- **Backend**: Node.js, Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (JSON Web Tokens)
- **File Upload**: Multer with validation
- **Security**: bcryptjs for password hashing, express-rate-limit for rate limiting
- **Frontend**: HTML, CSS, JavaScript (vanilla)

## Prerequisites

- Node.js (v14 or higher)
- MongoDB (local or cloud instance)
- npm or yarn

## Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd meditrust-backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Configuration**
   ```bash
   cp env.example .env
   ```
   
   Edit `.env` file with your configuration:
   ```env
   MONGO_URI=mongodb://localhost:27017/meditrust
   JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
   PORT=5000
   NODE_ENV=development
   FRONTEND_URL=http://localhost:3000
   ```

4. **Start the server**
   ```bash
   # Development mode
   npm run dev
   
   # Production mode
   npm start
   ```

## API Endpoints

### Authentication
- `POST /api/auth/patient/register` - Patient registration
- `POST /api/auth/patient/login` - Patient login
- `POST /api/auth/doctor/register` - Doctor registration
- `POST /api/auth/doctor/login` - Doctor login

### Doctors
- `GET /api/doctors` - List all doctors (public)
- `GET /api/doctors/me` - Get doctor profile (authenticated)
- `PATCH /api/doctors/me` - Update doctor profile
- `GET /api/doctors/:id` - Get specific doctor (public)
- `GET /api/doctors/for-patient/:id` - Get doctors for patient

### Patients
- `GET /api/patients/me` - Get patient profile (authenticated)
- `PATCH /api/patients/me` - Update patient profile
- `GET /api/patients/:id` - Get specific patient
- `GET /api/patients/me/doctors` - Get attached doctors

### Appointments
- `POST /api/appointments` - Create appointment (patient only)
- `GET /api/appointments/mine` - Get user's appointments
- `PATCH /api/appointments/:id/confirm` - Confirm appointment (doctor only)
- `PATCH /api/appointments/:id/cancel` - Cancel appointment (doctor only)
- `PATCH /api/appointments/:id/reschedule` - Reschedule appointment (doctor only)

### Documents
- `POST /api/documents/upload` - Upload medical report (patient only)
- `GET /api/documents/patient/:id/reports` - Get patient reports

### Issues
- `POST /api/issues/recommend` - Get doctor recommendations based on symptoms

### Health Check
- `GET /health` - Server health status

## Security Features

### Input Validation
- Email format validation
- Password strength requirements (minimum 6 characters)
- Age validation (0-150)
- File type and size validation
- Appointment date validation (future dates only)

### Rate Limiting
- 100 requests per 15 minutes per IP address
- Configurable limits for different endpoints

### File Upload Security
- File type restriction (JPEG, PNG, GIF, PDF only)
- File size limit (5MB)
- Filename sanitization
- Secure file storage

### Authentication & Authorization
- JWT-based authentication
- Role-based access control (patient/doctor)
- Password hashing with bcryptjs
- Token expiration (7 days)

## Frontend Integration

The backend is designed to work with the included HTML frontend files in the `hackathon/` directory. The frontend automatically detects the environment and configures the API base URL accordingly.

### Frontend Features
- Responsive design with modern UI
- Real-time form validation
- Toast notifications for user feedback
- Automatic token management
- Error handling and user-friendly messages

## Deployment

### Environment Variables for Production
```env
NODE_ENV=production
MONGO_URI=your-production-mongodb-uri
JWT_SECRET=your-production-jwt-secret
FRONTEND_URL=https://your-frontend-domain.com
PORT=5000
```

### Security Checklist for Production
- [ ] Change default JWT secret
- [ ] Use HTTPS in production
- [ ] Configure proper CORS origins
- [ ] Set up MongoDB with authentication
- [ ] Configure proper file upload limits
- [ ] Set up monitoring and logging
- [ ] Use environment-specific configurations

## Error Handling

The API returns appropriate HTTP status codes and error messages:

- `400` - Bad Request (validation errors)
- `401` - Unauthorized (invalid/missing token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found (resource doesn't exist)
- `409` - Conflict (appointment time conflict)
- `500` - Internal Server Error

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## UI/UX 
 Index page:
<img width="1919" height="910" alt="Screenshot 2025-08-22 104639" src="https://github.com/user-attachments/assets/6c44d1b9-991e-44eb-8f2d-df036f1fcc2c" />

 Patient Login: 
<img width="1917" height="907" alt="Screenshot 2025-08-22 104651" src="https://github.com/user-attachments/assets/456fe9c6-a83d-4b09-b431-72ebba2026c0" />

 Patient Dashboard:
<img width="1918" height="909" alt="Screenshot 2025-08-22 104719" src="https://github.com/user-attachments/assets/d2f2269c-7c9d-4eb0-b385-55e782c42f0e" />

 Doctor Login:
<img width="1919" height="909" alt="Screenshot 2025-08-22 104750" src="https://github.com/user-attachments/assets/ae350e69-e85d-407e-bc00-71d83392b842" />

 Doctor Dashboard:
 <img width="1919" height="906" alt="Screenshot 2025-08-22 104824" src="https://github.com/user-attachments/assets/33477498-1ce0-48d9-bc50-0bee4c979eb2" />

# Cureva 
Techno Asha-Cureva - A healthcare platform that bridges tech with treatment and helps people to get easy access to medical facilities.
>>>>>>> 178852a43feb78cfe7818ca921c90eb770351571
