import { AzureFunction, Context, HttpRequest } from "@azure/functions";
import { decrypt } from "../Utility/encryption";

const httpTrigger: AzureFunction = async function (context: Context, req: HttpRequest): Promise<any> {
  if (!req.headers.groupcodeauthorization) {
    context.res = {
      status: 400,
      body: {
        "ErrorCode": "A0"
      }
    };
    return;
  }

  const encryptedGroupcode = req.headers.groupcodeauthorization;   
  try { 
    const clientprincipalnamestring = decrypt(context, encryptedGroupcode); 
    const clientprincipalname = JSON.parse(clientprincipalnamestring);  

    context.res = {
      body: {
        req
      }
    };
    return {
      "userId": clientprincipalname.groupcode,
      "target": req.body.type,
      "arguments": [ req.body ]
    };
  } catch(e) {
    context.log('ERROR while decrypting groupcode: ', e);
    context.res = {
      status: 400,
      body: {
        "ErrorCode": "A1"
      }
    };
    return;
  }
};

export default httpTrigger;