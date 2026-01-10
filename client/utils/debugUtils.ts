// utils/debugUtils.ts
export const logDebugInfo = () => {
  if (typeof window === 'undefined') return

  console.log('🔍 ========== DEBUG INFO ==========')
  console.log('🌐 Environment:', {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    NODE_ENV: process.env.NODE_ENV,
    location: window.location.href,
  })

  console.log('🍪 Cookies:')
  const cookies = document.cookie.split(';')
  cookies.forEach((cookie) => {
    const [name, value] = cookie.trim().split('=')
    console.log(`  ${name}: ${value ? 'Present' : 'Empty'}`)
  })

  console.log('📦 Local Storage:', {
    token: localStorage.getItem('token'),
    auth: localStorage.getItem('auth'),
  })

  console.log('====================================')
}
