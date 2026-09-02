import { NextResponse } from 'next/server'
import { verifyRegistrationResponse } from '@simplewebauthn/server'
import { supabase } from '@/lib/supabase'

export async function POST(req: Request) {
  const { userId, attResp } = await req.json()
  const verification = await verifyRegistrationResponse({
    response: attResp,
    expectedChallenge: globalThis.__challenge,
    expectedOrigin: process.env.WEBAUTHN_ORIGIN || 'http://localhost:3000',
    expectedRPID: process.env.WEBAUTHN_RP_ID || 'localhost',
  })
  if (!verification.verified || !verification.registrationInfo) {
    return NextResponse.json({ success: false, error: 'Verificação falhou' }, { status: 400 })
  }
  const { registrationInfo } = verification
  await supabase.from('passkeys').insert({
    user_id: userId,
    credential_id: registrationInfo.credentialID,
    public_key: Buffer.from(registrationInfo.credentialPublicKey).toString('base64'),
    counter: registrationInfo.counter,
    device_name: 'Dispositivo do usuário',
  })
  return NextResponse.json({ success: true })
}