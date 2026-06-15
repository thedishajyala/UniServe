#  UniServe: Peer-to-Peer Campus Delivery Engine
[![React](https://img.shields.io/badge/React-19.0-61DAFB?logo=react)](https://reactjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-20.x-339933?logo=node.js)](https://nodejs.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?logo=mongodb)](https://www.mongodb.com/)
[![Socket.io](https://img.shields.io/badge/Socket.io-Real--time-010101?logo=socket.io)](https://socket.io/)
[![Razorpay](https://img.shields.io/badge/Razorpay-Payment-02042B?logo=razorpay)](https://razorpay.com/)

UniServe is a full-stack, real-time campus delivery platform that enables students to request food, parcels, and essentials while allowing fellow students to earn through hyper-local deliveries within the university ecosystem.

###  Features

* 🔐 University-domain authentication
* 📦 Smart delivery request management
* 🧠 AI-assisted partner ranking based on ratings, proximity, and completion rate
* 💬 Real-time chat with image sharing and typing indicators
* 📍 Live delivery tracking using Geolocation API and Leaflet.js
* 💳 Secure payments with Razorpay
* 📈 Partner earnings and performance dashboard
* 🔔 Instant notifications powered by Socket.io

###  Tech Stack

**Frontend:** React, Vite, Tailwind CSS
**Backend:** Node.js, Express.js, Socket.io
**Database:** MongoDB Atlas
**Payments:** Razorpay
**Deployment:** Vercel, Render

###  Architecture Highlights

* Dual-room Socket.io architecture (`user_{id}` and `order_{id}`)
* Real-time location broadcasting and order tracking
* Hybrid payment workflow (Prepaid + Cash)
* Scalable media upload and notification system
* Intelligent partner matching engine

###  Getting Started

```bash
git clone <repo-url>
cd project

# Backend
cd backend
npm install
npm start

# Frontend
cd frontend
npm install
npm run dev
```
###  For Recruiters

UniServe was built to solve a real logistics problem within university campuses. This project showcases my experience in full-stack development, real-time systems, payment integrations, geolocation tracking, and scalable application design. I enjoy building products that solve practical problems and continuously exploring AI-driven solutions to improve user experiences.



