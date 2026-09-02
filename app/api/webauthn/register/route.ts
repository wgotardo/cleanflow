import { NextResponse } from 'next/server'
import { generateRegistrationOptions } from '@simplewebauthn/server'

export async function POST(req: Request) {
  const { userId, email, name } = await req.json()

  if (!userId || !email) {
    return NextResponse.json({ error: 'userId e email são obrigatórios' }, { status: 400 })
  }

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

  ;(globalThis as any).__cleanflowChallenge = options.challenge

  return NextResponse.json({ options })
}