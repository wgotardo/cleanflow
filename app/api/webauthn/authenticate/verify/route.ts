import { NextResponse } from 'next/server'
import { verifyAuthenticationResponse } from '@simplewebauthn/server'
import { supabase } from '@/lib/supabase'

export async function POST(req: Request) {
  const { authResp } = await req.json()
  const { data: passkey } = await supabase
    .from('passkeys')
    .select('*')
    .eq('credential_id', authResp.id)
    .single()

  if (!passkey) {
    return NextResponse.json({ success: false, error: 'Credencial não encontrada' }, { status: 404 })
  }

  const verification = await verifyAuthenticationResponse({
    response: authResp,
    expectedChallenge: globalThis.__authChallenge,
    expectedOrigin: process.env.WEBAUTHN_ORIGIN || 'http://localhost:3000',
    expectedRPID: process.env.WEBAUTHN_RP_ID || 'localhost',
    credential: {
      id: passkey.credential_id,
      publicKey: Buffer.from(passkey.public_key, 'base64'),
      counter: passkey.counter,
    },
  })

  if (!verification.verified) {
    return NextResponse.json({ success: false, error: 'Falha na verificação' }, { status: 400 })
  }

  await supabase.from('passkeys').update({ counter: verification.authenticationInfo.newCounter }).eq('id', passkey.id)

  // Cria uma sessão no Supabase para o usuário da passkey
  const { data: { session }, error } = await supabase.auth.admin.generateLink({
    type: 'magiclink',
    email: passkey.user_id, // placeholder - ver nota abaixo
  })

  return NextResponse.json({ success: true, user: passkey })
}