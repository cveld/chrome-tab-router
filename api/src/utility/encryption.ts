import * as CryptoJS from 'crypto-js';

function requireEncryptionKey(): string {
  const key = process.env['EncryptionKey'];
  if (!key) {
    throw new Error("Encryption: Environment variable 'EncryptionKey' not set");
  }
  return key;
}

export function encrypt(message: string): string {
  return CryptoJS.AES.encrypt(message, requireEncryptionKey()).toString();
}

export function decrypt(message: string): string {
  const intermediate = CryptoJS.AES.decrypt(message, requireEncryptionKey());
  return intermediate.toString(CryptoJS.enc.Utf8);
}
