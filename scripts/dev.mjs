/** One local development server for Vite and the real, same-origin lead API. */
import { createServer } from 'vite';
import { createApp } from '../server/app.mjs';
import { loadConfig } from '../server/config.mjs';
import { createTransport } from '../server/mail.mjs';

if (process.env.NODE_ENV === 'production') throw new Error('Use NODE_ENV=development for local HTTP development, or npm start for production.');
const option = (name, fallback) => {
  const index = process.argv.lastIndexOf(name);
  return index >= 0 ? process.argv[index + 1] : fallback;
};
const port = Number(option('--port', '5173'));
const config = loadConfig();
const transport = createTransport(config);
const api = createApp({ config, transport });
const server = await createServer({
  plugins: [{
    name: 'aura-local-api',
    configureServer(vite) {
      vite.middlewares.use((request, response, next) => {
        if (request.url === '/api' || request.url?.startsWith('/api/')) api(request, response, next);
        else next();
      });
    },
  }],
  server: { host: option('--host', '127.0.0.1'), port, strictPort: true },
});
await server.listen();
server.printUrls();
for (const signal of ['SIGINT', 'SIGTERM']) process.once(signal, async () => {
  await server.close();
  transport?.close?.();
  process.exit(0);
});
