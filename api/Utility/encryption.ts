import * as CryptoJS from 'crypto-js';

export function encrypt(message: string): string {
    if (!process.env['EncryptionKey']) {
        throw "Encryption: Environment variable 'EncryptionKey' not set"
    }
    const result = CryptoJS.AES.encrypt(message, process.env['EncryptionKey']).toString();
    return result;
}

export function decrypt(message: string): string {
    if (!process.env['EncryptionKey']) {
        throw "Encryption: Environment variable 'EncryptionKey' not set"
    }
    const result = CryptoJS.AES.decrypt(message, process.env['EncryptionKey']).toString(CryptoJS.enc.Utf8);
    return result;
}