import { NextResponse } from 'next/server'
import { generateAuthenticationOptions } from '@simplewebauthn/server'
import { supabase } from '@/lib/supabase'

export async function POST() {
  const { data: passkeys } = await supabase.from('passkeys').select('*')
  const options = await generateAuthenticationOptions({
    timeout: 60000,
    allowCredentials: (passkeys || []).map((pk) => ({
      id: Buffer.from(pk.credential_id, 'base64'),
      type: 'public-key',
    })),
    userVerification: 'required',
  })
  globalThis.__authChallenge = options.challenge
  return NextResponse.json({ options })
}