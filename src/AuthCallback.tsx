import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from './lib/supabase'

export default function AuthCallback() {
  const navigate = useNavigate()

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // ১. PKCE flow এর জন্য 'code' প্যারামিটার চেক করা
        const searchParams = new URLSearchParams(window.location.search)
        const code = searchParams.get('code')

        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code)
          if (error) {
            console.error('Error exchanging code for session:', error)
            navigate('/login?error=auth_failed')
            return
          }
        }

        // ২. ফাইনাল সেশন ভেরিফাই করা
        const { data: { session }, error } = await supabase.auth.getSession()

        if (error) {
          console.error('Session error:', error)
          navigate('/login?error=session_error')
          return
        }

        if (session) {
          console.log('Session successfully established:', session.user)
          navigate('/', { replace: true })
        } else {
          // সেশন না পেলে fallback listener চালু রাখা (_event ব্যবহার করে TypeScript warning বন্ধ করা)
          const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, currentSession) => {
            if (currentSession) {
              subscription.unsubscribe()
              navigate('/', { replace: true })
            }
          })

          setTimeout(() => {
            navigate('/login?error=no_session')
          }, 2500)
        }
      } catch (err) {
        console.error('Callback error:', err)
        navigate('/login?error=callback_failed')
      }
    }

    handleCallback()
  }, [navigate])

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-900 text-white">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
        <p className="mt-4 text-gray-300 font-medium">Completing sign in...</p>
      </div>
    </div>
  )
}
