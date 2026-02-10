/**
 * パスワード暗号化モジュール
 * AES-GCMを使用してパスワードを暗号化・復号する
 */

const ALGORITHM = "AES-GCM";
const IV_LENGTH = 12; // GCMの推奨IV長

/**
 * 環境変数から暗号化キーを取得してCryptoKeyオブジェクトを作成
 */
async function getEncryptionKey(encryptionKeyBase64: string): Promise<CryptoKey> {
  const keyBuffer = Uint8Array.from(atob(encryptionKeyBase64), (c) =>
    c.charCodeAt(0),
  );
  return crypto.subtle.importKey(
    "raw",
    keyBuffer,
    { name: ALGORITHM },
    false,
    ["encrypt", "decrypt"],
  );
}

/**
 * パスワードを暗号化する
 *
 * @param password - 平文パスワード
 * @param encryptionKeyBase64 - Base64エンコードされた暗号化キー
 * @returns IV + 暗号文をBase64エンコードした文字列
 */
export async function encryptPassword(
  password: string,
  encryptionKeyBase64: string,
): Promise<string> {
  const key = await getEncryptionKey(encryptionKeyBase64);
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));
  const encoder = new TextEncoder();
  const data = encoder.encode(password);

  const encryptedBuffer = await crypto.subtle.encrypt(
    { name: ALGORITHM, iv },
    key,
    data,
  );

  // IV + 暗号文を連結
  const combined = new Uint8Array(iv.length + encryptedBuffer.byteLength);
  combined.set(iv, 0);
  combined.set(new Uint8Array(encryptedBuffer), iv.length);

  // Base64エンコード
  return btoa(String.fromCharCode(...combined));
}

/**
 * 暗号化されたパスワードを復号する
 *
 * @param encryptedData - IV + 暗号文をBase64エンコードした文字列
 * @param encryptionKeyBase64 - Base64エンコードされた暗号化キー
 * @returns 復号された平文パスワード
 */
export async function decryptPassword(
  encryptedData: string,
  encryptionKeyBase64: string,
): Promise<string> {
  const key = await getEncryptionKey(encryptionKeyBase64);

  // Base64デコード
  const combined = Uint8Array.from(atob(encryptedData), (c) =>
    c.charCodeAt(0),
  );

  // IVと暗号文を分離
  const iv = combined.slice(0, IV_LENGTH);
  const ciphertext = combined.slice(IV_LENGTH);

  const decryptedBuffer = await crypto.subtle.decrypt(
    { name: ALGORITHM, iv },
    key,
    ciphertext,
  );

  const decoder = new TextDecoder();
  return decoder.decode(decryptedBuffer);
}
