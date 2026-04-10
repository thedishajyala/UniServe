import axios from 'axios';

const getBaseURL = () => {
    if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL;
    
    // Automatically switch based on environment
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        return 'http://localhost:5001/api';
    }
    
    // Fallback for Vercel deployment to hit the Render backend
    return 'https://uniserve-backend-s2w0.onrender.com/api';
};

const API = axios.create({
    baseURL: getBaseURL(),
});

// Attach JWT token to every request
API.interceptors.request.use((config) => {
    const token = localStorage.getItem('uniserve_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
});

// Auth
export const signup = (data) => API.post('/auth/signup', data);
export const login = (data) => API.post('/auth/login', data);

// Users
export const getProfile = () => API.get('/users/profile');
export const updateProfile = (data) => API.put('/users/profile', data);
export const toggleAvailability = () => API.post('/users/toggle-availability');
export const getEarnings = () => API.get('/users/earnings');
export const getOnlinePartners = () => API.get('/users/online');

// Orders
export const createPayment = (data) => API.post('/orders/create-payment', data);
export const createOrder = (data) => API.post('/orders/create', data);
export const getAvailablePartners = (orderId) => API.get(`/orders/partners/${orderId}`);
export const requestPartner = (data) => API.post('/orders/request', data);
export const settlePayment = (data) => API.post('/orders/settle-payment', data);       // Requester → request a partner
export const respondToOrder = (data) => API.post('/orders/respond', data);        // Partner → accept or decline
export const getIncomingRequests = () => API.get('/orders/incoming');              // Partner → see requests sent to them
export const cancelOrder = (data) => API.post('/orders/cancel', data);        // Cancel an order
export const updateOrderStatus = (data) => API.post('/orders/status', data);
export const getMyOrders = () => API.get('/orders/my-orders');
export const getMyDeliveries = () => API.get('/orders/my-deliveries');
export const getOrderById = (orderId) => API.get(`/orders/${orderId}`);

// Reviews
export const addReview = (data) => API.post('/reviews/add', data);
export const getPartnerReviews = (partnerId) => API.get(`/reviews/partner/${partnerId}`);

// Analytics
export const getDemandAnalytics = () => API.get('/analytics/demand');

// Messages
export const getMessages = (orderId) => API.get(`/messages/order/${orderId}`);
export const uploadImage = (formData) => API.post('/messages/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
});

export default API;
