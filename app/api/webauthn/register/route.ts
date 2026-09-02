// app/api/webauthn/register/route.ts
import { NextResponse } from 'next/server'
import { generateRegistrationOptions } from '@simplewebauthn/server'
import { supabase } from '@/lib/supabase'

export async function POST(req: Request) {
  const { userId, email, name } = await req.json()

  // Gera um desafio (challenge) para registrar a biometria
  const options = await generateRegistrationOptions({
    rpName: 'CleanFlow',
    rpID: process.env.WEBAUTHN_RP_ID || 'localhost',
    userName: email,
    userDisplayName: name,
    timeout: 60000,
    attestationType: 'none',
    authenticatorSelection: {
      residentKey: 'preferred',
      userVerification: 'required',   // força biometria
    },
  })

  // Guarda o desafio temporariamente (em memória ou no banco)
  // Para produção, guarde em uma tabela ou Redis
  globalThis.__challenge = options.challenge

  return NextResponse.json({ options })
}import { NextResponse } from 'next/server'
import { generateRegistrationOptions } from '@simplewebauthn/server'

export async function POST(req: Request) {
  const { userId, email, name } = await req.json()
  const options = await generateRegistrationOptions({
    rpName: 'CleanFlow',
    rpID: process.env.WEBAUTHN_RP_ID || 'localhost',
    userName: email,
    userDisplayName: name || email,
    timeout: 60000,
    attestationType: 'none',
    authenticatorSelection: {
      residentKey: 'preferred',
      userVerification: 'required',
    },
  })
  globalThis.__challenge = options.challenge
  return NextResponse.json({ options })
}