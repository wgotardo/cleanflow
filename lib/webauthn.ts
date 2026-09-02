import { startRegistration, startAuthentication } from '@simplewebauthn/browser'

export function isBiometricSupported(): boolean {
  return typeof window !== 'undefined' && !!window.PublicKeyCredential
}

export async function registerBiometric(userId: string, email: string, name: string) {
  const res = await fetch('/api/webauthn/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, email, name }),
  })
  const { options } = await res.json()
  const attResp = await startRegistration({ optionsJSON: options })
  const verifyRes = await fetch('/api/webauthn/register/verify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, attResp }),
  })
  return verifyRes.json()
}

export async function loginWithBiometric() {
  const res = await fetch('/api/webauthn/authenticate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({}),
  })
  const { options } = await res.json()
  const authResp = await startAuthentication({ optionsJSON: options })
  const verifyRes = await fetch('/api/webauthn/authenticate/verify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ authResp }),
  })
  return verifyRes.json()
}