# Login Guide - Krishi Era AI

## How to Access the Application

### 1. Start the Backend Server

```bash
cd backend
npm run dev
```

The backend will start on `http://localhost:3000`

### 2. Start the Frontend Application

In a new terminal, from the root directory:

```bash
npm run dev
```

The frontend will start on `http://localhost:5173`

### 3. Access the Login Page

Open your browser and go to: `http://localhost:5173/login`

## Test Account

You can login with the test account you created:

- **Email:** `test@example.com`
- **Password:** `password123`
- **Role:** Farmer

## Creating New Users

### Option 1: Using the UI

1. Go to `http://localhost:5173/login`
2. Click the "Register" tab
3. Fill in the form:
   - Full Name
   - Role (Farmer, Buyer, Transporter, Storage Provider, or Admin)
   - Phone Number (e.g., +919876543210)
   - Email
   - Password
4. Click "Register"

### Option 2: Using the API

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "newuser@example.com",
    "password": "password123",
    "name": "New User",
    "role": "buyer",
    "phone": "+919876543210"
  }'
```

## After Login

Once logged in, you'll be automatically redirected to your role-specific dashboard:

- **Farmer** → `/farmer` - Crop Planning, Harvest Management
- **Buyer** → `/buyer` - Procurement, Quality Inspection
- **Transporter** → `/transporter` - Route Optimization
- **Storage Provider** → `/storage` - Capacity Management
- **Admin** → `/admin` - System Monitoring

## Features

- **Auto-redirect:** After login, you're automatically sent to your role's dashboard
- **Persistent login:** Your session is saved in localStorage
- **Auto-logout:** If your token expires or is invalid, you'll be redirected to login
- **Logout button:** Click the "Logout" button in the header to sign out

## Troubleshooting

### Can't login?

1. Make sure the backend is running on port 3000
2. Check that you're using the correct email and password
3. Open browser console (F12) to see any error messages

### Backend not responding?

```bash
# Check if backend is running
curl http://localhost:3000/health

# Should return: {"status":"healthy","timestamp":"..."}
```

### Frontend not loading?

1. Make sure you ran `npm install` in the root directory
2. Check that port 5173 is not already in use
3. Try clearing browser cache and reloading

## API Endpoints

All API endpoints require authentication (except register and login):

- `POST /api/auth/register` - Create new user
- `POST /api/auth/login` - Login
- `POST /api/auth/refresh-token` - Refresh JWT token
- `GET /api/farmer/*` - Farmer endpoints
- `GET /api/buyer/*` - Buyer endpoints
- `GET /api/transporter/*` - Transporter endpoints
- `GET /api/storage/*` - Storage endpoints
- `GET /api/admin/*` - Admin endpoints
- `POST /api/ai/*` - AI services (crop recommendations, quality assessment, etc.)

## Security Notes

- Tokens expire after 7 days (configurable in `backend/.env`)
- Passwords are hashed with bcrypt
- JWT tokens are stored in localStorage
- All API requests include the token in the Authorization header
