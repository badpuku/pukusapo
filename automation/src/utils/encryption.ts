/**
 * パスワード暗号化ユーティリティ
 * AES-GCM を使用してパスワードを暗号化する
 */

const ALGORITHM = 'AES-GCM'
const IV_LENGTH = 12

async function getEncryptionKey(encryptionKeyBase64: string): Promise<CryptoKey> {
  const keyBuffer = Uint8Array.from(atob(encryptionKeyBase64), (c) => c.charCodeAt(0))
  return crypto.subtle.importKey('raw', keyBuffer, { name: ALGORITHM }, false, ['encrypt'])
}

export async function encryptPassword(password: string, encryptionKeyBase64: string): Promise<string> {
  const key = await getEncryptionKey(encryptionKeyBase64)
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH))
  const encoder = new TextEncoder()
  const data = encoder.encode(password)

  const encryptedBuffer = await crypto.subtle.encrypt({ name: ALGORITHM, iv }, key, data)

  const combined = new Uint8Array(iv.length + encryptedBuffer.byteLength)
  combined.set(iv, 0)
  combined.set(new Uint8Array(encryptedBuffer), iv.length)

  return btoa(String.fromCharCode(...combined))
}
