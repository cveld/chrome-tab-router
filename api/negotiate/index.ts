import { AzureFunction, Context, HttpRequest } from "@azure/functions";
import { decrypt } from "../Utility/encryption";

const httpTrigger: AzureFunction = async function (context: Context, req: HttpRequest, connectionInfo: any): Promise<void> {  
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

  connectionInfo.clientprincipalname = clientprincipalname;
  context.res.json(connectionInfo);
};

export default httpTrigger;