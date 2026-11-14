import { spawn } from 'node:child_process'
import { existsSync } from 'node:fs'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

function phpApiPlugin() {
  let apiProcess

  return {
    name: 'php-api',
    configureServer(server) {
      const xamppPhp = 'C:\\xampp\\php\\php.exe'
      const php = process.env.PHP_BINARY || (existsSync(xamppPhp) ? xamppPhp : 'php')
      apiProcess = spawn(php, ['-S', '127.0.0.1:8000', '-t', process.cwd(), 'backend/router.php'], {
        cwd: process.cwd(),
        env: {
          ...process.env,
          DB_HOST: process.env.DB_HOST || '127.0.0.1',
          DB_NAME: process.env.DB_NAME || 'alumni_tracker',
          DB_USER: process.env.DB_USER || 'root',
          DB_PASSWORD: process.env.DB_PASSWORD || '',
        },
        stdio: 'inherit',
      })
      apiProcess.on('error', (error) => server.config.logger.error(`Could not start the PHP API: ${error.message}`))
      server.httpServer.once('close', () => apiProcess.kill())
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), phpApiPlugin()],
  server: {
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
    },
  },
})
