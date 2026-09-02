import { NextResponse } from 'next/server'
import { verifyRegistrationResponse } from '@simplewebauthn/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(req: Request) {
  const { userId, email, attResp } = await req.json()

  const verification = await verifyRegistrationResponse({
    response: attResp,
    expectedChallenge: (globalThis as any).__cleanflowChallenge,
    expectedOrigin: process.env.WEBAUTHN_ORIGIN || 'http://localhost:3000',
    expectedRPID: process.env.WEBAUTHN_RP_ID || 'localhost',
  })

  if (!verification.verified || !verification.registrationInfo) {
    return NextResponse.json({ success: false, error: 'Verificação falhou' }, { status: 400 })
  }

  // Na versão nova, os dados estão dentro de registrationInfo.credential
  const credential = verification.registrationInfo.credential

  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const { error } = await supabaseAdmin.from('passkeys').insert({
    user_id: userId,
    email,
    credential_id: credential.id, // já é string base64url
    public_key: Buffer.from(credential.publicKey).toString('base64'),
    counter: credential.counter,
    device_name: 'Dispositivo do usuário',
  })

  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}