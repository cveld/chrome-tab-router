import { AzureFunction, Context, HttpRequest } from "@azure/functions"
import { encrypt } from "../Utility/encryption";
import { v4 as uuidv4 } from 'uuid';

const httpTrigger: AzureFunction = async function (context: Context, req: HttpRequest): Promise<void> {
    console.log(JSON.stringify(req.headers));
    context.log('HTTP trigger function processed a request.');
    const name = (req.query.name || (req.body && req.body.name));
    const responseMessage = name
        ? "Hello, " + name + ". This HTTP triggered function executed successfully."
        : "This HTTP triggered function executed successfully. Pass a name in the query string or in the request body for a personalized response.";
    
    if (!req.headers['x-ms-client-principal-name']) {
        context.res = {
            status: 401
        }
        return;
    }

    const clientprincipalnameString = Buffer.from(req.headers['x-ms-client-principal-name'], 'base64').toString();
    const clientprincipalname = JSON.parse(clientprincipalnameString);
    clientprincipalname.groupcode = uuidv4();
    const result = encrypt(JSON.stringify(clientprincipalname));
    //const result = 3;   

    context.res = {
        // status: 200, /* Defaults to 200 */
        body: {
            // responseMessage: responseMessage,
            // headers: req.headers,
            clientprincipalname: clientprincipalname,
            signature: result,
            encoded: Buffer.from(JSON.stringify({
                clientprincipalname: clientprincipalname,
                signature: result
            })).toString('base64')            
        }
    };

};

export default httpTrigger;