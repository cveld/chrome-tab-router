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
  const clientprincipalnamestring = decrypt(encryptedGroupcode); 
  context.res = {
    body: {
      "req.headers.groupcodeauthorization": req.headers.groupcodeauthorization,
      "clientprincipalnamestring": clientprincipalnamestring
    }
  } 
  return
  const clientprincipalname = JSON.parse(clientprincipalnamestring);  

  context.res = {
    body: {
      req
    }
  };
  return {
    "userId": clientprincipalname.groupcode,
    "target": req.body.message.type,
    "arguments": [ req.body ]
  };
};

export default httpTrigger;