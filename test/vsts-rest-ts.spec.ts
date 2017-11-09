// tslint:disable:no-unused-expression
import { expect } from 'chai';
import 'mocha';
import VSTSRestClient from '../src/vsts-rest-ts';

describe('VSTSRestClient class', () => {
    it('is not null', () => {
        const result = new VSTSRestClient({endpoint: '', password: '', project: '', username: ''},
        {error: console.log, info: console.log, verbose: console.log, warn: console.log});
        expect(result).to.not.be.null;
    });
});
