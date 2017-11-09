import { VSTSItem, WorkItemFields, hrefLink, Person, ILogger, IVSTSConfig, TestPlan, TestRun, TestResult, OperationArguments, TestSuite, WIQLResultBase, TestCase } from "./interfaces/interfaces";
export declare class WorkItemRelationshipConstants {
    static readonly ReferencedBy: string;
    static readonly References: string;
    static readonly TestedBy: string;
    static readonly Tests: string;
    static readonly TestCase: string;
    static readonly SharedSteps: string;
    static readonly Duplicate: string;
    static readonly DuplicateOf: string;
    static readonly Successor: string;
    static readonly Predecessor: string;
    static readonly Child: string;
    static readonly Parent: string;
    static readonly Related: string;
    static readonly AttachedFile: string;
    static readonly Hyperlink: string;
    static readonly ArtifactLink: string;
}
export interface WorkItemRelationship {
    rel: string;
    url: string;
    attributes: {
        [key: string]: any;
    };
}
export interface ActualWorkItem extends VSTSItem {
    rev?: number;
    fields: WorkItemFields;
    _links?: {
        fields: hrefLink;
        html: hrefLink;
        self: hrefLink;
        workItemHistory: hrefLink;
        workItemRevisions: hrefLink;
        workItemType: hrefLink;
        workItemUpdates: hrefLink;
    };
    relations?: WorkItemRelationship[];
}
export interface NewWorkItem {
    workItemType: string;
    fields: WorkItemFields;
    relations?: WorkItemRelationship[];
}
export interface WorkItemProperty {
    key: string;
    value: string;
}
export interface WorkItemProperties {
    workItem: WorkItemProperty;
}
export interface LastResultDetails {
    duration: number;
    dateCompleted: string;
    runBy: Person;
}
export interface TestPoint extends VSTSItem {
    assignedTo: Person;
    configuration: VSTSItem;
    lastTestRun: VSTSItem;
    lastResult: VSTSItem;
    outcome: string;
    state: string;
    testCase: VSTSItem;
    workItemProperties: WorkItemProperties[];
    suite: VSTSItem;
    testPlan: VSTSItem;
    automated: boolean;
    lastResultDetails: LastResultDetails;
    revision: number;
    failureType?: string;
    lastResolutionStateId?: number;
    lastUpdatedDate: string;
    lastResultState: string;
    lastUpdatedBy: Person;
}
export declare class VSTSClient {
    vstsConfig: IVSTSConfig;
    private readonly vstsProjectRoot;
    private readonly vstsTestCases;
    private readonly vstsTestPoints;
    private readonly vstsTestPlans;
    private readonly vstsTestPlanSingle;
    private readonly vstsTestRuns;
    private readonly vstsTestResults;
    private readonly vstsTestSuites;
    private readonly vstsWorkItems;
    private readonly vstsCreateWorkItems;
    private readonly vstsStoredQuery;
    private readonly vstsExecuteWIQL;
    private log;
    constructor(vstsConfig: IVSTSConfig, logger: ILogger);
    private ClientFactory();
    AddWorkItem(item: NewWorkItem): Promise<ActualWorkItem>;
    UpdateWorkItem(originalItem: ActualWorkItem, changeFieldList?: {
        [fieldName: string]: string | number | null;
    }, changeRelationList?: WorkItemRelationship[]): Promise<ActualWorkItem>;
    GetActualWorkItemFromUrl(url: string, fields?: string[], includeRelationships?: boolean): Promise<ActualWorkItem>;
    GetItemFromUrl<T>(url: string): Promise<T>;
    GetWorkItems(items: VSTSItem[], fields?: string[]): Promise<ActualWorkItem[]>;
    GetWorkItems(ids: number[], fields?: string[]): Promise<ActualWorkItem[]>;
    GetTestPoints(planID: number, suiteID: number, testcaseID?: number, configurationID?: number): Promise<TestPoint[]>;
    GetTestPlans(owner: string): Promise<TestPlan[]>;
    GetResultsFromStoredQuery(queryId: number): Promise<Object>;
    GetTestRuns(testPlan: TestPlan): Promise<TestRun[]>;
    GetTestResults(testRun: TestRun): Promise<TestResult[]>;
    GetTestResult<T>(url: string, args: OperationArguments): Promise<T>;
    GetTestSuites(testPlan: TestPlan): Promise<TestSuite[]>;
    GetTestPlan(id: number): Promise<TestPlan>;
    GetTestCases(testPlan: TestPlan, testSuite: TestSuite): Promise<TestCase[]>;
    ExecuteQuery<T extends WIQLResultBase>(query: string): Promise<T>;
}
