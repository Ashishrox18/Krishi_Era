# 🚀 Krishi Era - Quick Start Guide

## Start in 3 Steps

### 1️⃣ Start Backend
```bash
cd backend
npm start
```
✅ Backend running on `http://localhost:3000`

### 2️⃣ Start Ollama (Optional - for AI features)
```bash
ollama serve
```
✅ Ollama running on `http://localhost:11434`

**Note**: If Ollama is not running, AI features will use mock data automatically.

### 3️⃣ Start Frontend
```bash
npm run dev
```
✅ Frontend running on `http://localhost:5173`

---

## 🔐 Login

Open browser: `http://localhost:5173`

**Test Credentials**:
- Email: `test@example.com`
- Password: `password123`
- Role: `farmer`

---

## 🎯 Test Core Features

### 1. AI Selling Strategy
1. Login as farmer
2. Click "AI Selling Strategy" button on dashboard
3. Fill in crop details:
   - Crop Type: Wheat
   - Expected Yield: 100
   - Unit: Quintals
   - Harvest Month: March
4. Click "Get AI Strategy"
5. View recommendations with sell/store split

### 2. List Produce
1. Click "List Produce" button on dashboard
2. Fill in produce details:
   - Crop Type: Wheat
   - Quantity: 50
   - Unit: Quintals
   - Quality Grade: A
   - Price: 2200
   - Location: Your location
3. Click "List Produce"
4. View success message

### 3. My Listings
1. Click "My Listings" button on dashboard
2. View all your listed produce
3. See quotes count and best offers
4. Edit or delete listings

---

## 🛠️ Troubleshooting

### Backend Error
```bash
cd backend
npm install
npm start
```

### Frontend Error
```bash
npm install
npm run dev
```

### Ollama Not Working
```bash
# Install Ollama (if not installed)
# Visit: https://ollama.ai

# Start server
ollama serve

# Pull model
ollama pull llama3.1:8b
```

### Port Already in Use
```bash
# Kill process on port 3000 (backend)
lsof -ti:3000 | xargs kill -9

# Kill process on port 5173 (frontend)
lsof -ti:5173 | xargs kill -9
```

---

## 📚 Full Documentation

See `COMPLETE_SETUP_STATUS.md` for detailed information.

---

## ✅ You're Ready!

All features are working and ready to test. Enjoy exploring Krishi Era! 🌾
