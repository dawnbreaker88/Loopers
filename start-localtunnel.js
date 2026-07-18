const localtunnel = require('localtunnel');

(async () => {
  try {
    const frontendTunnel = await localtunnel({ port: 3000 });
    console.log(`Frontend Global URL: ${frontendTunnel.url}`);

    const backendTunnel = await localtunnel({ port: 5000 });
    console.log(`Backend Global URL: ${backendTunnel.url}`);

    frontendTunnel.on('close', () => console.log('Frontend tunnel closed'));
    backendTunnel.on('close', () => console.log('Backend tunnel closed'));
  } catch (error) {
    console.error('Error starting localtunnel:', error);
  }
})();
