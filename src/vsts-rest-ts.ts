
import * as _ from 'underscore';
import { IActualWorkItem, IhrefLink, ILogger, INewWorkItem, IOperationArguments, IPerson,
    ITestCase, ITestPlan, ITestPoint, ITestResult, ITestRun, ITestSuite, IVSTSConfig,
    IVSTSItem, IWIQLResultBase, IWorkItemFields, IWorkItemRelationship, Operation } from './interfaces/interfaces';
import VSTSOperation, { Methods } from './VSTSOperation';

export default class VSTSRestClient {
    // VSTS REST API paths
    private readonly vstsProjectRoot = this.vstsConfig.endpoint + '/DefaultCollection/' + this.vstsConfig.project;
    // Test Module
    private readonly vstsTestCases = this.vstsProjectRoot + '/_apis/test/plans/${planID}/suites/${suiteID}';
    private readonly vstsTestPoints = this.vstsProjectRoot + '/_apis/test/plans/${planId}/suites/${suiteId}/points';
    private readonly vstsTestPlans = this.vstsProjectRoot + '/_apis/test/plans';
    private readonly vstsTestPlanSingle = this.vstsProjectRoot + '/_apis/test/plans/${planID}';
    private readonly vstsTestRuns = this.vstsProjectRoot + '/_apis/test/runs';
    private readonly vstsTestResults = this.vstsProjectRoot + '/_apis/test/runs/${runID}/results';
    private readonly vstsTestSuites = this.vstsProjectRoot + '/_apis/test/plans/${planID}/suites';
    // WIT
    private readonly vstsWorkItems = this.vstsConfig.endpoint + '/_apis/wit/workitems';
    private readonly vstsCreateWorkItems = this.vstsProjectRoot + '/_apis/wit/workitems/${workItemType}';
    // WIQL
    private readonly vstsStoredQuery = this.vstsConfig.endpoint + '/_apis/wit/wiql/${id}';
    private readonly vstsExecuteWIQL = this.vstsProjectRoot + '/_apis/wit/wiql';

    private log: ILogger;

    constructor(public vstsConfig: IVSTSConfig, logger: ILogger) {
        this.log = logger;
    }

    public async AddWorkItem(item: INewWorkItem) {
        const payload: Array<{ 'op': string, 'path': string, 'value': any }> = [];
        for (const key in item.fields) {
            if (item.fields.hasOwnProperty(key)) {
                const value = item.fields[key];
                payload.push({ op: 'add', path: '/fields/' + key, value });
            }
        }

        if (item.relations) {
            item.relations.forEach((rel) => {
                payload.push({ op: 'add', path: '/relations/-', value: rel });
            });
        }

        const path: { [index: string]: string } = {};
        path.workItemType = '$' + item.workItemType;

        const returnItem = await this.ClientFactory()
            .ExecuteOperation<IActualWorkItem>(Methods.PATCH, this.vstsCreateWorkItems, { data: payload, path });
        return returnItem;
    }

    public async UpdateWorkItem(originalItem: IActualWorkItem,
                                changeFieldList?: { [fieldName: string]: string | number | null },
                                changeRelationList?: IWorkItemRelationship[]) {
        const payload: Array<{ 'op': string, 'path': string, 'value'?: any }> = [];

        if (changeFieldList) {
            for (const key in changeFieldList) {
                if (changeFieldList.hasOwnProperty(key)) {
                    const value = changeFieldList[key];
                    let op: string;
                    op = !originalItem.fields.hasOwnProperty(key) ? 'add' : (value == null ? 'remove' : 'replace');
                    payload.push({ op, path: '/fields/' + key, value });
                }
            }
        }

        if (changeRelationList) {
            let origTargets = {};
            const newTargets = _.indexBy(changeRelationList, 'url');
            if (originalItem.relations) {
                origTargets = _.indexBy(originalItem.relations, 'url');
            }
            const updateKeys = _.intersection(_.keys(newTargets), _.keys(origTargets));
            const newKeys = _.difference(_.keys(newTargets), _.keys(origTargets));
            const removeKeys = _.difference(_.keys(origTargets), _.keys(newTargets));

            removeKeys.forEach((url) => {
                const index = _.findIndex<IWorkItemRelationship>(
                    originalItem.relations as _.List<IWorkItemRelationship>,
                    (rel) => rel.url === url);
                payload.push({ op: 'remove', path: '/relations/' + index.toString() });
            });

            newKeys.forEach((url) => {
                const index = _.findIndex<IWorkItemRelationship>( changeRelationList as _.List<IWorkItemRelationship>,
                    (rel) => rel.url === url);
                payload.push({ op: 'add', path: '/relations/-', value: changeRelationList[index] });
            });

            updateKeys.forEach((url) => {
                const index = _.findIndex<IWorkItemRelationship>(
                    originalItem.relations as _.List<IWorkItemRelationship>,
                    (rel) => rel.url = url);
                const value = newTargets[url];
                const updates = _.intersection(_.keys(value.attributes),
                // Using non-null assertion operator on relations. Tests need to be written to validate.
                _.keys(originalItem.relations![index].attributes));
                updates.forEach((key) => {
                    payload.push({ op: 'replace',
                    path: '/relations/' + index.toString() + '/attributes/' + key,
                    value: value.attributes[key] });
                });
            });
        }

        const returnItem = await this.ClientFactory()
        .ExecuteOperation<IActualWorkItem>(Methods.PATCH,
            this.vstsWorkItems + '/' + originalItem.id, { data: payload });
        return returnItem;
    }

    public async GetActualWorkItemFromUrl(url: string, fields?: string[], includeRelationships?: boolean) {
        const parameters: { [index: string]: string } = {};
        if (fields) {
            parameters.fields = fields.join();
        }
        if (includeRelationships !== undefined && includeRelationships === true) {
            parameters.$expand = 'all';
        }
        return this.ClientFactory().ExecuteOperation<IActualWorkItem>(Methods.GET, url, { parameters });
    }

    public async GetItemFromUrl<T>(url: string) {
        return this.ClientFactory().ExecuteOperation<T>(Methods.GET, url, {});
    }

    public async GetWorkItems(items: IVSTSItem[], fields?: string[]): Promise<IActualWorkItem[]>;
    public async GetWorkItems(ids: number[], fields?: string[]): Promise<IActualWorkItem[]>;
    public async GetWorkItems(itemsOrIds: IVSTSItem[] | number[], fields?: string[]): Promise<IActualWorkItem[]> {
        let ids: number[];

        if (( (itemsOrIds[0]) as IVSTSItem).id) {
            const items: IVSTSItem[] =  itemsOrIds as IVSTSItem[];
            ids = _.map<IVSTSItem, number>(items, (item: IVSTSItem) => item.id);
        } else {
            ids =  itemsOrIds as number[];
        }

        if (ids.length > 200) {
            const first = await this.GetWorkItems(ids.slice(0, 200), fields);
            const second = await this.GetWorkItems(ids.slice(200, ids.length), fields);
            const x = _.union<IActualWorkItem>(first, second);
            return x;
        }

        const parameters: { [index: string]: string } = {};
        parameters.ids = ids.join();

        if (fields) {
            parameters.fields = fields.join();
        } else {
            parameters.$expand = 'all';
        }
        const value = await this.ClientFactory()
        .ExecuteOperation<IActualWorkItem[]>(Methods.GET, this.vstsWorkItems, { parameters });
        return value;
    }

    public async GetTestPoints(planID: number,
                               suiteID: number, testcaseID?: number, configurationID?: number): Promise<ITestPoint[]> {
        const path: { [index: string]: number } = {};

        path.planId = planID;
        path.suiteID = suiteID;

        const parameters: { [index: string]: string } = {};

        parameters.includePointDetails = 'true';

        if (testcaseID) {
            parameters.testCaseId = testcaseID.toString();
        }
        if (configurationID) {
            parameters.configurationId = configurationID.toString();
        }
        return this.ClientFactory()
        .ExecuteOperation<ITestPoint[]>(Methods.GET, this.vstsTestPoints, { path, parameters });
    }

    public async GetTestPlans(owner: string): Promise<ITestPlan[]> {

        const parameters: { [index: string]: string } = {};
        parameters.includePlanDetails = 'true';
        parameters.owner = owner;

        return this.ClientFactory().ExecuteOperation<ITestPlan[]>(Methods.GET, this.vstsTestPlans, { parameters });
    }

    public async GetResultsFromStoredQuery(queryId: number): Promise<object> {
        const path: { [index: string]: number } = {};
        path.id = queryId;
        return this.ClientFactory().ExecuteOperation(Methods.GET, this.vstsStoredQuery, { path });
    }

    public async GetTestRuns(testPlan: ITestPlan): Promise<ITestRun[]> {
        const parameters: { [index: string]: string } = {};
        parameters.planId = testPlan.id.toString();
        parameters.includeRunDetails = 'true';

        return this.ClientFactory().ExecuteOperation<ITestRun[]>(Methods.GET, this.vstsTestRuns, { parameters });
    }

    public async GetTestResults(testRun: ITestRun) {
        return this.GetTestResult<ITestResult[]>(this.vstsTestResults, {path: {runID: testRun.id}});
    }

    public async GetTestResult<T>(url: string, args: IOperationArguments) {
        const parameters: { [index: string]: string } = {};
        parameters.detailsToInclude = 'WorkItems';
        parameters.$top = '100';
        args.parameters = parameters;
        return this.ClientFactory().ExecuteOperation<T>(Methods.GET, url, args);
    }

    public async GetTestSuites(testPlan: ITestPlan): Promise<ITestSuite[]> {
        const path: { [index: string]: number } = {};
        path.planID = testPlan.id;
        return this.ClientFactory().ExecuteOperation<ITestSuite[]>(Methods.GET, this.vstsTestSuites, { path });
    }

    public async GetTestPlan(id: number): Promise<ITestPlan> {
        const path: { [index: string]: number } = {};

        path.planID = id;
        return this.ClientFactory().ExecuteOperation<ITestPlan>(Methods.GET, this.vstsTestPlanSingle, { path });
    }
    public async GetTestCases(testPlan: ITestPlan, testSuite: ITestSuite): Promise<ITestCase[]> {
        const path: { [index: string]: number } = {};
        path.planID = testPlan.id;
        path.suiteID = testSuite.id;
        return this.ClientFactory().ExecuteOperation<ITestCase[]>(Methods.GET, this.vstsTestCases, { path });
    }

    public async ExecuteQuery<T extends IWIQLResultBase>(query: string) {
        return this.ClientFactory().ExecuteOperation<T>(Methods.POST, this.vstsExecuteWIQL, {
            data: {
                query,
            },
        });
    }

    private ClientFactory(): VSTSOperation {
        return new VSTSOperation(this.vstsConfig.username, this.vstsConfig.password, this.log);
    }
}
