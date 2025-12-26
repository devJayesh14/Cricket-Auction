export const environment = {
  production: false,
  apiUrl: 'https://cricket-auction-backend-7r4j.onrender.com/api',
  // Optional: Separate Socket.io server URL (deploy socket-server.js separately)
  // If not set, will try to use apiUrl without /api
  // Example: 'https://your-socket-server.railway.app' or 'https://your-socket-server.render.com'
  socketUrl: undefined // Set this to your separate Socket.io server URL
};


