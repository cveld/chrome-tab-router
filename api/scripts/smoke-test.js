// End-to-end smoke test against the locally running Functions host.
// Mints a fresh groupcode and calls /api/negotiate + /api/messages exactly like
// the extension does (axios-equivalent), avoiding any shell-quoting pitfalls.
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
  groupcode: process.argv[2] || uuidv4()
};
const signature = CryptoJS.AES.encrypt(JSON.stringify(clientprincipalname), key).toString();

(async () => {
  const negotiate = await fetch('http://localhost:7071/api/negotiate', {
    method: 'POST',
    headers: {
      groupcode: clientprincipalname.groupcode,
      groupcodeauthorization: signature
    }
  });
  console.log('negotiate:', negotiate.status);
  const info = await negotiate.json();
  console.log(JSON.stringify({ url: info.url, hasToken: !!info.accessToken }).slice(0, 200));

  const messages = await fetch('http://localhost:7071/api/messages', {
    method: 'POST',
    headers: { 'content-type': 'application/json', groupcodeauthorization: signature },
    body: JSON.stringify({
      type: 'testping',
      chromeinstanceid: 'smoke-test',
      payload: { hello: true }
    })
  });
  console.log('messages:', messages.status, await messages.text());
})().catch(e => { console.error(e); process.exit(1); });
