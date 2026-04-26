export default function manifest() {
  return {
    name: 'Islamic Token System',
    short_name: 'TokenApp',
    description: 'Manage your tokens easily',
    start_url: '/',
    display: 'standalone',
    background_color: '#f4f4f0',
    theme_color: '#064e3b',
    icons: [
      { src: '/favicon.ico', sizes: 'any', type: 'image/x-icon' },
    ],
  }
}