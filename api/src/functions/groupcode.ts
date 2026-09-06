import { randomUUID } from 'node:crypto';
import {
  app,
  HttpRequest,
  HttpResponseInit,
  InvocationContext,
} from '@azure/functions';
import { encrypt } from '../utility/encryption';

/**
 * Stamps a fresh group code (uuid) onto the Static Web Apps client principal,
 * AES-signs it, and returns the pieces the webapp hands to the extension:
 * `{ clientprincipalname, signature, encoded }`.
 *
 * Ported 1:1 from the v1-model `groupcode/index.ts` + `function.json`
 * (authLevel anonymous, GET+POST). The scaffold hello-world branch and the
 * full request-header dump were dropped; the API contract is unchanged.
 */
export async function groupcode(
  request: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  context.log(`groupcode invoked: ${request.method}`);

  const principalHeader = request.headers.get('x-ms-client-principal');
  if (!principalHeader) {
    return { status: 401 };
  }

  try {
    const principalString = Buffer.from(principalHeader, 'base64').toString();
    const clientprincipalname = JSON.parse(principalString);
    clientprincipalname.groupcode = randomUUID();

    const signature = encrypt(JSON.stringify(clientprincipalname));

    return {
      jsonBody: {
        clientprincipalname,
        signature,
        encoded: Buffer.from(
          JSON.stringify({ clientprincipalname, signature })
        ).toString('base64'),
      },
    };
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    context.log('exception: ', message);
    return { status: 500, jsonBody: { message } };
  }
}

app.http('groupcode', {
  methods: ['GET', 'POST'],
  authLevel: 'anonymous',
  handler: groupcode,
});
