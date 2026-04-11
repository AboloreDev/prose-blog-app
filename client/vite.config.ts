import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          if (
            ["react", "react-dom", "react-router-dom"].some((pkg) =>
              id.includes(pkg),
            )
          ) {
            return "vendor";
          }
          if (
            ["@reduxjs/toolkit", "react-redux"].some((pkg) => id.includes(pkg))
          ) {
            return "redux";
          }
          if (
            ["@radix-ui/react-dialog", "@radix-ui/react-dropdown-menu"].some(
              (pkg) => id.includes(pkg),
            )
          ) {
            return "ui";
          }
        },
      },
    },
  },
});
