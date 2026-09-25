import { spawn } from 'node:child_process';
import { createServer } from 'vite';

async function startDev() {
  console.log('[DEV] Starting Vite dev server...');
  const server = await createServer({
    configFile: 'vite.config.ts',
    server: { port: 5173 },
  });
  await server.listen();

  const devUrl = server.resolvedUrls?.local[0] || 'http://localhost:5173';
  console.log(`[DEV] Vite dev server ready at ${devUrl}`);

  // Build electron main and preload once before launching
  console.log('[DEV] Compiling Electron main and preload scripts...');
  const { execSync } = await import('node:child_process');
  execSync('npx vite build --config vite.main.config.ts && npx vite build --config vite.preload.config.ts', {
    stdio: 'inherit',
  });

  console.log('[DEV] Launching Electron window...');
  const electronProcess = spawn(
    process.platform === 'win32' ? 'npx.cmd' : 'npx',
    ['electron', '.'],
    {
      stdio: 'inherit',
      env: {
        ...process.env,
        VITE_DEV_SERVER_URL: devUrl,
      },
    }
  );

  electronProcess.on('close', (code) => {
    console.log(`[DEV] Electron exited with code ${code}. Closing dev server...`);
    server.close();
    process.exit(code || 0);
  });
}

startDev().catch((err) => {
  console.error('[DEV] Failed to start dev environment:', err);
  process.exit(1);
});
