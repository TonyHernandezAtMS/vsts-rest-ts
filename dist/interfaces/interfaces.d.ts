export declare const FieldNames: {
    Tags: string;
    Title: string;
    History: string;
    ID: string;
};
export declare type FieldNamesType = "System.Tags" | "System.Title" | "System.History" | "System.Id";
export interface ILogger {
    info(message: string): void;
    error(message: string): void;
    warn(message: string): void;
    verbose(message: string): void;
}
export interface OperationArgumentMember {
    [fieldName: string]: string | number | number[];
}
export interface OperationArguments {
    data?: any;
    path?: OperationArgumentMember;
    parameters?: OperationArgumentMember;
    headers?: OperationArgumentMember;
}
export interface Operation {
    (URL: string, args: any, callback: any): void;
}
export interface IVSTSConfig {
    endpoint: string;
    project: string;
    username: string;
    password: string;
}
export interface VSTSItem {
    id: number;
    url?: string;
    name?: string;
}
export interface TestCase extends VSTSItem {
}
export interface Build extends VSTSItem {
}
export interface TestResult extends VSTSItem {
    configuration: VSTSItem;
    project: VSTSItem;
    startedDate: string;
    completedDate: string;
    outcome: string;
    owner: Person;
    revision: number;
    runBy: Person;
    state: string;
    testCase: VSTSItem;
    testRun: VSTSItem;
    lastUpdatedDate: string;
    lastUpdatedBy: Person;
    priority: number;
    computerName: string;
    createdDate: string;
    testCaseTitle: string;
    testCaseReferenceId: string;
    associatedBugs?: VSTSItem[];
}
export interface TestSuite {
    plan: TestPlan;
    id: number;
}
export interface Area {
    id: number;
    name: string;
}
export interface Person {
    displayName: string;
    id: string;
    imageUrl?: string;
    uniqueName?: string;
    url?: string;
}
export interface Project {
    id: string;
    name: string;
    url: string;
}
export interface TestPlan {
    id: number;
    area: Area;
    clientUrl: string;
    endDate: Date;
    iteration: string;
    name: string;
    manualTestSettings: object;
    owner: Person;
    project: Project;
    revision: number;
    rootSuite: Object;
    startDate: Date;
    state: string;
    updatedBy: Person;
    updatedDate: Date;
    url: string;
}
export interface TestRun extends VSTSItem {
    isAutomated: boolean;
    iteration: string;
    owner: Person;
    project: VSTSItem;
    startedDate: string;
    completedDate: string;
    plan: VSTSItem;
    totalTests: number;
    incompleteTests: number;
    notApplicableTests: number;
    passedTests: number;
    unanalyzedTests: number;
    revision: number;
    webAccessUrl: string;
}
export interface Requirement {
    Description: string;
    testCases: TestCase[];
    category: string;
}
export interface Field {
    name: string;
    referenceName: FieldNamesType;
    url: string;
}
export interface WIQLResultBase {
    asOf: Date;
    columns: Field[];
    queryResultType: string;
    queryType: string;
    sortColumns?: SortColumn[];
}
export interface WIQLResultFlat extends WIQLResultBase {
    workItems: VSTSItem[];
}
export interface WIQLResultOneHop extends WIQLResultBase {
    workItemRelations: {
        target: VSTSItem;
        rel?: string;
        source?: VSTSItem;
    }[];
}
export interface SortColumn {
    descending: boolean;
    field: Field;
}
export interface WorkItemFields {
    [fieldName: string]: string | number;
}
export interface hrefLink {
    href: string;
}
