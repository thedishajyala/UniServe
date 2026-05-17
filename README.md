# 🚀 UniServe: The Hyper-Local University Delivery Engine

[![React](https://img.shields.io/badge/React-19.0-61DAFB?style=for-the-badge&logo=react)](https://reactjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-20.x-339933?style=for-the-badge&logo=node.js)](https://nodejs.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?style=for-the-badge&logo=mongodb)](https://www.mongodb.com/)
[![Socket.io](https://img.shields.io/badge/Socket.io-Real--time-010101?style=for-the-badge&logo=socket.io)](https://socket.io/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind-3.x-38B2AC?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)
[![Razorpay](https://img.shields.io/badge/Razorpay-Payment-02042B?style=for-the-badge&logo=razorpay)](https://razorpay.com/)

**UniServe** is a high-performance, real-time peer-to-peer delivery ecosystem engineered exclusively for university campuses. It bridges the gap between students needing essentials and those willing to deliver them, creating a self-sustaining micro-economy with 0% overhead for the students.

---

## 🏛️ System Architecture

UniServe is built on a custom-architected MERN stack designed for sub-second latency and absolute data integrity.

### 📡 Real-Time Dispatch Engine (Socket.io)
At the heart of UniServe is a sophisticated signal-broadcasting system:
- **Parallel Dispatch**: Requesters can broadcast delivery requests to multiple high-rated partners simultaneously. The first to accept locks the order, while the system automatically revokes the request from other partners' feeds in real-time.
- **Dual-Channel Sockets**:
    - `user_{id}`: Global high-priority notification lane for incoming requests and status alerts.
    - `order_{id}`: Dedicated data lane for real-time chat, image sharing, and coordinate broadcasting.

### 🛡️ Secure Financial Layer (Razorpay SDK)
A multi-tier payment logic that ensures trust in a pseudo-anonymous campus environment:
- **Smart Gateway Integration**: Full Razorpay checkout flow with HMAC-based signature verification.
- **Dynamic Settlement**: Supports full pre-payment (Prepaid) or post-delivery (Cash).
- **In-Chat Conversion**: Unique "Mid-Chat Settlement" logic allowing users to securely switch from Cash to Online payment mid-delivery if they run out of physical currency.

### 🧠 AI-Driven Matching Engine
Our proprietary `matchingEngine.js` ranks delivery partners not just by proximity, but by a "Trust Index":
- **Weighted Ranking**: Proximity to delivery hostel, historical rating, and `avg_response_time`.
- **Cold-Start Protection**: New partners are incentivized with a "New Partner 🆕" status to ensure a fair entry into the ecosystem.

---

## ✨ Key Features

| Feature | Description |
| :--- | :--- |
| **🔐 University Auth** | Enforced university-domain email validation (e.g., `@bennett.edu.in`). |
| **💬 Live Chat** | Full-duplex messaging with image sharing and typing indicators. |
| **📍 Geolocation** | Leaflet-powered tracking with high-accuracy GPS broadcasting. |
| **🏆 Partner Dashboard** | Real-time earnings tracking, success rate analytics, and response metrics. |
| **📱 Mobile-First UI** | Premium Aesthetics with Glassmorphism, Mesh Gradients, and micro-animations. |
| **💸 Flat Pricing** | Transparent pricing (Flat ₹49) calculated via the dedicated `pricingEngine.js`. |

---

## 🛠️ Tech Stack & Dependencies

### Frontend
- **React 19** + **Vite**: Ultra-fast HMR and optimized production bundles.
- **Tailwind CSS**: Utility-first styling with custom glassmorphism extensions.
- **Socket.io-client**: Persistent WebSocket connections.
- **Leaflet.js**: Lightweight mapping and coordinate rendering.

### Backend
- **Node.js** + **Express**: Scalable RESTful API and socket server.
- **MongoDB Atlas**: Cloud-hosted NoSQL database with Mongoose ODM.
- **JWT & Passport**: Secure stateless authentication.
- **Razorpay**: Robust payment processing gateway.

---

## 🚀 Installation & Local Development

### 1. Prerequisites
- **Node.js** (v18 or higher)
- **MongoDB** (Atlas cluster or local instance)
- **Razorpay Keys** (Obtainable from [Razorpay Dashboard](https://dashboard.razorpay.com))

### 2. Backend Initialization
```bash
cd backend
npm install
# Create .env file with:
# MONGO_URI=your_mongodb_uri
# JWT_SECRET=your_secret_key
# RAZORPAY_KEY_ID=your_key_id
# RAZORPAY_KEY_SECRET=your_key_secret
npm start
```

### 3. Frontend Initialization
```bash
cd frontend
npm install
# Create .env file with:
# VITE_API_URL=http://localhost:5000/api
# VITE_SOCKET_URL=http://localhost:5000
# VITE_RAZORPAY_KEY_ID=your_key_id
npm run dev
```

---

## 🗺️ Future Roadmap
- [ ] **PWA Support**: Native mobile install and background push notifications.
- [ ] **Geo-Fencing**: Dynamic pricing based on walking distance and terrain complexity.
- [ ] **Gamification**: Badge system for top performers and "Rush Hour" multipliers.

---

### 🔥 Developer Note
UniServe was built to solve a real-world logistics gap within university campuses. It demonstrates mastery over **distributed state synchronization**, **secure financial transactions**, and **real-time geolocation systems**.

⭐ **Star the repo** if you find this project impressive!
