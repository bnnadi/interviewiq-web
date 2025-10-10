import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: "0.0.0.0",
    port: 3000,
    watch: {
      usePolling: true,
      interval: 1000,
      ignored: [
        "**/.DS_Store/**",
        "**/.git/**",
        "**/node_modules/**",
        "**/dist/**",
        "**/.vite/**",
        "**/tickets/**",
        "**/.cursor/**"
      ]
    },
    hmr: {
      port: 3000
    }
  },
  build: {
    outDir: "dist",
    sourcemap: true
  }
})
