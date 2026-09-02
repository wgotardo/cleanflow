'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useI18n } from '@/lib/i18n'

const translations = {
  en: {
    greeting: 'Welcome back 👋',
    subtitle: 'Sign in to manage your cleaning business',
    email: 'Email',
    emailPlaceholder: 'you@company.com',
    password: 'Password',
    passwordPlaceholder: '••••••••',
    signIn: 'Sign In',
    signingIn: 'Signing in...',
    forgotPassword: 'Forgot password?',
    noAccount: "Don't have an account?",
    createAccount: 'Create account',
    signUp: 'Sign Up',
    signingUp: 'Creating account...',
    name: 'Full name',
    namePlaceholder: 'Your name',
    confirmPassword: 'Confirm password',
    haveAccount: 'Already have an account?',
    backToLogin: 'Back to login',
    error: 'Invalid login credentials',
    errorSignup: 'Could not create account',
    passwordMismatch: 'Passwords do not match',
    footer: '© 2026 CleanFlow',
  },
  pt: {
    greeting: 'Bem-vindo de volta 👋',
    subtitle: 'Entre para gerenciar seu negócio de limpeza',
    email: 'E-mail',
    emailPlaceholder: 'voce@empresa.com',
    password: 'Senha',
    passwordPlaceholder: '••••••••',
    signIn: 'Entrar',
    signingIn: 'Entrando...',
    forgotPassword: 'Esqueci minha senha',
    noAccount: 'Não tem uma conta?',
    createAccount: 'Criar conta',
    signUp: 'Criar conta',
    signingUp: 'Criando conta...',
    name: 'Nome completo',
    namePlaceholder: 'Seu nome',
    confirmPassword: 'Confirmar senha',
    haveAccount: 'Já tem uma conta?',
    backToLogin: 'Voltar ao login',
    error: 'Credenciais de login inválidas',
    errorSignup: 'Não foi possível criar a conta',
    passwordMismatch: 'As senhas não coincidem',
    footer: '© 2026 CleanFlow',
  },
}

export default function LoginPage() {
  const router = useRouter()
  const { lang, setLang } = useI18n()
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [resetSent, setResetSent] = useState(false)

  const t = translations[lang]

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        router.push('/dashboard')
      }
    })
  }, [router])

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    setResetSent(false)

    const { data, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (authError) {
      setError(t.error)
      setLoading(false)
      return
    }

    if (data.session) {
      router.push('/dashboard')
    }
    setLoading(false)
  }

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (password !== confirmPassword) {
      setError(t.passwordMismatch)
      return
    }

    setLoading(true)
    const { data, error: signupError } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: name } },
    })

    if (signupError) {
      setError(t.errorSignup)
      setLoading(false)
      return
    }

    if (data.session) {
      router.push('/dashboard')
    } else {
      setResetSent(true)
      setError('')
    }
    setLoading(false)
  }

  async function handleForgotPassword() {
    if (!email) {
      setError(lang === 'en' ? 'Enter your email first' : 'Digite seu e-mail primeiro')
      return
    }
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email)
    if (!resetError) {
      setResetSent(true)
      setError('')
    }
  }

  function switchMode() {
    setMode(mode === 'login' ? 'signup' : 'login')
    setError('')
    setResetSent(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0A1F44] p-4 relative">
      {/* Seletor de idioma com bandeiras reais */}
      <div className="absolute top-4 right-4 flex gap-1 bg-white/10 rounded-full p-0.5">
        <button
          onClick={() => setLang('en')}
          className={`px-2 py-0.5 rounded-full text-[11px] font-semibold transition flex items-center gap-1 ${
            lang === 'en' ? 'bg-[#00B4D8] text-white' : 'text-white/70'
          }`}
        >
          <img
            src="https://flagcdn.com/w20/us.png"
            alt="EN"
            className="w-4 h-3 rounded-sm object-cover"
          />
          EN
        </button>
        <button
          onClick={() => setLang('pt')}
          className={`px-2 py-0.5 rounded-full text-[11px] font-semibold transition flex items-center gap-1 ${
            lang === 'pt' ? 'bg-[#00B4D8] text-white' : 'text-white/70'
          }`}
        >
          <img
            src="https://flagcdn.com/w20/br.png"
            alt="PT"
            className="w-4 h-3 rounded-sm object-cover"
          />
          PT
        </button>
      </div>

      <div className="w-full max-w-sm bg-white rounded-2xl shadow-xl p-8">
        <div className="flex justify-center mb-2">
          <div className="w-16 h-16 rounded-2xl bg-[#0A1F44] flex items-center justify-center">
            <span className="text-3xl">💧</span>
          </div>
        </div>

        <h1 className="text-2xl font-bold text-[#0A1F44] text-center mb-1">
          CleanFlow
        </h1>

        <p className="text-center text-gray-500 mb-6">{t.greeting}</p>
        <p className="text-center text-xs text-gray-400 -mt-4 mb-6">
          {t.subtitle}
        </p>

        {mode === 'login' ? (
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t.email}
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-gray-400">✉️</span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00B4D8]"
                  placeholder={t.emailPlaceholder}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t.password}
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-gray-400">🔒</span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00B4D8]"
                  placeholder={t.passwordPlaceholder}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-gray-400 hover:text-[#00B4D8]"
                >
                  {showPassword ? '🙈' : '👁️'}
                </button>
              </div>
            </div>

            {error && (
              <p className="text-sm text-red-600 bg-red-50 p-2 rounded-lg">{error}</p>
            )}
            {resetSent && (
              <p className="text-sm text-green-600 bg-green-50 p-2 rounded-lg">
                {lang === 'en'
                  ? 'Password reset link sent to your email'
                  : 'Link de redefinição enviado para seu e-mail'}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#00B4D8] text-white font-semibold py-2.5 rounded-lg hover:bg-[#0096b8] transition disabled:opacity-50"
            >
              {loading ? t.signingIn : t.signIn}
            </button>
          </form>
        ) : (
          <form onSubmit={handleSignup} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t.name}
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-gray-400">👤</span>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00B4D8]"
                  placeholder={t.namePlaceholder}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t.email}
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-gray-400">✉️</span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00B4D8]"
                  placeholder={t.emailPlaceholder}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t.password}
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-gray-400">🔒</span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00B4D8]"
                  placeholder={t.passwordPlaceholder}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-gray-400 hover:text-[#00B4D8]"
                >
                  {showPassword ? '🙈' : '👁️'}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t.confirmPassword}
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-gray-400">🔒</span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00B4D8]"
                  placeholder={t.passwordPlaceholder}
                />
              </div>
            </div>

            {error && (
              <p className="text-sm text-red-600 bg-red-50 p-2 rounded-lg">{error}</p>
            )}
            {resetSent && (
              <p className="text-sm text-green-600 bg-green-50 p-2 rounded-lg">
                {lang === 'en'
                  ? 'Account created! Check your email to confirm.'
                  : 'Conta criada! Verifique seu e-mail para confirmar.'}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#00B4D8] text-white font-semibold py-2.5 rounded-lg hover:bg-[#0096b8] transition disabled:opacity-50"
            >
              {loading ? t.signingUp : t.signUp}
            </button>
          </form>
        )}

        {mode === 'login' && (
          <button
            onClick={handleForgotPassword}
            className="w-full text-center text-sm text-[#00B4D8] font-medium mt-4 hover:underline"
          >
            {t.forgotPassword}
          </button>
        )}

        <div className="text-center mt-4 text-sm text-gray-500">
          {mode === 'login' ? t.noAccount : t.haveAccount}{' '}
          <button
            onClick={switchMode}
            className="text-[#00B4D8] font-semibold hover:underline"
          >
            {mode === 'login' ? t.createAccount : t.backToLogin}
          </button>
        </div>

        <p className="text-xs text-gray-400 text-center mt-6">{t.footer}</p>
      </div>
    </div>
  )
}