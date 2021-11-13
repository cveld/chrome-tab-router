import * as CryptoJS from 'crypto-js';

// Encrypt
var ciphertext = CryptoJS.AES.encrypt('my message', 'secret key 123').toString();

// Decrypt
var bytes  = CryptoJS.AES.decrypt(ciphertext, 'secret key 123');
console.log('bytes', bytes);
var originalText = bytes.toString(CryptoJS.enc.Utf8);

console.log(originalText); // 'my message'