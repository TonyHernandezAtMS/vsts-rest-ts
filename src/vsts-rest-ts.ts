import * as noderestclient from "node-rest-client";
import * as _ from "underscore";
import { ActualWorkItem, hrefLink, ILogger, IVSTSConfig, NewWorkItem, Operation, OperationArguments, Person, TestCase, TestPlan, TestPoint, TestResult, TestRun, TestSuite, VSTSItem, WIQLResultBase, WorkItemFields, WorkItemRelationship } from "./interfaces/interfaces";

export class WorkItemRelationshipConstants {
    public static readonly ReferencedBy = "Microsoft.VSTS.TestCase.SharedParameterReferencedBy-Forward";
    public static readonly References = "Microsoft.VSTS.TestCase.SharedParameterReferencedBy-Reverse";
    public static readonly TestedBy = "Microsoft.VSTS.Common.TestedBy-Forward";
    public static readonly Tests = "Microsoft.VSTS.Common.TestedBy-Reverse";
    public static readonly TestCase = "Microsoft.VSTS.TestCase.SharedStepReferencedBy-Forward";
    public static readonly SharedSteps = "Microsoft.VSTS.TestCase.SharedStepReferencedBy-Reverse";
    public static readonly Duplicate = "System.LinkTypes.Duplicate-Forward";
    public static readonly DuplicateOf = "System.LinkTypes.Duplicate-Forward";
    public static readonly Successor = "System.LinkTypes.Dependency-Forward";
    public static readonly Predecessor = "System.LinkTypes.Dependency-Reverse";
    public static readonly Child = "System.LinkTypes.Hierarchy-Forward";
    public static readonly Parent = "System.LinkTypes.Hierarchy-Reverse";
    public static readonly Related = "System.LinkTypes.Related";
    public static readonly AttachedFile = "AttachedFile";
    public static readonly Hyperlink = "Hyperlink";
    public static readonly ArtifactLink = "ArtifactLink";
}

const enum Methods {
    GET,
    POST,
    UPDATE,
    DELETE,
    PATCH,
}

export default class VSTSRestClient {
    // VSTS REST API paths
    private readonly vstsProjectRoot = this.vstsConfig.endpoint + "/DefaultCollection/" + this.vstsConfig.project;
    //Test Module
    private readonly vstsTestCases = this.vstsProjectRoot + "/_apis/test/plans/${planID}/suites/${suiteID}";
    private readonly vstsTestPoints = this.vstsProjectRoot + "/_apis/test/plans/${planId}/suites/${suiteId}/points";
    private readonly vstsTestPlans = this.vstsProjectRoot + "/_apis/test/plans";
    private readonly vstsTestPlanSingle = this.vstsProjectRoot + "/_apis/test/plans/${planID}";
    private readonly vstsTestRuns = this.vstsProjectRoot + "/_apis/test/runs";
    private readonly vstsTestResults = this.vstsProjectRoot + "/_apis/test/runs/${runID}/results";
    private readonly vstsTestSuites = this.vstsProjectRoot + "/_apis/test/plans/${planID}/suites";
    //WIT
    private readonly vstsWorkItems = this.vstsConfig.endpoint + "/_apis/wit/workitems";
    private readonly vstsCreateWorkItems = this.vstsProjectRoot + "/_apis/wit/workitems/${workItemType}";
    //WIQL
    private readonly vstsStoredQuery = this.vstsConfig.endpoint + "/_apis/wit/wiql/${id}";
    private readonly vstsExecuteWIQL = this.vstsProjectRoot + "/_apis/wit/wiql";

    private log: ILogger;

    constructor(public vstsConfig: IVSTSConfig, logger: ILogger) {
        this.log = logger;
    }

    private ClientFactory(): VSTSOperation {
        return new VSTSOperation(this.vstsConfig.username, this.vstsConfig.password, this.log);
    }

    public async AddWorkItem(item: NewWorkItem) {
        let payload: Array<{ "op": string, "path": string, "value": any }> = [];
        for (let key in item.fields) {
            if (item.fields.hasOwnProperty(key)) {
                let value = item.fields[key];
                payload.push({ op: "add", path: "/fields/" + key, value: value });
            }
        }

        if (item.relations) {
            item.relations.forEach((rel) => {
                payload.push({ op: "add", path: "/relations/-", value: rel });
            });
        }

        const path: { [index: string]: string } = {};
        path.workItemType = "$" + item.workItemType;

        let returnItem = await this.ClientFactory().ExecuteOperation<ActualWorkItem>(Methods.PATCH, this.vstsCreateWorkItems, { data: payload, path });
        return returnItem;
    }

    public async UpdateWorkItem(originalItem: ActualWorkItem, changeFieldList?: { [fieldName: string]: string | number | null }, changeRelationList?: WorkItemRelationship[]) {
        let payload: Array<{ "op": string, "path": string, "value"?: any }> = [];

        if (changeFieldList) {
            for (const key in changeFieldList) {
                if (changeFieldList.hasOwnProperty(key)) {
                    const value = changeFieldList[key];
                    let op: string;
                    op = !originalItem.fields.hasOwnProperty(key) ? "add" : (value == null ? "remove" : "replace");
                    payload.push({ op: op, path: "/fields/" + key, value: value });
                }
            }
        }

        if (changeRelationList) {
            let origTargets = {};
            let newTargets = _.indexBy(changeRelationList, "url");
            if (originalItem.relations) {
                origTargets = _.indexBy(originalItem.relations, "url");
            }
            let updateKeys = _.intersection(_.keys(newTargets), _.keys(origTargets));
            let newKeys = _.difference(_.keys(newTargets), _.keys(origTargets));
            let removeKeys = _.difference(_.keys(origTargets), _.keys(newTargets));

            removeKeys.forEach((url) => {
                const index = _.findIndex<WorkItemRelationship>( originalItem.relations as _.List<WorkItemRelationship>, (rel) => rel.url == url);
                payload.push({ op: "remove", path: "/relations/" + index.toString() });
            });

            newKeys.forEach((url) => {
                const index = _.findIndex<WorkItemRelationship>( changeRelationList as _.List<WorkItemRelationship>, (rel) => rel.url == url);
                payload.push({ op: "add", path: "/relations/-", value: changeRelationList[index] });
            });

            updateKeys.forEach((url) => {
                const index = _.findIndex<WorkItemRelationship>( originalItem.relations as _.List<WorkItemRelationship>, (rel) => rel.url == url);
                const value = newTargets[url];
                const updates = _.intersection(_.keys(value.attributes), _.keys(originalItem.relations![index].attributes)); // Using non-null assertion operator on relations. Tests need to be written to validate.
                updates.forEach((key) => {
                    payload.push({ op: "replace", path: "/relations/" + index.toString() + "/attributes/" + key, value: value.attributes[key] });
                });
            });
        }

        let returnItem = await this.ClientFactory().ExecuteOperation<ActualWorkItem>(Methods.PATCH, this.vstsWorkItems + "/" + originalItem.id, { data: payload });
        return returnItem;
    }

    public async GetActualWorkItemFromUrl(url: string, fields?: string[], includeRelationships?: boolean) {
        const parameters: { [index: string]: string } = {};
        if (fields) {
            parameters["fields"] = fields.join();
        }
        if (includeRelationships != undefined && includeRelationships === true) {
            parameters["$expand"] = "all";
        }
        return this.ClientFactory().ExecuteOperation<ActualWorkItem>(Methods.GET, url, { parameters });
    }

    public async GetItemFromUrl<T>(url: string) {
        return this.ClientFactory().ExecuteOperation<T>(Methods.GET, url, {});
    }

    public async GetWorkItems(items: VSTSItem[], fields?: string[]): Promise<ActualWorkItem[]>;
    public async GetWorkItems(ids: number[], fields?: string[]): Promise<ActualWorkItem[]>;
    public async GetWorkItems(itemsOrIds: VSTSItem[] | number[], fields?: string[]): Promise<ActualWorkItem[]> {
        let ids: number[];

        if (( (itemsOrIds[0]) as VSTSItem).id) {
            const items: VSTSItem[] =  itemsOrIds as VSTSItem[];
            ids = _.map<VSTSItem, number>(items, (item: VSTSItem) => item.id);
        } else {
            ids =  itemsOrIds as number[];
        }

        if (ids.length > 200) {
            const first = await this.GetWorkItems(ids.slice(0, 200), fields);
            const second = await this.GetWorkItems(ids.slice(200, ids.length), fields);
            const x = _.union<ActualWorkItem>(first, second);
            return x;
        }

        const parameters: { [index: string]: string } = {};
        parameters.ids = ids.join();

        if (fields) {
            parameters.fields = fields.join();
        } else {
            parameters["$expand"] = "all";
        }
        const value = await this.ClientFactory().ExecuteOperation<ActualWorkItem[]>(Methods.GET, this.vstsWorkItems, { parameters });
        return value;
    }

    public async GetTestPoints(planID: number, suiteID: number, testcaseID?: number, configurationID?: number): Promise<TestPoint[]> {
        const path: { [index: string]: number } = {};

        path.planId = planID;
        path.suiteID = suiteID;

        const parameters: { [index: string]: string } = {};

        parameters.includePointDetails = "true";

        if (testcaseID) {
            parameters["testCaseId"] = testcaseID.toString();
        }
        if (configurationID) {
            parameters["configurationId"] = configurationID.toString();
        }
        return this.ClientFactory().ExecuteOperation<TestPoint[]>(Methods.GET, this.vstsTestPoints, { path, parameters });
    }

    public async GetTestPlans(owner: string): Promise<TestPlan[]> {

        const parameters: { [index: string]: string } = {};
        parameters.includePlanDetails = "true";
        parameters.owner = owner;

        return this.ClientFactory().ExecuteOperation<TestPlan[]>(Methods.GET, this.vstsTestPlans, { parameters });
    }

    public async GetResultsFromStoredQuery(queryId: number): Promise<Object> {
        const path: { [index: string]: number } = {};
        path.id = queryId;
        return this.ClientFactory().ExecuteOperation(Methods.GET, this.vstsStoredQuery, { path });
    }

    public async GetTestRuns(testPlan: TestPlan): Promise<TestRun[]> {
        const parameters: { [index: string]: string } = {};
        parameters.planId = testPlan.id.toString();
        parameters.includeRunDetails = "true";

        return this.ClientFactory().ExecuteOperation<TestRun[]>(Methods.GET, this.vstsTestRuns, { parameters });
    }

    public async GetTestResults(testRun: TestRun) {
        return this.GetTestResult<TestResult[]>(this.vstsTestResults, {path: {runID: testRun.id}});
    }

    public async GetTestResult<T>(url: string, args: OperationArguments) {
        const parameters: { [index: string]: string } = {};
        parameters.detailsToInclude = "WorkItems";
        parameters.$top = "100";
        args.parameters = parameters;
        return this.ClientFactory().ExecuteOperation<T>(Methods.GET, url, args);
    }

    public async GetTestSuites(testPlan: TestPlan): Promise<TestSuite[]> {
        const path: { [index: string]: number } = {};
        path.planID = testPlan.id;
        return this.ClientFactory().ExecuteOperation<TestSuite[]>(Methods.GET, this.vstsTestSuites, { path });
    }

    public async GetTestPlan(id: number): Promise<TestPlan> {
        const path: { [index: string]: number } = {};

        path.planID = id;
        return this.ClientFactory().ExecuteOperation<TestPlan>(Methods.GET, this.vstsTestPlanSingle, { path });
    }
    public async GetTestCases(testPlan: TestPlan, testSuite: TestSuite): Promise<TestCase[]> {
        const path: { [index: string]: number } = {};
        path.planID = testPlan.id;
        path.suiteID = testSuite.id;
        return this.ClientFactory().ExecuteOperation<TestCase[]>(Methods.GET, this.vstsTestCases, { path });
    }

    public async ExecuteQuery<T extends WIQLResultBase>(query: string) {
        return this.ClientFactory().ExecuteOperation<T>(Methods.POST, this.vstsExecuteWIQL, {
            data: {
                query
            },
        });
    }
}

class VSTSOperation {
    private client: noderestclient.Client;

    private static throttled = false;
    private log: ILogger;
    constructor(username: string, password: string, logger: ILogger) {
        this.log = logger;
        // Connect to VSTS
        const options_auth: any = {
            user: username
            , password
            , connection: {
                headers: {
                    "Accept": "application/json; api-version=3.0",
                    "Content-Type": "application/json",
                },
            }
            , mimetypes: {
                json: ["application/json", "application/json;charset=utf-8", "application/json;api-version=3.0", "application/json;charset=utf-8;api-version=3.0"]
                , xml: ["application/xml", "application/xml;charset=utf-8"],
            }
            , requestConfig: {
                noDelay: true,
                keepAlive: true,
            },
        };

        if (process.env.FIDDLER) {
            options_auth.proxy = {
                host: "localhost"
                , port: 8888
                , tunnel: true,
            };
        }

        this.client = new noderestclient.Client(options_auth);

        let JSONSerializer = this.client.serializers.find("JSON");
        JSONSerializer.isDefault = true;
        this.client.serializers.clean();
        this.client.serializers.add(JSONSerializer);
    }

    public async ExecuteOperation<T>(method: Methods, URL: string, args: OperationArguments): Promise<T> {
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
                args.headers["Content-Type"] = "application/json-patch+json";
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
                    VSTSOperation.throttled = true;

                    this.log.info(`Retrying: ${response.req.path}`);

                    this.ExecuteOperation<T>(method, URL, args)
                        .then((x: T) => {
                            this.log.info("SUCCESS: retry");
                            VSTSOperation.throttled = false;
                            fulfill(x);
                        })
                        .catch((reason: any) => {
                            this.log.info("retry: FAILED");
                            this.log.info(reason.toString());
                        });
                } else {
                    this.log.info(response.statusCode);
                    this.log.info(response.statusMessage);
                    this.log.info(response.req.path);
                    if (Buffer.isBuffer(data)) {
                        this.log.info(data.toString("utf8"));
                    } else
                        if (typeof data === "object") {
                            Object.keys(data).map((e) => this.log.info(`key=${e}  value=${data[e]}`));
                        } else {
                            this.log.info(data.toString("utf8"));
                        }
                    reject(response);
                }
            });
        },
        );

    }
}
