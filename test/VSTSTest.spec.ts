// tslint:disable:no-unused-expression
import * as chai from 'chai';
import { expect } from 'chai';
import 'mocha';
import { VSTSTest } from '../src/VSTSTest';
import * as sinon from 'sinon';
import { IAsyncRestClient, IAsyncRestClientFactory, IVSTSConfig } from '../src/interfaces/interfaces';
import { Methods } from '../src/interfaces/enums';
import { FakeVSTSConfig } from "./Fakes";

describe('VSTSTest', () => {
    let fakeClient: IAsyncRestClient,
        fakeFactory: IAsyncRestClientFactory,
        fakeConfig: IVSTSConfig;

    beforeEach(() => {
        fakeClient = {
            ExecuteOperation: sinon.spy()
        };

        fakeFactory = {
            CreateClient: () => { return fakeClient; }
        };

        fakeConfig = new FakeVSTSConfig();
    })
    describe('calls correct VSTS test api', () => {
        const ValidationVstsApiCall = (expectedValues: any, test: any) => {
            let client = new VSTSTest(fakeFactory, fakeConfig);
            test(client);

            let spy = fakeClient.ExecuteOperation as sinon.SinonSpy;
            sinon.assert.calledWith(spy, ...expectedValues);
        }
        it('GetTestPlan with ID of plan', () => {
            const expectedTestPlanID = 1;
            const expectedValues = [
                Methods.GET,
                fakeConfig.endpoint + '/DefaultCollection/' + fakeConfig.project + '/_apis/test/plans/${planID}',
                {
                    path: {
                        planId: expectedTestPlanID
                    }
                }
            ];

            ValidationVstsApiCall(expectedValues, (client: VSTSTest) => { client.GetTestPlan(expectedTestPlanID); })
        })

        it('GetTestPlans with owner of plan', () => {
            const expectedIncludePlanDetails = true,
                expectedOwner = "Sarah Smith";

            const expectedValues = [
                Methods.GET,
                fakeConfig.endpoint + '/DefaultCollection/' + fakeConfig.project + '/_apis/test/plans',
                {
                    parameters: {
                        includePlanDetails: String(expectedIncludePlanDetails),
                        owner: expectedOwner
                    }
                }
            ];

            ValidationVstsApiCall(expectedValues, (client: VSTSTest) => { client.GetTestPlans(expectedOwner, expectedIncludePlanDetails) });
        })

        it('GetTestPoints', () => {
            const expectedTestPlanID = 1,
                expectedSuiteID = 2,
                expectedTestCaseID = 3,
                expectedConfigurationID = 4,
                expectedIncludePointDetails = true;

            const expectedValues = [
                Methods.GET,
                fakeConfig.endpoint + '/DefaultCollection/' + fakeConfig.project + '/_apis/test/plans/${planId}/suites/${suiteId}/points',
                {
                    path: {
                        planId: expectedTestPlanID,
                        suiteId: expectedSuiteID,
                    },
                    parameters: {
                        testCaseId: String(expectedTestCaseID),
                        configurationId: String(expectedConfigurationID),
                        includePointDetails: String(expectedIncludePointDetails)
                    }
                }
            ];

            ValidationVstsApiCall(expectedValues, (client: VSTSTest) => { client.GetTestPoints(expectedTestPlanID, expectedSuiteID, expectedTestCaseID, expectedConfigurationID, expectedIncludePointDetails) });
        })

        it('GetTestCases', () => {
            const expectedTestPlanID = 1,
                expectedTestSuiteID = 2;                

            const expectedValues = [
                Methods.GET,
                fakeConfig.endpoint + '/DefaultCollection/' + fakeConfig.project + '/_apis/test/plans/${planID}/suites/${suiteID}',
                {
                    path: {
                        planId: expectedTestPlanID,
                        suiteId: expectedTestSuiteID,
                    }
                }
            ];

            ValidationVstsApiCall(expectedValues, (client: VSTSTest) => { client.GetTestCases(expectedTestPlanID,expectedTestSuiteID); } );
        })

        it('GetTestSuites', () => {
            const expectedTestPlanID = 1;                               

            const expectedValues = [
                Methods.GET,
                fakeConfig.endpoint + '/DefaultCollection/' + fakeConfig.project + '/_apis/test/plans/${planID}/suites',
                {
                    path: {
                        planId: expectedTestPlanID                        
                    }
                }
            ];

            ValidationVstsApiCall(expectedValues, (client: VSTSTest) => { client.GetTestSuites(expectedTestPlanID); } );
        })

        it('GetTestResults', () => {
            const expectedRunId = 1;                               

            const expectedValues = [
                Methods.GET,
                fakeConfig.endpoint + '/DefaultCollection/' + fakeConfig.project + '/_apis/test/runs/${runID}/results',
                {
                    path: {
                        runId: expectedRunId                        
                    },
                    parameters: {
                        $top: "100",
                        detailsToInclude: "WorkItems"
                    }
                }
            ];

            ValidationVstsApiCall(expectedValues, (client: VSTSTest) => { client.GetTestResults(expectedRunId); } );
        })

        it('GetTestResult', () => {
            const expectedURL = fakeConfig.endpoint + '/DefaultCollection/' + fakeConfig.project + '/_apis/test/runs/15/results';                               

            const expectedValues = [
                Methods.GET,
                expectedURL,
                { 
                    parameters: {
                        $top: "100",
                        detailsToInclude: "WorkItems"
                    }
                }
            ];

            ValidationVstsApiCall(expectedValues, (client: VSTSTest) => { client.GetTestResult(expectedURL); } );
        })

        it('GetTestRuns', () => {
            const expectedTestPlanID = 1;                               

            const expectedValues = [
                Methods.GET,
                fakeConfig.endpoint + '/DefaultCollection/' + fakeConfig.project + '/_apis/test/runs',
                {
                    parameters: {
                        planId: String(expectedTestPlanID),
                        includeRunDetails: "true"
                    }
                }
            ];

            ValidationVstsApiCall(expectedValues, (client: VSTSTest) => { client.GetTestRuns(expectedTestPlanID); } );
        })
    })
})