import { NextResponse } from 'next/server'
import { generateAuthenticationOptions } from '@simplewebauthn/server'
import { createClient } from '@supabase/supabase-js'

export async function POST() {
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const { data: passkeys, error } = await supabaseAdmin.from('passkeys').select('*')

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const options = await generateAuthenticationOptions({
    rpID: process.env.WEBAUTHN_RP_ID || 'localhost',   // ← ADICIONADO
    timeout: 60000,
    allowCredentials: (passkeys || []).map((pk: any) => ({
      id: pk.credential_id,
    })),
    userVerification: 'required',
  })

  ;(globalThis as any).__cleanflowAuthChallenge = options.challenge

  return NextResponse.json({ options })
}