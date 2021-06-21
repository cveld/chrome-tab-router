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

  connectionInfo.clientprincipalname = clientprincipalname;
  context.res.json(connectionInfo);
};

export default httpTrigger;