# Session Management - Current Implementation

## Overview

Krishi Era uses **JWT (JSON Web Token) based authentication** with **localStorage** for session persistence.

## Architecture

```
┌─────────────┐         ┌─────────────┐         ┌─────────────┐
│   Browser   │         │   Backend   │         │  DynamoDB   │
│ (Frontend)  │         │   (API)     │         │ (Database)  │
└─────────────┘         └─────────────┘         └─────────────┘
      │                        │                        │
      │  1. Login Request      │                        │
      │───────────────────────>│                        │
      │   (email, password)    │                        │
      │                        │  2. Verify User        │
      │                        │───────────────────────>│
      │                        │                        │
      │                        │  3. User Data          │
      │                        │<───────────────────────│
      │                        │                        │
      │  4. JWT Token + User   │                        │
      │<───────────────────────│                        │
      │                        │                        │
      │  5. Store in           │                        │
      │     localStorage       │                        │
      │                        │                        │
      │  6. API Request        │                        │
      │───────────────────────>│                        │
      │   (with JWT token)     │                        │
      │                        │  7. Verify Token       │
      │                        │                        │
      │  8. Response           │                        │
      │<───────────────────────│                        │
```

## Components

### 1. **Frontend Storage (localStorage)**

**What is stored:**
```javascript
// JWT Token
localStorage.setItem('token', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...');

// User Information
localStorage.setItem('user', JSON.stringify({
  id: 'user-uuid',
  email: 'farmer@example.com',
  name: 'John Farmer',
  role: 'farmer'
}));
```

**Location:** Browser's localStorage (persistent across sessions)

**Lifetime:** Until explicitly removed (logout) or token expires

### 2. **JWT Token**

**Structure:**
```
Header.Payload.Signature
```

**Payload contains:**
```json
{
  "id": "user-uuid",
  "email": "farmer@example.com",
  "role": "farmer",
  "iat": 1234567890,  // Issued at
  "exp": 1234567890   // Expires at
}
```

**Expiration:** 7 days (configurable in `.env`)

**Secret:** Stored in backend `.env` file (`JWT_SECRET`)

### 3. **Request Flow**

**Every API request includes:**
```javascript
// Axios interceptor automatically adds token
headers: {
  'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
}
```

**Backend middleware verifies:**
```typescript
// backend/src/middleware/auth.ts
export const authenticate = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  const decoded = jwt.verify(token, JWT_SECRET);
  req.user = decoded;
  next();
};
```

## Authentication Flow

### Login Process

```javascript
// 1. User submits credentials
await apiService.login(email, password);

// 2. Backend verifies credentials
const user = await findUserByEmail(email);
const isValid = await bcrypt.compare(password, user.password);

// 3. Backend generates JWT token
const token = jwt.sign(
  { id: user.id, email: user.email, role: user.role },
  JWT_SECRET,
  { expiresIn: '7d' }
);

// 4. Frontend stores token and user
localStorage.setItem('token', token);
localStorage.setItem('user', JSON.stringify(user));

// 5. Redirect to role-based dashboard
navigate('/farmer'); // or /buyer, /transporter, etc.
```

### Registration Process (with OTP)

```javascript
// 1. User fills registration form
await apiService.sendOTP(userData);

// 2. Backend generates 6-digit OTP
const otp = Math.floor(100000 + Math.random() * 900000);

// 3. Backend stores OTP temporarily (in-memory)
otpStore.set(phone, { otp, expiresAt, userData });

// 4. User enters OTP
await apiService.verifyOTP(phone, otp);

// 5. Backend verifies OTP and creates user
const user = await createUser(userData);

// 6. Backend generates JWT token
const token = jwt.sign(...);

// 7. Frontend stores token and user
localStorage.setItem('token', token);
localStorage.setItem('user', JSON.stringify(user));
```

### Protected Routes

```typescript
// ProtectedRoute component checks authentication
const userStr = localStorage.getItem('user');

if (!userStr) {
  return <Navigate to="/login" />;
}

const user = JSON.parse(userStr);

if (!allowedRoles.includes(user.role)) {
  return <Navigate to={roleRoutes[user.role]} />;
}

return <>{children}</>;
```

### API Request Interceptor

```typescript
// Automatically adds token to every request
this.client.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

### API Response Interceptor

```typescript
// Handles 401 Unauthorized (expired/invalid token)
this.client.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);
```

### Logout Process

```javascript
// 1. User clicks logout
await apiService.logout();

// 2. Frontend removes token and user
localStorage.removeItem('token');
localStorage.removeItem('user');

// 3. Redirect to login
navigate('/login');
```

## Security Features

### ✅ Current Security Measures

1. **Password Hashing**
   - Uses bcrypt with salt rounds
   - Passwords never stored in plain text

2. **JWT Signing**
   - Tokens are cryptographically signed
   - Cannot be tampered with

3. **Token Expiration**
   - Tokens expire after 7 days
   - Automatic logout on expiration

4. **HTTPS Ready**
   - Secure token transmission (in production)

5. **Role-Based Access Control (RBAC)**
   - Routes protected by role
   - Backend endpoints verify roles

6. **OTP Verification**
   - Phone number verification during registration
   - 10-minute OTP expiration

### ⚠️ Current Limitations

1. **localStorage Vulnerabilities**
   - Susceptible to XSS attacks
   - No httpOnly protection

2. **No Token Refresh**
   - Token expires after 7 days
   - User must login again

3. **No Session Revocation**
   - Cannot invalidate tokens server-side
   - Logout only clears client-side

4. **No Multi-Device Management**
   - Cannot see active sessions
   - Cannot logout from other devices

5. **No Rate Limiting**
   - No protection against brute force
   - No login attempt tracking

## Session Lifetime

```
Login
  ↓
Token Created (expires in 7 days)
  ↓
User Active (token valid)
  ↓
7 Days Pass
  ↓
Token Expires
  ↓
Next API Request → 401 Unauthorized
  ↓
Auto Redirect to Login
```

## Configuration

### Backend (.env)

```bash
# JWT Configuration
JWT_SECRET=your_secret_key_here
JWT_EXPIRES_IN=7d  # 7 days, can be: 1h, 24h, 30d, etc.
```

### Token Expiration Options

```javascript
// Short-lived (1 hour)
JWT_EXPIRES_IN=1h

// Medium (1 day)
JWT_EXPIRES_IN=24h

// Long-lived (30 days)
JWT_EXPIRES_IN=30d

// Very long (1 year)
JWT_EXPIRES_IN=365d
```

## Debugging

### Check if User is Logged In

```javascript
// In browser console
localStorage.getItem('token');
localStorage.getItem('user');
```

### Decode JWT Token

```javascript
// In browser console
const token = localStorage.getItem('token');
const payload = JSON.parse(atob(token.split('.')[1]));
console.log(payload);
```

### Check Token Expiration

```javascript
const token = localStorage.getItem('token');
const payload = JSON.parse(atob(token.split('.')[1]));
const expiresAt = new Date(payload.exp * 1000);
console.log('Token expires at:', expiresAt);
console.log('Is expired:', Date.now() > payload.exp * 1000);
```

### Manual Logout

```javascript
// In browser console
localStorage.removeItem('token');
localStorage.removeItem('user');
window.location.href = '/login';
```

## Best Practices (Current Implementation)

✅ **What we're doing right:**
- Using JWT for stateless authentication
- Hashing passwords with bcrypt
- Token expiration
- Role-based access control
- Automatic token injection in requests
- Automatic logout on 401

⚠️ **What could be improved:**
- Move to httpOnly cookies (more secure than localStorage)
- Implement refresh tokens
- Add server-side session management
- Implement rate limiting
- Add CSRF protection
- Add session activity tracking
- Implement "Remember Me" functionality

## Recommended Improvements

### 1. **Refresh Token Pattern**

```javascript
// Short-lived access token (15 minutes)
accessToken: { expiresIn: '15m' }

// Long-lived refresh token (7 days)
refreshToken: { expiresIn: '7d' }

// Auto-refresh before expiration
if (tokenExpiresIn < 5 minutes) {
  const newToken = await refreshAccessToken();
}
```

### 2. **httpOnly Cookies**

```javascript
// Backend sets cookie
res.cookie('token', jwt, {
  httpOnly: true,  // Not accessible via JavaScript
  secure: true,    // HTTPS only
  sameSite: 'strict'
});

// Frontend doesn't need to handle token
// Browser automatically sends cookie
```

### 3. **Session Management**

```javascript
// Store active sessions in database
{
  userId: 'user-uuid',
  sessionId: 'session-uuid',
  token: 'jwt-token',
  deviceInfo: 'Chrome on Windows',
  lastActive: '2024-03-07T10:00:00Z',
  expiresAt: '2024-03-14T10:00:00Z'
}

// Allow users to view and revoke sessions
```

### 4. **Rate Limiting**

```javascript
// Limit login attempts
const attempts = await getLoginAttempts(email);
if (attempts > 5) {
  throw new Error('Too many login attempts. Try again in 15 minutes.');
}
```

## FAQ

**Q: Where is the session stored?**  
A: In browser's localStorage (token + user info) and verified on backend via JWT.

**Q: How long does a session last?**  
A: 7 days by default (configurable in `.env`).

**Q: What happens when token expires?**  
A: Next API request returns 401, user is automatically redirected to login.

**Q: Can I logout from all devices?**  
A: No, current implementation doesn't support this. Each device has independent token.

**Q: Is it secure?**  
A: Reasonably secure for development. For production, consider httpOnly cookies and refresh tokens.

**Q: Can I stay logged in forever?**  
A: No, tokens expire after 7 days. You'll need to login again.

**Q: What if someone steals my token?**  
A: They can access your account until token expires. Use HTTPS in production to prevent token theft.

**Q: How do I change session duration?**  
A: Edit `JWT_EXPIRES_IN` in `backend/.env` file.
