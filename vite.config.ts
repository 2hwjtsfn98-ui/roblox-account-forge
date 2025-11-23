import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    mode === "development" && componentTagger()
  ].filter(Boolean),

  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },

  // ✅ REQUIRED FOR GITHUB PAGES
  base: "/roblox-account-forge/",
  
  // Optional but recommended for Pages
  build: {
    outDir: "dist",
    emptyOutDir: true,
  },
}));
