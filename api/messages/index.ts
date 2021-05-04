import { AzureFunction, Context, HttpRequest } from "@azure/functions";
import { decrypt } from "../Utility/encryption";

const httpTrigger: AzureFunction = async function (context: Context, req: HttpRequest): Promise<any> {
  if (!req.body?.groupcode) {
    context.res = {
      status: 400,
      body: {
        "ErrorCode": "A0"
      }
    };
    return;
  }

  const encryptedGroupcode = req.body.groupcode;    
  const clientprincipalnamestring = decrypt(encryptedGroupcode);  
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

  return {
    "userId": clientprincipalname.groupcode,
    "target": "newMessage",
    "arguments": [ req.body ]
  };
};

export default httpTrigger;