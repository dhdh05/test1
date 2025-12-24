// API Configuration
// Automatically detects environment and uses appropriate API URL

const getApiUrl = () => {
    // Check if running on localhost
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        return 'http://localhost:5000';
    }

    // Production API URL - UPDATE THIS after deploying backend
    // Example: 'https://hi-math-backend.onrender.com'
    return 'https://hi-math-backend.onrender.com';
};

const API_URL = getApiUrl();

// Export for use in modules
export default API_URL;

// Also make it available globally for non-module scripts
window.API_URL = API_URL;

console.log('🔌 API URL:', API_URL);
