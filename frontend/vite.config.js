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
          manualChunks(id) {
            if (id.includes('recharts')) return 'charts'
            if (id.includes('react-dom') || id.includes('react-router-dom') || id.includes('node_modules/react/')) return 'react'
            if (id.includes('axios') || id.includes('lucide-react')) return 'vendor'
          },
        },
      },
    },
  }
})
