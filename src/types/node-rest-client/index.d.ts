// Type definitions for node-rest-client 3.1.0
// Project: https://github.com/aacerox/node-rest-client
// Definitions by: Tony Hernandez <http://github.com/TonyHernandezAtMS>

declare module "node-rest-client" {
    export class Client {
        constructor(options:any);
        serializers:any;
        delete:any;
        update:any;
        post:any;
        patch:any;
        get:any;
    }
}