const { existsSync } = require('node:fs');
const { resolve } = require('node:path');

const envPath = resolve(__dirname, '.env');
if (existsSync(envPath)) process.loadEnvFile(envPath);

const target = new URL(process.env.API_TARGET || 'https://api.lagencevisible.com');
const publicOrigin = new URL(process.env.API_PUBLIC_APP_ORIGIN || 'https://lagencevisible.com');
const loopback = ['localhost', '127.0.0.1', '[::1]'].includes(target.hostname);
if ((target.protocol !== 'https:' && !(loopback && target.protocol === 'http:')) ||
    target.username || target.password || target.pathname !== '/' || target.search || target.hash) {
  throw new Error('API_TARGET must be an HTTPS origin, or HTTP on localhost.');
}
if (!['http:', 'https:'].includes(publicOrigin.protocol) || publicOrigin.pathname !== '/' ||
    publicOrigin.username || publicOrigin.password || publicOrigin.search || publicOrigin.hash) {
  throw new Error('API_PUBLIC_APP_ORIGIN must be an HTTP(S) origin.');
}

const upstream = {
  target: target.origin,
  changeOrigin: true,
  secure: true,
  headers: { Origin: publicOrigin.origin },
};

module.exports = {
  '/api/**': { ...upstream },
  '/screenshots/**': { ...upstream },
};
