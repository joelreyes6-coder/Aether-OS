import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "node:path";

export default defineConfig({
  plugins: [react()],

  build: {
    rollupOptions: {
      input: {
        study: resolve(process.cwd(), "index.html"),
        aether: resolve(process.cwd(), "aether.html"),
      },
    },
  },
});
