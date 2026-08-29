import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// IMPORTANT: replace "engagement-planner" below with your actual GitHub repo name.
// GitHub Pages serves your site at https://<username>.github.io/<repo-name>/
// so Vite needs to know that sub-path to load assets correctly.
export default defineConfig({
  plugins: [react()],
  base: "/engagement-planner/",
});
