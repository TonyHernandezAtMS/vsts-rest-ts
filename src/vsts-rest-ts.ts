import * as _ from "underscore";
import * as noderestclient from "node-rest-client";
import { VSTSItem, WorkItemFields, hrefLink, Person, ILogger, IVSTSConfig, TestPlan, TestRun, TestResult, OperationArguments, TestSuite, WIQLResultBase, TestCase, Operation, NewWorkItem, ActualWorkItem, WorkItemRelationship, TestPoint } from "./interfaces/interfaces";

export class WorkItemRelationshipConstants {
    static readonly ReferencedBy = "Microsoft.VSTS.TestCase.SharedParameterReferencedBy-Forward";
    static readonly References = "Microsoft.VSTS.TestCase.SharedParameterReferencedBy-Reverse";
    static readonly TestedBy = "Microsoft.VSTS.Common.TestedBy-Forward";
    static readonly Tests = "Microsoft.VSTS.Common.TestedBy-Reverse";
    static readonly TestCase = "Microsoft.VSTS.TestCase.SharedStepReferencedBy-Forward";
    static readonly SharedSteps = "Microsoft.VSTS.TestCase.SharedStepReferencedBy-Reverse";
    static readonly Duplicate = "System.LinkTypes.Duplicate-Forward";
    static readonly DuplicateOf = "System.LinkTypes.Duplicate-Forward";
    static readonly Successor = "System.LinkTypes.Dependency-Forward";
    static readonly Predecessor = "System.LinkTypes.Dependency-Reverse";
    static readonly Child = "System.LinkTypes.Hierarchy-Forward";
    static readonly Parent = "System.LinkTypes.Hierarchy-Reverse";
    static readonly Related = "System.LinkTypes.Related";
    static readonly AttachedFile = "AttachedFile";
    static readonly Hyperlink = "Hyperlink";
    static readonly ArtifactLink = "ArtifactLink";
}

const enum Methods {
    GET,
    POST,
    UPDATE,
    DELETE,
    PATCH
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
    private readonly vstsStoredQuery = this.vstsConfig.endpoint + "/_apis/wit/wiql/${id}"
    private readonly vstsExecuteWIQL = this.vstsProjectRoot + "/_apis/wit/wiql";

    private log:ILogger;

    constructor(public vstsConfig: IVSTSConfig, logger:ILogger) {
        this.log = logger;
    }

    private ClientFactory(): VSTSOperation {
        return new VSTSOperation(this.vstsConfig.username, this.vstsConfig.password, this.log);
    }

    async AddWorkItem(item: NewWorkItem) {
        var payload: ({ "op": string, "path": string, "value": any })[] = [];
        for (var key in item.fields) {
            if (item.fields.hasOwnProperty(key)) {
                var value = item.fields[key];
                payload.push({ "op": "add", "path": "/fields/" + key, "value": value });
            }
        }

        if (item.relations) {
            item.relations.forEach(rel => {
                payload.push({ "op": "add", "path": "/relations/-", "value": rel });
            });
        }

        let path: { [index: string]: string } = {};
        path["workItemType"] = "$" + item.workItemType;

        var returnItem = await this.ClientFactory().ExecuteOperation<ActualWorkItem>(Methods.PATCH, this.vstsCreateWorkItems, { data: payload, path: path });
        return returnItem;
    }

    async UpdateWorkItem(originalItem: ActualWorkItem, changeFieldList?: { [fieldName: string]: string | number | null }, changeRelationList?: WorkItemRelationship[]) {
        var payload: ({ "op": string, "path": string, "value"?: any })[] = [];

        if (changeFieldList) {
            for (let key in changeFieldList) {
                if (changeFieldList.hasOwnProperty(key)) {
                    let value = changeFieldList[key];
                    let op: string;
                    op = !originalItem.fields.hasOwnProperty(key) ? "add" : (value == null ? "remove" : "replace");
                    payload.push({ "op": op, "path": "/fields/" + key, "value": value });
                }
            }
        }

        if (changeRelationList) {
            var origTargets = {};
            var newTargets = _.indexBy(changeRelationList, 'url');
            if (originalItem.relations) {
                origTargets = _.indexBy(originalItem.relations, 'url');
            }
            var updateKeys = _.intersection(_.keys(newTargets), _.keys(origTargets));
            var newKeys = _.difference(_.keys(newTargets), _.keys(origTargets));
            var removeKeys = _.difference(_.keys(origTargets), _.keys(newTargets));

            removeKeys.forEach(url => {
                let index = _.findIndex<WorkItemRelationship>(<_.List<WorkItemRelationship>>originalItem.relations, rel => rel.url == url);
                payload.push({ "op": "remove", "path": "/relations/" + index.toString() });
            });

            newKeys.forEach(url => {
                let index = _.findIndex<WorkItemRelationship>(<_.List<WorkItemRelationship>>changeRelationList, rel => rel.url == url);
                payload.push({ "op": "add", "path": "/relations/-", "value": changeRelationList[index] });
            });

            updateKeys.forEach(url => {
                let index = _.findIndex<WorkItemRelationship>(<_.List<WorkItemRelationship>>originalItem.relations, rel => rel.url == url);
                let value = newTargets[url];
                let updates = _.intersection(_.keys(value.attributes), _.keys(originalItem.relations![index].attributes));
                updates.forEach(key => {
                    payload.push({ "op": "replace", "path": "/relations/" + index.toString() + "/attributes/" + key, "value": value.attributes[key] });
                });
            });
        }

        var returnItem = await this.ClientFactory().ExecuteOperation<ActualWorkItem>(Methods.PATCH, this.vstsWorkItems + "/" + originalItem.id, { data: payload });
        return returnItem;
    }

    async GetActualWorkItemFromUrl(url: string, fields?: string[], includeRelationships?: boolean) {
        let parameters: { [index: string]: string } = {};
        if (fields)
            parameters["fields"] = fields.join();
        if (includeRelationships != undefined && includeRelationships === true)
            parameters["$expand"] = "all";
        return this.ClientFactory().ExecuteOperation<ActualWorkItem>(Methods.GET, url, { parameters: parameters });
    }

    async GetItemFromUrl<T>(url: string) {
        return this.ClientFactory().ExecuteOperation<T>(Methods.GET, url,{});
    }

    async GetWorkItems(items: VSTSItem[], fields?: string[]): Promise<ActualWorkItem[]>;
    async GetWorkItems(ids: number[], fields?: string[]): Promise<ActualWorkItem[]>;
    async GetWorkItems(itemsOrIds: VSTSItem[] | number[], fields?: string[]): Promise<ActualWorkItem[]> {
        let ids: number[];

        if ((<VSTSItem>(itemsOrIds[0])).id) {
            let items: VSTSItem[] = <VSTSItem[]>itemsOrIds;
            ids = _.map<VSTSItem, number>(items, (item: VSTSItem) => item.id);
        }
        else {
            ids = <number[]>itemsOrIds;
        }

        if (ids.length > 200) {
            let first = await this.GetWorkItems(ids.slice(0, 200), fields);
            let second = await this.GetWorkItems(ids.slice(200, ids.length), fields);
            let x = _.union<ActualWorkItem>(first, second);
            return x;
        }

        let parameters: { [index: string]: string } = {};
        parameters["ids"] = ids.join();

        if (fields) {
            parameters["fields"] = fields.join();
        } else {
            parameters['$expand'] = 'all';
        }
        let value = await this.ClientFactory().ExecuteOperation<ActualWorkItem[]>(Methods.GET, this.vstsWorkItems, { parameters: parameters });
        return value;
    }

    async GetTestPoints(planID: number, suiteID: number, testcaseID?: number, configurationID?: number): Promise<TestPoint[]> {
        let path: { [index: string]: number } = {};

        path["planId"] = planID;
        path["suiteID"] = suiteID;

        let parameters: { [index: string]: string } = {};

        parameters["includePointDetails"] = "true";

        if (testcaseID) {
            parameters['testCaseId'] = testcaseID.toString();
        }
        if (configurationID) {
            parameters['configurationId'] = configurationID.toString();
        }
        return this.ClientFactory().ExecuteOperation<TestPoint[]>(Methods.GET, this.vstsTestPoints, { path, parameters });
    }

    async GetTestPlans(owner: string): Promise<TestPlan[]> {

        let parameters: { [index: string]: string } = {};
        parameters["includePlanDetails"] = "true";
        parameters["owner"] = owner;

        return this.ClientFactory().ExecuteOperation<TestPlan[]>(Methods.GET, this.vstsTestPlans, { parameters });
    }

    async GetResultsFromStoredQuery(queryId: number): Promise<Object> {
        let path: { [index: string]: number } = {};
        path["id"] = queryId;
        return this.ClientFactory().ExecuteOperation(Methods.GET, this.vstsStoredQuery, { path });
    }

    async GetTestRuns(testPlan: TestPlan): Promise<TestRun[]> {
        let parameters: { [index: string]: string } = {};
        parameters["planId"] = testPlan.id.toString();
        parameters["includeRunDetails"] = "true";

        return this.ClientFactory().ExecuteOperation<TestRun[]>(Methods.GET, this.vstsTestRuns, { parameters });
    }

    async GetTestResults(testRun: TestRun) {
        return this.GetTestResult<TestResult[]>(this.vstsTestResults, {path: {"runID":testRun.id}});
    };

    async GetTestResult<T>(url: string, args:OperationArguments) {
        let parameters: { [index: string]: string } = {};
        parameters["detailsToInclude"] = "WorkItems";
        parameters["$top"] = "100";
        args.parameters = parameters;
        return this.ClientFactory().ExecuteOperation<T>(Methods.GET, url, args);
    }

    async GetTestSuites(testPlan: TestPlan): Promise<TestSuite[]> {
        let path: { [index: string]: number } = {};
        path["planID"] = testPlan.id;
        return this.ClientFactory().ExecuteOperation<TestSuite[]>(Methods.GET, this.vstsTestSuites, { path });
    };

    async GetTestPlan(id: number): Promise<TestPlan> {
        let path: { [index: string]: number } = {};

        path["planID"] = id;
        return this.ClientFactory().ExecuteOperation<TestPlan>(Methods.GET, this.vstsTestPlanSingle, { path });
    }
    async GetTestCases(testPlan: TestPlan, testSuite: TestSuite): Promise<TestCase[]> {
        let path: { [index: string]: number } = {};
        path["planID"] = testPlan.id;
        path["suiteID"] = testSuite.id;
        return this.ClientFactory().ExecuteOperation<TestCase[]>(Methods.GET, this.vstsTestCases, { path });
    };

    async ExecuteQuery<T extends WIQLResultBase>(query: string) {
        return this.ClientFactory().ExecuteOperation<T>(Methods.POST, this.vstsExecuteWIQL, {
            data: {
                query: query
            }
        });
    }
}

class VSTSOperation {
    private client: noderestclient.Client;

    private static throttled = false;
    private log:ILogger;
    constructor(username: string, password: string, logger:ILogger) {
        this.log = logger;
        // Connect to VSTS
        const options_auth: any = {
            user: username
            , password: password
            , connection: {
                headers: {
                    "Accept": "application/json; api-version=3.0",
                    "Content-Type": "application/json"
                }
            }
            , mimetypes: {
                json: ["application/json", "application/json;charset=utf-8", "application/json;api-version=3.0", "application/json;charset=utf-8;api-version=3.0"]
                , xml: ["application/xml", "application/xml;charset=utf-8"]
            }
            , requestConfig: {
                noDelay: true,
                keepAlive: true
            }
        };

        if (process.env.FIDDLER) {
            options_auth["proxy"] = {
                host: "localhost"
                , port: 8888
                , tunnel: true
            }
        }

        this.client = new noderestclient.Client(options_auth);

        var JSONSerializer = this.client.serializers.find("JSON");
        JSONSerializer.isDefault = true;
        this.client.serializers.clean();
        this.client.serializers.add(JSONSerializer);
    }

    async ExecuteOperation<T>(method: Methods, URL: string, args: OperationArguments): Promise<T> {
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
                        .catch((reason:any) => {
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
                            Object.keys(data).map((e) => this.log.info(`key=${e}  value=${data[e]}`))
                        }
                        else {
                            this.log.info(data.toString("utf8"));
                        }
                    reject(response);
                }
            });
        }
        );

    }
}
