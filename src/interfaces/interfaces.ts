export const FieldNames = {
    Tags : 'System.Tags',
    Title : 'System.Title',
    History: 'System.History',
    ID: 'System.Id',
};

export type FieldNamesType = 'System.Tags' | 'System.Title' | 'System.History' | 'System.Id';

export interface ILogger {
    info(message: string): void;
    error(message: string): void;
    warn(message: string): void;
    verbose(message: string): void;
}

export interface IOperationArgumentMember {
    [fieldName: string]: string | number | number[];
}
export interface IOperationArguments {
    data?: any;
    path?: IOperationArgumentMember;
    parameters?: IOperationArgumentMember;
    headers?: IOperationArgumentMember;
}
export type Operation = (URL: string, args: any, callback: any) => void;

export interface IVSTSConfig {
    endpoint: string;
    project: string;
    username: string;
    password: string;
}

export interface IVSTSItem {
    id: number;
    url?: string;
    name?: string;
}

export interface ITestCase extends IVSTSItem {

}

export interface IBuild extends IVSTSItem {

}

export interface ITestResult extends IVSTSItem {
    configuration: IVSTSItem;
    project: IVSTSItem;
    startedDate: string;
    completedDate: string;
    outcome: string;
    owner: IPerson;
    revision: number;
    runBy: IPerson;
    state: string;
    testCase: IVSTSItem;
    testRun: IVSTSItem;
    lastUpdatedDate: string;
    lastUpdatedBy: IPerson;
    priority: number;
    computerName: string;
    createdDate: string;
    testCaseTitle: string;
    testCaseReferenceId: string;
    associatedBugs?: IVSTSItem[];
}
export interface ITestSuite {
    plan: ITestPlan;
    id: number;
}
export interface IArea {
    id: number;
    name: string;
}
export interface IPerson {
    displayName: string;
    id: string;
    imageUrl?: string;
    uniqueName?: string;
    url?: string;
}
export interface IProject {
    id: string;
    name: string;
    url: string;
}
export interface ITestPlan {
    id: number;
    area: IArea;
    clientUrl: string;
    endDate: Date;
    iteration: string;
    name: string;
    manualTestSettings: object;
    owner: IPerson;
    project: IProject;
    revision: number;
    rootSuite: object;
    startDate: Date;
    state: string;
    updatedBy: IPerson;
    updatedDate: Date;
    url: string;
}

export interface ITestRun extends IVSTSItem {
    isAutomated: boolean;
    iteration: string;
    owner: IPerson;
    project: IVSTSItem;
    startedDate: string;
    completedDate: string;
    plan: IVSTSItem;
    totalTests: number;
    incompleteTests: number;
    notApplicableTests: number;
    passedTests: number;
    unanalyzedTests: number;
    revision: number;
    webAccessUrl: string;
}
export interface IRequirement {
    Description: string;
    testCases: ITestCase[];
    category: string;
}
export interface IField {
    name: string;
    referenceName: FieldNamesType;
    url: string;
}

export interface IWIQLResultBase {
    asOf: Date;
    columns: IField[];
    queryResultType: string;
    queryType: string;
    sortColumns?: ISortColumn[];
}

export interface IWIQLResultFlat extends IWIQLResultBase {
    workItems: IVSTSItem[];
}

export interface IWIQLResultOneHop extends IWIQLResultBase {
    workItemRelations: Array<{target: IVSTSItem, rel?: string, source?: IVSTSItem}>;
}

export interface ISortColumn {
    descending: boolean;
    field: IField;
}
export interface IWorkItemFields {
    [fieldName: string]: string | number;
}
export interface IhrefLink {
    href: string;
}

export interface IWorkItemRelationship {
    rel: string;
    url: string;
    attributes: {[key: string]: any};
}

export interface IActualWorkItem extends IVSTSItem {
    rev?: number;
    fields: IWorkItemFields;
    _links?: {
        fields: IhrefLink,
        html: IhrefLink,
        self: IhrefLink,
        workItemHistory: IhrefLink,
        workItemRevisions: IhrefLink,
        workItemType: IhrefLink,
        workItemUpdates: IhrefLink,
    };
    relations?: IWorkItemRelationship[];
}

export interface INewWorkItem {
    workItemType: string;
    fields: IWorkItemFields;
    relations?: IWorkItemRelationship[];
}

export interface IWorkItemProperty {
    key: string;
    value: string;
}
export interface IWorkItemProperties {
    workItem: IWorkItemProperty;
}
export interface ILastResultDetails {
    duration: number;
    dateCompleted: string;
    runBy: IPerson;
}
export interface ITestPoint extends IVSTSItem {
    assignedTo: IPerson;
    configuration: IVSTSItem;
    lastTestRun: IVSTSItem;
    lastResult: IVSTSItem;
    outcome: string;
    state: string;
    testCase: IVSTSItem;
    workItemProperties: IWorkItemProperties[];
    suite: IVSTSItem;
    testPlan: IVSTSItem;
    automated: boolean;
    lastResultDetails: ILastResultDetails;
    revision: number;
    failureType?: string;
    lastResolutionStateId?: number;
    lastUpdatedDate: string;
    lastResultState: string;
    lastUpdatedBy: IPerson;
}
