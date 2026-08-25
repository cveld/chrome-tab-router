import {
  app,
  HttpRequest,
  HttpResponseInit,
  InvocationContext,
  output,
} from '@azure/functions';
import { decrypt } from '../utility/encryption';

/**
 * SignalR output binding relaying the message onto hub `chat`. SignalR is an
 * extension binding without a typed helper in @azure/functions, so it is
 * declared via output.generic() with the same shape the v1 function.json had.
 */
const signalrOutput = output.generic({
  type: 'signalR',
  hubName: 'chat',
});

interface RelayBody {
  type?: string;
  chromeinstanceid?: string;
  connectionid?: string;
  payload?: unknown;
}

/**
 * Relays one message to all extension instances in the same group: the body
 * becomes a SignalR event with `userId` set to the group code so only members
 * of that group receive it.
 *
 * The extension posts `{ type, chromeinstanceid?, connectionid?, payload? }`
 * with a groupcodeauthorization header; rules/userprofiles/openurl sync all
 * flow through here. Error codes (contract kept from v1):
 * - A0: missing groupcodeauthorization header
 * - A1: payload cannot be decrypted or parsed
 */
export async function messages(
  request: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  const groupcodeauthorization = request.headers.get('groupcodeauthorization');
  if (!groupcodeauthorization) {
    return { status: 400, jsonBody: { ErrorCode: 'A0' } };
  }

  // Lenient parse, matching v1 where req.body arrived pre-parsed and could be
  // null when no JSON body was sent.
  const payload = (await request.json().catch(() => null)) as RelayBody | null;

  try {
    const clientprincipalnamestring = decrypt(groupcodeauthorization);
    const clientprincipalname = JSON.parse(clientprincipalnamestring);

    context.extraOutputs.set(signalrOutput, {
      userId: clientprincipalname.groupcode,
      target: payload?.type,
      arguments: [payload],
    });

    // The old handler echoed the whole v1 request object back as debug cruft;
    // callers ignore this response body, it now just acknowledges what was
    // relayed.
    return { jsonBody: { received: payload ?? null } };
  } catch (e) {
    context.log('ERROR while decrypting groupcode: ', e);
    return { status: 400, jsonBody: { ErrorCode: 'A1' } };
  }
}

app.http('messages', {
  methods: ['POST'],
  authLevel: 'anonymous',
  extraOutputs: [signalrOutput],
  handler: messages,
});
