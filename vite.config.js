import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// Vite configuration enabling React and Tailwind CSS
export default defineConfig({
  plugins: [react(), tailwindcss()],
});
