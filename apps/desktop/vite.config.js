import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react()
  ],
  // ✅ Safeguard: Prevent Vite from trying to bundle React Native modules.
  // This tells Vite to treat 'react-native' as an external dependency that
  // will be available at runtime (which it won't be, but it stops the build error).
  // This is a robust way to prevent crashes if another shared module accidentally imports it.
  optimizeDeps: { exclude: ['react-native'] },
  base: './', // <-- YEH LINE ELECTRON KE LIYE SABSE ZAROORI HAI
})