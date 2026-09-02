// app/api/webauthn/authenticate/verify/route.ts
import { NextResponse } from 'next/server'
import { verifyAuthenticationResponse } from '@simplewebauthn/server'
import { supabase } from '@/lib/supabase'

export async function POST(req: Request) {
  const { authResp } = await req.json()

  // Busca a credencial usada
  const { data: passkey } = await supabase
    .from('passkeys')
    .select('*')
    .eq('credential_id', Buffer.from(authResp.id, 'base64').toString('base64'))
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

  // Atualiza o contador
  await supabase.from('passkeys').update({ counter: verification.authenticationInfo.newCounter }).eq('id', passkey.id)

  // Busca o usuário do Supabase e retorna a sessão
  const { data: user } = await supabase.from('profiles').select('*').eq('id', passkey.user_id).single()

  return NextResponse.json({ success: true, user })
}