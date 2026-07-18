const ngrok = require('ngrok');

(async function() {
  try {
    const urlFrontend = await ngrok.connect({ addr: 3000, authtoken: process.env.NGROK_AUTH_TOKEN });
    console.log(`Frontend URL: ${urlFrontend}`);
    
    const urlBackend = await ngrok.connect({ addr: 5000, authtoken: process.env.NGROK_AUTH_TOKEN });
    console.log(`Backend URL: ${urlBackend}`);
  } catch (err) {
    console.error('Error starting ngrok:', err.message);
  }
})();
