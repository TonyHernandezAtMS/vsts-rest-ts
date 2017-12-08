import { IAsyncRestClientFactory, IAsyncRestClient, IVSTSConfig, ITestPlan, IArea, IPerson, IProject, ITestSuite, IOperationArguments } from '../src/interfaces/interfaces';
import { Methods } from '../src/interfaces/enums';

export class FakeAsyncRestClient implements IAsyncRestClient {
    ExecuteOperation<T>(method: Methods, URL: string, args: IOperationArguments): Promise<T> {
        throw new Error("Method not implemented.");
    }

}

export class FakeAsyncRestClientFactory implements IAsyncRestClientFactory {
    CreateClient(): IAsyncRestClient {
        throw new Error("Method not implemented.");
    }
}

export class FakeVSTSConfig implements IVSTSConfig {
    endpoint: string = "https://mycompany.visualstudio.com";
    project: string = "My Team";

}

export class FakeTestPlan implements ITestPlan {
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

export class FakeTestSuite implements ITestSuite {
    plan: ITestPlan;
    id: number;
    
}