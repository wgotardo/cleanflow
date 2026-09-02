import { NextResponse } from 'next/server'
import { verifyAuthenticationResponse } from '@simplewebauthn/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(req: Request) {
  const { authResp } = await req.json()

  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const { data: passkey, error: findError } = await supabaseAdmin
    .from('passkeys')
    .select('*')
    .eq('credential_id', authResp.id)
    .single()

  if (findError || !passkey) {
    return NextResponse.json({ success: false, error: 'Credencial não encontrada' }, { status: 404 })
  }

  const verification = await verifyAuthenticationResponse({
    response: authResp,
    expectedChallenge: (globalThis as any).__cleanflowAuthChallenge,
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

  await supabaseAdmin
    .from('passkeys')
    .update({ counter: verification.authenticationInfo.newCounter })
    .eq('id', passkey.id)

  const { data, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
    type: 'magiclink',
    email: passkey.email,
  })

  if (linkError || !data?.properties?.action_link) {
    return NextResponse.json({ success: false, error: 'Não foi possível criar a sessão' }, { status: 500 })
  }

  return NextResponse.json({ success: true, redirectUrl: data.properties.action_link })
}