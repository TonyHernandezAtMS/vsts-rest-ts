// tslint:disable:no-unused-expression
import { expect } from 'chai';
import 'mocha';
import { VSTSRestClient } from '../src/vsts-rest-ts';
import { IAsyncRestClientFactory, IAsyncRestClient, IVSTSConfig } from '../src/interfaces/interfaces';

class MockAsyncRestClientFactory implements IAsyncRestClientFactory {
    CreateClient(): IAsyncRestClient {
        throw new Error("Method not implemented.");
    }
}

class MockVSTSConfig implements IVSTSConfig {
    endpoint: string;
    project: string;

}

describe('VSTSRestClient module', () => {
    it('is not null', () => {
        expect(VSTSRestClient).to.not.be.null;
    });

    it('has VSTSTest class', () => {
        expect(VSTSRestClient.VSTSTest).to.not.be.null;
    });

    it('has VSTSWorkItem class', () => {
        expect(VSTSRestClient.VSTSWorkItem).to.not.be.null;
    });
});

describe('VSTSTest class', () => {
    it('can be instantiated', () => {
        expect(new VSTSRestClient.VSTSTest(new MockAsyncRestClientFactory(), new MockVSTSConfig())).to.not.be.null;
    });
});

describe('VSTSWorkItem class', () => {

    it('can be instantiated', () => {
        expect(VSTSRestClient.VSTSWorkItem).to.not.be.null;
        expect(new VSTSRestClient.VSTSWorkItem(new MockAsyncRestClientFactory(), new MockVSTSConfig())).to.not.be.null;
    });
});
