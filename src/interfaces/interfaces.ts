export const FieldNames = {
    Tags : "System.Tags",
    Title : "System.Title",
    History: "System.History",
    ID: "System.Id"
}

export type FieldNamesType = "System.Tags" | "System.Title" | "System.History" | "System.Id";

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
    parameters?: OperationArgumentMember
    headers?: OperationArgumentMember
}
export interface Operation {
    (URL: string, args: any, callback: any): void;
}

export interface IVSTSConfig {
    endpoint: string,
    project: string,
    username: string,
    password: string
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
    url?: string
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
    owner: Person
    project: Project;
    revision: number;
    rootSuite: Object
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
    workItemRelations: {target: VSTSItem, rel?:string, source?:VSTSItem}[];
}

export interface SortColumn {
    descending: boolean;
    field: Field;
}
export interface WorkItemFields {
    [fieldName: string]: string | number;
}
export interface hrefLink {
    href: string
}

export interface WorkItemRelationship {
    rel: string,
    url: string,
    attributes: {[key:string]:any}
}

export interface ActualWorkItem extends VSTSItem {
    rev?: number;
    fields: WorkItemFields;
    _links?: {
        fields: hrefLink,
        html: hrefLink,
        self: hrefLink,
        workItemHistory: hrefLink,
        workItemRevisions: hrefLink,
        workItemType: hrefLink,
        workItemUpdates: hrefLink
    }
    relations?: WorkItemRelationship[]
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
    runBy: Person
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
