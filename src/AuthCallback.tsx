// src/components/AuthCallback.jsx
import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'

export default function AuthCallback() {
  const navigate = useNavigate()

  useEffect(() => {
    // Handle the OAuth callback
    const handleCallback = async () => {
      try {
        // Check if there's a hash fragment (OAuth response)
        const hashParams = new URLSearchParams(window.location.hash.substring(1))
        const accessToken = hashParams.get('access_token')
        
        if (accessToken) {
          // Let Supabase process the session
          const { data, error } = await supabase.auth.getSession()
          
          if (error) {
            console.error('Session error:', error)
            navigate('/login?error=auth_failed')
            return
          }

          if (data.session) {
            console.log('Session established:', data.session.user)
            // Redirect to dashboard or home
            navigate('/dashboard')
          } else {
            navigate('/login?error=no_session')
          }
        } else {
          // No token in URL, check existing session
          const { data } = await supabase.auth.getSession()
          if (data.session) {
            navigate('/dashboard')
          } else {
            navigate('/login')
          }
        }
      } catch (err) {
        console.error('Callback error:', err)
        navigate('/login?error=callback_failed')
      }
    }

    handleCallback()
  }, [navigate])

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Completing sign in...</p>
      </div>
    </div>
  )
}
