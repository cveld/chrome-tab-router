// Mints a test group code blob for local development, using the same AES
// scheme as api/groupcode and the EncryptionKey from api/local.settings.json.
//
// Usage:  node scripts/mint-groupcode.cjs
// Output: prints a one-liner to paste into the extension's service-worker
//         console; setting chrome.storage.local triggers an instant reconnect
//         (see BackgroundGroupcodeHandler.ts).
const fs = require('fs');
const path = require('path');
const CryptoJS = require('crypto-js');
const { v4: uuidv4 } = require('uuid');

const settings = JSON.parse(
  fs.readFileSync(path.join(__dirname, '..', 'local.settings.json'), 'utf8'));
const key = settings.Values.EncryptionKey;

const clientprincipalname = {
  userId: 'local-dev',
  userRoles: ['anonymous', 'authenticated'],
  groupcode: randomUUID()
};
const signature = CryptoJS.AES.encrypt(JSON.stringify(clientprincipalname), key).toString();
const encoded = Buffer.from(JSON.stringify({
  clientprincipalname,
  signature
})).toString('base64');

console.log('\nGroup code (plain):      ' + clientprincipalname.groupcode);
console.log('\nPaste into the extension service worker console:\n');
console.log(`chrome.storage.local.set({ groupcode: { encoded: "${encoded}" } })\n`);
