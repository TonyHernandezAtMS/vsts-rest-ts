// Type definitions for node-rest-client 3.1.0
// Project: https://github.com/aacerox/node-rest-client
// Definitions by: Tony Hernandez <http://github.com/TonyHernandezAtMS>

declare module 'node-rest-client' {
    export class Client {
        public serializers: any;
        public delete: any;
        public update: any;
        public post: any;
        public patch: any;
        public get: any;
        constructor(options: any);
    }
}
