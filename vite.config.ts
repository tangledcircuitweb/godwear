import { defineConfig } from 'vite';
import honox from 'honox/vite';
import { cloudflare } from '@cloudflare/vite-plugin';

export default defineConfig(({ mode }) => {
  if (mode === 'client') {
    return {
      build: {
        rollupOptions: {
          input: ['/app/client.ts'],
          output: {
            entryFileNames: 'static/client.[hash].js',
            chunkFileNames: 'static/assets/[name].[hash].js',
            assetFileNames: 'static/assets/[name].[hash][extname]',
          },
        },
      },
    };
  }

  const plugins = [honox()];
  
  // Only add Cloudflare plugin for production builds
  if (process.env.NODE_ENV === 'production') {
    plugins.push(cloudflare());
  }

  return {
    plugins,
  };
});
