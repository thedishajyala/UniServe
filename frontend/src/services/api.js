import axios from 'axios';

const API = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
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

// Orders
export const createOrder = (data) => API.post('/orders/create', data);
export const getAvailablePartners = (orderId) => API.get(`/orders/partners/${orderId}`);
export const assignPartner = (data) => API.post('/orders/assign', data);
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

export default API;
