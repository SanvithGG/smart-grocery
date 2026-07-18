import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig(async () => {
  const [{ default: react }, { default: tailwindcss }] = await Promise.all([
    import('@vitejs/plugin-react'),
    import('@tailwindcss/vite'),
  ])

  return {
    plugins: [react(), tailwindcss()],
    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            react: ['react', 'react-dom', 'react-router-dom'],
            charts: ['recharts'],
            vendor: ['axios', 'lucide-react'],
          },
        },
      },
    },
  }
})
