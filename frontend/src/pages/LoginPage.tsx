import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Globe } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/lib/auth'

export function LoginPage() {
  const { session, loading, signInWithGoogle } = useAuth()
  const navigate = useNavigate()
  const { t } = useTranslation()

  useEffect(() => {
    if (!loading && session) navigate('/dashboard', { replace: true })
  }, [session, loading, navigate])

  return (
    <div className="min-h-dvh flex items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center mx-auto">
            <Globe size={28} className="text-white" />
          </div>
          <h1 className="text-2xl font-semibold text-white tracking-tight">Lingua</h1>
          <p className="text-white/40 text-sm">{t('login.tagline')}</p>
        </div>

        <div className="glass p-6 space-y-4">
          <p className="text-center text-sm text-white/50">{t('login.savePrompt')}</p>
          <button
            onClick={signInWithGoogle}
            className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl bg-white text-slate-800 font-medium text-sm hover:bg-white/90 transition-colors"
          >
            <GoogleIcon />
            {t('login.google')}
          </button>
        </div>

        <p className="text-center text-xs text-white/20 whitespace-pre-line">
          {t('login.footer')}
        </p>
      </div>
    </div>
  )
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M17.64 9.2045c0-.6381-.0573-1.2518-.1636-1.8409H9v3.4814h4.8436c-.2086 1.125-.8427 2.0782-1.7959 2.7164v2.2581h2.9087c1.7018-1.5668 2.6836-3.874 2.6836-6.615z" fill="#4285F4" />
      <path d="M9 18c2.43 0 4.4673-.806 5.9564-2.1805l-2.9087-2.2581c-.8059.54-1.8368.859-3.0477.859-2.3446 0-4.3282-1.5836-5.036-3.7104H.9574v2.3318C2.4382 15.9832 5.4818 18 9 18z" fill="#34A853" />
      <path d="M3.964 10.71c-.18-.54-.2822-1.1168-.2822-1.71s.1023-1.17.2822-1.71V4.9582H.9574C.3477 6.1732 0 7.5477 0 9s.3477 2.8268.9574 4.0418L3.964 10.71z" fill="#FBBC05" />
      <path d="M9 3.5795c1.3214 0 2.5077.4541 3.4405 1.346l2.5813-2.5814C13.4632.8918 11.4259 0 9 0 5.4818 0 2.4382 2.0168.9574 4.9582L3.964 7.29C4.6718 5.1632 6.6554 3.5795 9 3.5795z" fill="#EA4335" />
    </svg>
  )
}
