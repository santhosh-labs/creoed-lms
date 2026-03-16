import axios from 'axios';

const isLocal = window.location.hostname === 'localhost';
const BACKEND_URL = isLocal 
    ? 'https://creoed-lms.onrender.com/api' // Even on localhost, use the live backend for now
    : (import.meta.env.VITE_API_URL || 'https://creoed-lms.onrender.com/api');

console.log('🔗 API Base URL:', BACKEND_URL);

const api = axios.create({
    baseURL: BACKEND_URL,
});

api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

export default api;
