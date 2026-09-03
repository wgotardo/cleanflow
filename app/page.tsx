'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { isBiometricSupported, loginWithBiometric, registerBiometric } from '@/lib/webauthn'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [bioSupported, setBioSupported] = useState(false)

  useEffect(() => {
    setBioSupported(isBiometricSupported())
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    if (isSignUp) {
      if (!name.trim()) {
        setError('O nome é obrigatório.')
        setLoading(false)
        return
      }
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: name.trim() } },
      })
      if (error) {
        setError(error.message)
        setLoading(false)
        return
      }
      if (data.session) {
        router.push('/dashboard')
      } else {
        setError('Conta criada! Verifique seu e-mail para confirmar.')
      }
    } else {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) {
        setError(error.message)
        setLoading(false)
        return
      }
      router.push('/dashboard')
    }
    setLoading(false)
  }

  async function handleBiometricLogin() {
    setError('')
    setLoading(true)
    try {
      const result = await loginWithBiometric()
      if (result.success) {
        router.push('/dashboard')
      } else {
        setError(result.error || 'Falha na biometria. Tente novamente.')
      }
    } catch (err: any) {
      setError(err?.message || 'Biometria cancelada ou não suportada.')
    } finally {
      setLoading(false)
    }
  }

  async function handleEnableBiometric() {
    setError('')
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        setError('Faça login com senha primeiro para ativar o Face ID.')
        return
      }
      const result = await registerBiometric(
        session.user.id,
        session.user.email || '',
        session.user.user_metadata?.full_name || 'Usuário'
      )
      if (result.success) {
        alert('Face ID ativado com sucesso! 🎉')
      } else {
        setError(result.error || 'Não foi possível ativar.')
      }
    } catch (err: any) {
      setError(err?.message || 'Erro ao ativar biometria.')
    }
  }

  return (
    <div className="min-h-screen bg-[#0A1F44] flex items-center justify-center p-6">
      <div className="w-full max-w-sm">
        {/* LOGO PROFISSIONAL — identidade visual CleanFlow */}
        <div className="text-center mb-8">
          <div className="relative w-20 h-20 mx-auto mb-4">
            {/* Gota com gradiente navy→cyan + detalhe dourado */}
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-[#00B4D8] to-[#0A1F44] shadow-lg shadow-[#00B4D8]/30" />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-3xl">💧</span>
            </div>
            {/* Detalhe dourado */}
            <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-8 h-1 rounded-full bg-[#D4AF37]" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">CleanFlow</h1>
          <p className="text-white/60 text-sm tracking-[0.18em] uppercase mt-1">Cleaning Management</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-6 space-y-4">
          {isSignUp && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nome <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Seu nome completo"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00B4D8]"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">E-mail</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="voce@email.com"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00B4D8]"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Senha</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mínimo 6 caracteres"
              required
              minLength={6}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00B4D8]"
            />
          </div>

          {error && (
            <p className="text-sm text-red-500 bg-red-50 p-2 rounded-lg">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#0A1F44] text-white font-semibold py-2.5 rounded-lg hover:bg-[#12305e] transition disabled:opacity-50"
          >
            {loading ? 'Aguarde...' : isSignUp ? 'Criar conta' : 'Entrar'}
          </button>

          {!isSignUp && bioSupported && (
            <>
              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-gray-200" />
                <span className="text-xs text-gray-400">ou</span>
                <div className="flex-1 h-px bg-gray-200" />
              </div>
              <button
                type="button"
                onClick={handleBiometricLogin}
                disabled={loading}
                className="w-full bg-[#00B4D8] text-white font-semibold py-2.5 rounded-lg hover:bg-[#0096b8] transition disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <span className="text-lg">👤</span> Entrar com Face ID
              </button>
              <button
                type="button"
                onClick={handleEnableBiometric}
                className="w-full text-[#00B4D8] text-sm font-semibold py-1"
              >
                🔐 Ativar Face ID neste dispositivo
              </button>
            </>
          )}

          <button
            type="button"
            onClick={() => setIsSignUp(!isSignUp)}
            className="w-full text-gray-500 text-sm font-semibold py-1"
          >
            {isSignUp ? 'Já tenho conta — Entrar' : 'Não tenho conta — Cadastrar'}
          </button>
        </form>
      </div>
    </div>
  )
}