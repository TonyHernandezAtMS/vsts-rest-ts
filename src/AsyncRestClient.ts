import * as noderestclient from 'node-rest-client';
import { Methods } from './interfaces/enums';
import { IAsyncRestClient, ILogger, IOperationArguments, Operation } from './interfaces/interfaces';

export default class AsyncRestClient implements IAsyncRestClient {
    private static throttled = false;
    private client: noderestclient.Client;

    private log: ILogger;
    constructor(username: string, password: string, logger: ILogger) {
        this.log = logger;
        // Connect to VSTS
        const optionsAuth: any = {
            user: username
            , password
            , connection: {
                headers: {
                    'Accept': 'application/json; api-version=3.0',
                    'Content-Type': 'application/json',
                },
            }
            , mimetypes: {
                json: ['application/json', 'application/json;charset=utf-8',
                'application/json;api-version=3.0', 'application/json;charset=utf-8;api-version=3.0']
                , xml: ['application/xml', 'application/xml;charset=utf-8'],
            }
            , requestConfig: {
                noDelay: true,
                keepAlive: true,
            },
        };

        if (process.env.FIDDLER) {
            optionsAuth.proxy = {
                host: 'localhost'
                , port: 8888
                , tunnel: true,
            };
        }

        this.client = new noderestclient.Client(optionsAuth);

        const JSONSerializer = this.client.serializers.find('JSON');
        JSONSerializer.isDefault = true;
        this.client.serializers.clean();
        this.client.serializers.add(JSONSerializer);
    }

    public async ExecuteOperation<T>(method: Methods, URL: string, args: IOperationArguments): Promise<T> {
        let opMethod: Operation;
        switch (method) {
            case Methods.DELETE:
                opMethod = this.client.delete;
                break;
            case Methods.UPDATE:
                opMethod = this.client.update;
                break;
            case Methods.POST:
                opMethod = this.client.post;
                break;
            case Methods.PATCH:
                opMethod = this.client.patch;
                args.headers = args.headers || {};
                args.headers['Content-Type'] = 'application/json-patch+json';
                break;
            default:
                opMethod = this.client.get;
                break;
        }

        return new Promise<T>((fulfill, reject) => {

            opMethod(URL, args, (data: any, response: any) => {
                if (response.statusCode === 200) {
                    if (data.count > 0) {
                        fulfill(data.value);
                    } else {
                        fulfill(data);
                    }
                } else if (response.statusCode === 503) {
                    AsyncRestClient.throttled = true;

                    this.log.info(`Retrying: ${response.req.path}`);

                    this.ExecuteOperation<T>(method, URL, args)
                        .then((x: T) => {
                            this.log.info('SUCCESS: retry');
                            AsyncRestClient.throttled = false;
                            fulfill(x);
                        })
                        .catch((reason: any) => {
                            this.log.info('retry: FAILED');
                            this.log.info(reason.toString());
                        });
                } else {
                    this.log.info(response.statusCode);
                    this.log.info(response.statusMessage);
                    this.log.info(response.req.path);
                    if (Buffer.isBuffer(data)) {
                        this.log.info(data.toString('utf8'));
                    } else
                        if (typeof data === 'object') {
                            Object.keys(data).map((e) => this.log.info(`key=${e}  value=${data[e]}`));
                        } else {
                            this.log.info(data.toString('utf8'));
                        }
                    reject(response);
                }
            });
        },
        );

    }
}
