# 🚀 UniServe: Peer-to-Peer Campus Delivery Engine
[![React](https://img.shields.io/badge/React-19.0-61DAFB?logo=react)](https://reactjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-20.x-339933?logo=node.js)](https://nodejs.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?logo=mongodb)](https://www.mongodb.com/)
[![Socket.io](https://img.shields.io/badge/Socket.io-Real--time-010101?logo=socket.io)](https://socket.io/)
[![Razorpay](https://img.shields.io/badge/Razorpay-Payment-02042B?logo=razorpay)](https://razorpay.com/)

**UniServe** is a high-performance, real-time delivery platform engineered specifically for university ecosystems. It facilitates a peer-to-peer economy where students coordinate localized deliveries—from food outlets to campus gates—leveraging real-time tracking, secure payments, and an AI-driven matching engine.

---

## 🏛️ Technical Architecture
UniServe is built on a resilient **MERN** stack with a focus on low-latency state synchronization.

### 📡 Real-time Communication Layer (Socket.io)
The app uses a dual-room socket architecture to ensure messages and location updates never miss a beat:
-   **User-Specific Rooms (`user_{id}`)**: For global notifications across the app (Incoming requests, general alerts).
-   **Order-Specific Rooms (`order_{id}`)**: Isolated data lanes for real-time chat and high-frequency coordinate broadcasting during "Active Delivery."

### 🛡️ Smart Hybrid Payment System (Razorpay SDK)
Implemented a custom "Smart Payment" logic to balance user convenience with partner security:
-   **Outlet (Food) Orders**: Force Online Payment via Razorpay. *Rationale*: Protects delivery partners from high-value out-of-pocket costs and no-shows.
-   **Parcel/Gate Orders**: Flexible selection between **Online (Prepaid)** and **Cash (Postpaid)**.
-   **Mid-Chat Settlement**: Logic that allows users who chose Cash to securely switch to Online payment during the active delivery phase.

### 🗺️ Geolocation Tracking Engine (Leaflet.js)
Leverages the browser's `navigator.geolocation` API with **High-Accuracy mode** to track partners down to within 5-10 meters. Coordinates are broadcast via Sockets and rendered on a lightweight Leaflet.js map, providing a "Uber-like" tracking experience with zero API-cost overhead.

---

## 🧠 Engineering Highlights
-   **Custom Matching Engine**: Rankings are calculated using a weighted algorithm based on partner rating, proximity to the delivery hostel, and historical completion rates.
-   **Reputation Recovery Logic**: New users start at a `0.0` rating with a "New Partner 🆕" status to prevent cold-start penalties and ensure a fair entry into the platform's economy.
-   **Scalable File Handling**: Image-sharing in chat is handled via an optimized HTTP-upload flow that fires socket notifications only after successful persistence.

---

## ✨ Features at a Glance
-   **🔐 Secure Auth**: University-domain enforced login (e.g., `@bennett.edu.in`).
-   **💬 Real-time Chat**: Full image support and typing indicators.
-   **🏆 Elite Partner Ranking**: AI-driven "Nearby Best Picks."
-   **📱 One-Tap Dial**: Deep-linked `tel:` integration for instant coordination.
-   **📈 Earnings Dashboard**: Real-time tracking of successful gigs and daily income.

---

## 🚀 Installation & Local Development

### 1. Prerequisite
- Node.js (v18+) & MongoDB (Atlas or Local)
- Razorpay API Keys (Test Mode)

### 2. Backend Setup
```bash
cd backend
npm install
# Create .env with MONGO_URI, JWT_SECRET, RAZORPAY_KEY_ID, and RAZORPAY_KEY_SECRET
npm start
```

### 3. Frontend Setup
```bash
cd frontend
npm install
# Create .env with VITE_API_URL, VITE_SOCKET_URL, and VITE_RAZORPAY_KEY_ID
npm run dev
```

---

## 🔭 Future Scope
-   **PWA Integration**: Native push notifications for background order alerts.
-   **Advanced Geo-fencing**: Dynamic pricing based on cross-campus walking distance.

---

### 🔥 For Recruiters
UniServe demonstrates a full-stack proficiency in handling **distributed state**, **secure financial transactions**, and **real-time geolocation data**. It solves a real-world logistics problem with an engineering-first mindset.

⭐ **Like the project?** Star the repository to show support!

