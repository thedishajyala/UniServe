# UniServe 🚀

**AI-powered peer-to-peer campus delivery platform.** Students request food & essentials from hostels while peers earn through micro-gig deliveries.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React.js (Vite) |
| Backend | Node.js + Express |
| Database | MongoDB (Mongoose) |
| Real-time | Socket.io |
| Auth | JWT + bcrypt |

## Features

- 🔐 **University email-only login** (`@bmu.edu.in`)
- 👤 **Verified profiles** — name, enrollment, hostel, room number
- 📦 **InDrive-style order flow** — choose your own delivery partner
- 🧠 **AI Smart Matching** — scores partners by rating, proximity, response speed, success rate
- 💬 **Real-time chat** — Socket.io powered, with typing indicators
- 💸 **Tiered pricing** — ₹29 (parcels/Tuck/Maggie), ₹49 (other outlets)
- ⭐ **Ratings & reviews** — builds campus trust
- 📊 **Demand prediction** — peak hours, popular outlets, earnings tracking

## Campus Config

- **Outlets**: Kathi House, Dominos, Subway, Southern Stories, Maggie Hotspot, SnapEats, House of Chow, Tuck Shop BU  
- **Gates**: Gate 1, Gate 2, Gate 3 *(parcels only)*  
- **Boys Hostels**: C1–C15 | **Girls Hostels**: D1–D6

## Getting Started

### Backend
```bash
cd backend
npm install
# configure .env with MONGO_URI and JWT_SECRET
npm run dev
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

## AI Matching Formula

```
Score = (0.4 × rating) + (0.3 × proximity) + (0.2 × response_speed) + (0.1 × success_rate)
```

## Pricing Model

| Pickup | User Pays | Platform Cut | Partner Earns |
|--------|-----------|--------------|---------------|
| Gate 3 (Parcel) | ₹29 | ₹4 | ₹25 |
| Tuck Shop / Maggie Hotspot | ₹29 | ₹4 | ₹25 |
| Other Food Outlets | ₹49 | ₹9 | ₹40 |
