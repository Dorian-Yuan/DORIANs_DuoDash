import dns from 'node:dns';
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';

dns.setDefaultResultOrder('verbatim');
const DEFAULT_DEV_HOST = 'localhost';
const DEFAULT_DEV_PORT = 4321;

function getDevServerConfig(env = process.env) {
  const host = env.DEV_HOST || DEFAULT_DEV_HOST;
  const port = Number(env.PORT || DEFAULT_DEV_PORT);

  return {
    host,
    port,
    strictPort: false,
  };
}

const devServerConfig = getDevServerConfig();

export default defineConfig({
  // 静态构建：数据由 GitHub Actions 定时生成 snapshot.json 提供
  output: 'static',
  // GitHub Pages 项目页面：https://dorian-yuan.github.io/dorians_duodash/
  base: '/dorians_duodash/',
  devToolbar: {
    enabled: false
  },
  server: {
    host: devServerConfig.host,
    port: devServerConfig.port,
    headers: {
      'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https://www.duolingo.com https://*.openai.com; frame-ancestors 'none'; base-uri 'self'; form-action 'self'",
      'X-Frame-Options': 'DENY',
      'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Permissions-Policy': 'geolocation=(), microphone=(), camera=()'
    }
  },
  integrations: [
    react()
  ],
  vite: {
    server: devServerConfig,
    build: {
      cssCodeSplit: true,
      minify: 'esbuild',
      cssMinify: 'esbuild'
    },
    ssr: {
      noExternal: ['recharts']
    },
    optimizeDeps: {
      include: ['react', 'react-dom', 'recharts'],
      exclude: ['@zumer/snapdom']
    }
  },
  compressHTML: true,
  build: {
    inlineStylesheets: 'auto'
  }
});
