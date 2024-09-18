import { fileURLToPath, URL } from "url";
import { resolve } from "path";
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { crx } from '@crxjs/vite-plugin'
import manifest from './manifest.json' // You'll create this file

// https://vitejs.dev/config/
export default defineConfig({
  server: {
    host: "::",
    port: "8080",
  },
  plugins: [
    react(),
    crx({ manifest }),
  ],
  build: {
    rollupOptions: {
      input: {
        background: 'src/background.js', 
        popup: 'chromeextension.html', 
      },
      output: {
        chunkFileNames: '[name].[hash].js',
        assetFileNames: '[name].[hash].[ext]',
        entryFileNames: '[name].js',
        dir: 'dist',
      },
    },
  },
  resolve: {
    alias: [
      {
        find: "@",
        replacement: fileURLToPath(new URL("./src", import.meta.url)),
      },
      {
        find: "lib",
        replacement: resolve(__dirname, "lib"),
      },
    ],
  },
});
