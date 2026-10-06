import { defineConfig, type Plugin } from 'vite';
import { mkdirSync, writeFileSync } from 'node:fs';

/** Dev-only: POST a data-URL to /__qa/<name> to save a frame to .qa/ (used for visual QA). */
const qaShots = (): Plugin => ({
  name: 'qa-shots',
  apply: 'serve',
  configureServer(server) {
    server.middlewares.use('/__qa/', (req, res) => {
      if (req.method !== 'POST') return res.end();
      let body = '';
      req.on('data', (c) => (body += c));
      req.on('end', () => {
        mkdirSync('.qa', { recursive: true });
        const name = (req.url || '/shot').replace(/[^a-z0-9-]/gi, '') || 'shot';
        writeFileSync(`.qa/${name}.jpg`, Buffer.from(body.replace(/^data:image\/\w+;base64,/, ''), 'base64'));
        res.end('ok');
      });
    });
  },
});

export default defineConfig({
  plugins: [qaShots()],
  build: {
    target: 'es2020',
    assetsInlineLimit: 0,
    chunkSizeWarningLimit: 600, // the 3D world is its own lazy chunk, loaded after the first screen
  },
});
