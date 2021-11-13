import { AzureFunction, Context, HttpRequest } from "@azure/functions";
import { decrypt } from "../Utility/encryption";

const httpTrigger: AzureFunction = async function (context: Context, req: HttpRequest, connectionInfo: any): Promise<void> {  
  if (!req.headers['groupcode'] || !req.headers['groupcodeauthorization']) {
    context.res = {
      status: 400,
      body: {
        "ErrorCode": "A0",
        "groupcode": req.headers['groupcode'],
        "groupcodeauthorization": req.headers['groupcodeauthorization'],
        "headers": req.headers
      }
    };
    return;
  }
  
  const encryptedGroupcode = req.headers.groupcodeauthorization;  
  
  let clientprincipalnamestring;
  try {        
    clientprincipalnamestring = decrypt(context, encryptedGroupcode);  
  }
  catch (ex) {
    context.res = {
      status: 400,
      body: {
        "ErrorCode": "A2",
        "groupcode": req.headers['groupcode'],
        "groupcodeauthorization": req.headers['groupcodeauthorization'],
        "message": ex.message        
      }
    };
    return;
  }

  try {
    const clientprincipalname = JSON.parse(clientprincipalnamestring);

    if (clientprincipalname.groupcode !== req.headers['groupcode']) {
      context.res = {
        status: 400,
        body: {
          "ErrorCode": "A1"
        }
      };
      return;
    }

    connectionInfo.clientprincipalname = clientprincipalname;
    context.res.json(connectionInfo);
  } catch (ex) {
    console.log('ERROR: Cannot parse json. Is the encryption key set correctly?', ex)
    context.res = {
      status: 400,
      body: {
        "ErrorCode": "A3"
      }
    };
  }
};

export default httpTrigger;