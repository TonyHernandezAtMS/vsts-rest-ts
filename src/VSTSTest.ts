import { Methods } from './interfaces/enums';
import {
    IAsyncRestClientFactory, IOperationArguments, ITestCase,
    ITestPlan, ITestPoint, ITestResult, ITestRun, ITestSuite,
    IVSTSConfig
} from './interfaces/interfaces';

export class VSTSTest {
    private vstsTestSuites: string;
    private vstsTestResults: string;
    private vstsTestRuns: string;
    private vstsTestPlanSingle: string;
    private vstsTestPlans: string;
    private vstsTestPoints: string;
    private vstsTestCases: string;
    private vstsConfig: IVSTSConfig;
    private restClientFactory: IAsyncRestClientFactory;
    private vstsProjectRoot: string;

    constructor(restClientFactory: IAsyncRestClientFactory, vstsConfig: IVSTSConfig) {
        this .restClientFactory = restClientFactory;
        this .vstsConfig = vstsConfig;

        this .vstsProjectRoot = this .vstsConfig.endpoint + '/DefaultCollection/' + this .vstsConfig.project;
        // Test Module
        this .vstsTestCases = this .vstsProjectRoot + '/_apis/test/plans/${planID}/suites/${suiteID}';
        this .vstsTestPoints = this .vstsProjectRoot + '/_apis/test/plans/${planId}/suites/${suiteId}/points';
        this .vstsTestPlans = this .vstsProjectRoot + '/_apis/test/plans';
        this .vstsTestPlanSingle = this .vstsProjectRoot + '/_apis/test/plans/${planID}';
        this .vstsTestRuns = this .vstsProjectRoot + '/_apis/test/runs';
        this .vstsTestResults = this .vstsProjectRoot + '/_apis/test/runs/${runID}/results';
        this .vstsTestSuites = this .vstsProjectRoot + '/_apis/test/plans/${planID}/suites';
    }
    public async GetTestRuns(testPlanId: number): Promise< ITestRun[]> {
        const parameters: { [index: string]: string } = {};
        parameters.planId = String(testPlanId);
        parameters.includeRunDetails = 'true';

        return this .restClientFactory
            .CreateClient()
            .ExecuteOperation< ITestRun[]>(Methods.GET, this .vstsTestRuns, { parameters });
    }

    public async GetTestResults(testRunId: number) {
        return this .GetTestResult< ITestResult[]>(this .vstsTestResults, { path: { runId: testRunId } });
    }

    public async GetTestResult< T>(url: string, args: IOperationArguments = {}) {
        const parameters: { [index: string]: string } = {};
        parameters.detailsToInclude = 'WorkItems';
        parameters.$top = '100';
        args.parameters = parameters;
        return this .restClientFactory
            .CreateClient()
            .ExecuteOperation< T>(Methods.GET, url, args);
    }

    public async GetTestSuites(testPlanId: number): Promise< ITestSuite[]> {
        const path: { [index: string]: number } = {};
        path.planId = testPlanId;
        return this .restClientFactory
            .CreateClient()
            .ExecuteOperation< ITestSuite[]>(Methods.GET, this .vstsTestSuites, { path });
    }

    public async GetTestPlan(id: number): Promise< ITestPlan> {
        const path: { [index: string]: number } = {};

        path.planId = id;
        return this .restClientFactory
            .CreateClient()
            .ExecuteOperation< ITestPlan>(Methods.GET, this .vstsTestPlanSingle, { path });
    }
    public async GetTestCases(testPlanId: number, testSuiteId: number): Promise< ITestCase[]> {
        const path: { [index: string]: number } = {};
        path.planId = testPlanId;
        path.suiteId = testSuiteId;
        return this .restClientFactory
            .CreateClient()
            .ExecuteOperation< ITestCase[]>(Methods.GET, this .vstsTestCases, { path });
    }

    public async GetTestPlans(owner: string, includePlanDetails: boolean = true): Promise< ITestPlan[]> {

        const parameters: { [index: string]: string } = {};
        parameters.includePlanDetails = String(includePlanDetails);
        parameters.owner = owner;

        return this .restClientFactory
            .CreateClient()
            .ExecuteOperation< ITestPlan[]>(Methods.GET, this .vstsTestPlans, { parameters });
    }

    public async GetTestPoints(planID: number,
        suiteID: number,
        testcaseID?: number,
        configurationID?: number,
        includePointDetails: boolean = true): Promise< ITestPoint[]> {

        const path: { [index: string]: number } = {};

        path.planId = planID;
        path.suiteId = suiteID;

        const parameters: { [index: string]: string } = {};

        parameters.includePointDetails = String(includePointDetails);

        if (testcaseID) {
            parameters.testCaseId = testcaseID.toString();
        }
        if (configurationID) {
            parameters.configurationId = configurationID.toString();
        }
        return this .restClientFactory.CreateClient()
            .ExecuteOperation< ITestPoint[]>(Methods.GET, this .vstsTestPoints, { path, parameters });
    }
}
