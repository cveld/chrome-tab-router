import {
  app,
  HttpRequest,
  HttpResponseInit,
  InvocationContext,
  input,
} from '@azure/functions';
import { decrypt } from '../utility/encryption';

/**
 * SignalR connection-info input for hub `chat`, keyed to the caller's
 * groupcode header. This is the same binding the v1 function.json declared;
 * connectionStringSetting is omitted because its default value is exactly the
 * setting both local.settings and the deployed Static Web App provide:
 * AzureSignalRConnectionString.
 *
 * SignalR is an extension binding without a typed helper in @azure/functions,
 * so it is declared via input.generic() with the same JSON shape.
 */
const connectionInfoInput = input.generic({
  type: 'signalRConnectionInfo',
  hubName: 'chat',
  userId: '{headers.groupcode}',
});

/**
 * Validates that the caller's groupcode header matches the AES-encrypted
 * payload in groupcodeauthorization, then returns the SignalR connection info
 * enriched with the decrypted client principal. Called by @microsoft/signalr
 * in every extension instance when connecting to `{apiBaseUrl}/api`.
 *
 * Error codes (contract kept from v1):
 * - A0: missing headers
 * - A1: decrypted groupcode does not match header
 * - A2: groupcodeauthorization cannot be decrypted (wrong key?)
 * - A3: decrypted payload is not valid JSON
 */
export async function negotiate(
  request: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  const groupcode = request.headers.get('groupcode');
  const groupcodeauthorization = request.headers.get('groupcodeauthorization');
  if (!groupcode || !groupcodeauthorization) {
    return {
      status: 400,
      jsonBody: { ErrorCode: 'A0', groupcode, groupcodeauthorization },
    };
  }

  let clientprincipalnamestring: string;
  try {
    clientprincipalnamestring = decrypt(groupcodeauthorization);
  } catch (ex) {
    const message = ex instanceof Error ? ex.message : String(ex);
    return {
      status: 400,
      jsonBody: {
        ErrorCode: 'A2',
        groupcode,
        groupcodeauthorization,
        message,
      },
    };
  }

  try {
    const clientprincipalname = JSON.parse(clientprincipalnamestring);
    if (clientprincipalname.groupcode !== groupcode) {
      return { status: 400, jsonBody: { ErrorCode: 'A1' } };
    }

    const connectionInfo = context.extraInputs.get(connectionInfoInput) as Record<
      string,
      unknown
    >;
    connectionInfo.clientprincipalname = clientprincipalname;
    return { jsonBody: connectionInfo };
  } catch (ex) {
    context.log('ERROR: Cannot parse json. Is the encryption key set correctly?', ex);
    return { status: 400, jsonBody: { ErrorCode: 'A3' } };
  }
}

// The v1 trigger declared no methods list, meaning every HTTP method was
// accepted; omitting methods here preserves that.
app.http('negotiate', {
  authLevel: 'anonymous',
  extraInputs: [connectionInfoInput],
  handler: negotiate,
});
