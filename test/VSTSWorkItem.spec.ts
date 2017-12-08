// tslint:disable:no-unused-expression
import * as chai from 'chai';
import { expect } from 'chai';
import 'mocha';
import { VSTSWorkItem } from "../src/VSTSWorkItem";
import * as sinon from 'sinon';
import { IAsyncRestClient, IAsyncRestClientFactory, IVSTSConfig, INewWorkItem, IWorkItemRelationship, IActualWorkItem } from '../src/interfaces/interfaces';
import { Methods } from '../src/interfaces/enums';
import { FakeVSTSConfig } from "./Fakes";

describe('VSTSWorkItem', () => {
    let fakeClient: IAsyncRestClient,
        fakeFactory: IAsyncRestClientFactory,
        fakeConfig: IVSTSConfig;

    const ValidationVstsApiCall = (expectedValues: any, test: any) => {
        let client = new VSTSWorkItem(fakeFactory, fakeConfig);
        test(client);

        let spy = fakeClient.ExecuteOperation as sinon.SinonSpy;
        sinon.assert.calledWith(spy, ...expectedValues);
    }

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
        describe('AddWorkItem', () => {
            it('creates blank workitem', () => {
                const expectedNewWorkItem: INewWorkItem = {
                    workItemType: "Epic",
                    fields: {},
                    relations: []
                };

                const expectedValues = [
                    Methods.PATCH,
                    fakeConfig.endpoint + '/DefaultCollection/' + fakeConfig.project + '/_apis/wit/workitems/${workItemType}',
                    {
                        data: [],
                        path: {
                            workItemType: "$" + expectedNewWorkItem.workItemType
                        }
                    }
                ];

                ValidationVstsApiCall(expectedValues, (client: VSTSWorkItem) => { client.AddWorkItem(expectedNewWorkItem); })
            })
        })

        describe("UpdateWorkItem", () => {
            it('updates a field', () => {
                const fieldName = "System.Title",
                    oldFieldValue = "Old Title",
                    newFieldValue = "New Title",
                    workItemId = 1,
                    expectedOriginalWorkItem: IActualWorkItem = {
                        id: workItemId,
                        fields: {},
                        relations: []
                    },
                    expectedChangeFieldList: { [fieldName: string]: string | number | null } = {},
                    expectedChangeRelationList: IWorkItemRelationship[] = [],
                    payload: Array<{ 'op': string, 'path': string, 'value'?: any }> = [];


                expectedOriginalWorkItem.fields[fieldName] = oldFieldValue;
                expectedChangeFieldList[fieldName] = newFieldValue;
                payload.push({ op: "replace", path: "/fields/" + fieldName, value: newFieldValue });

                const expectedValues = [
                    Methods.PATCH,
                    fakeConfig.endpoint + '/_apis/wit/workitems/' + String(workItemId),
                    {
                        data: payload,
                    }
                ];

                ValidationVstsApiCall(expectedValues, (client: VSTSWorkItem) => { client.UpdateWorkItem(expectedOriginalWorkItem, expectedChangeFieldList) })
            })

            it('removes a relationship', () => {
                const rel = "System.Relationship.SomeRelationshipType",
                    url = fakeConfig.endpoint + '/_apis/wit/workitems/412',
                    workItemId = 1,
                    expectedOriginalWorkItem: IActualWorkItem = {
                        id: workItemId,
                        fields: {},
                        relations: []
                    },
                    expectedChangeFieldList: { [fieldName: string]: string | number | null } = {},
                    expectedChangeRelationList: IWorkItemRelationship[] = [],
                    payload: Array<{ 'op': string, 'path': string, 'value'?: any }> = [];


                expectedOriginalWorkItem.relations = [{ rel: rel, url: url, attributes: [] }];

                payload.push({ op: "remove", path: "/relations/" + 0 });

                const expectedValues = [
                    Methods.PATCH,
                    fakeConfig.endpoint + '/_apis/wit/workitems/' + String(workItemId),
                    {
                        data: payload,
                    }
                ];

                ValidationVstsApiCall(expectedValues, (client: VSTSWorkItem) => { client.UpdateWorkItem(expectedOriginalWorkItem, expectedChangeFieldList, expectedChangeRelationList) })
            })

            it('adds a relationship', () => {
                const rel = "System.Relationship.SomeRelationshipType",
                    url = fakeConfig.endpoint + '/_apis/wit/workitems/412',
                    workItemId = 1,
                    expectedOriginalWorkItem: IActualWorkItem = {
                        id: workItemId,
                        fields: {},
                        relations: []
                    },
                    expectedChangeFieldList: { [fieldName: string]: string | number | null } = {},
                    expectedChangeRelationList: IWorkItemRelationship[] = [],
                    payload: Array<{ 'op': string, 'path': string, 'value'?: any }> = [];

                expectedChangeRelationList.push({ rel: rel, url: url, attributes: [] });
                payload.push({ op: "add", path: "/relations/-", value: { attributes: [], rel: rel, url: url } });

                const expectedValues = [
                    Methods.PATCH,
                    fakeConfig.endpoint + '/_apis/wit/workitems/' + String(workItemId),
                    {
                        data: payload,
                    }
                ];

                ValidationVstsApiCall(expectedValues, (client: VSTSWorkItem) => { client.UpdateWorkItem(expectedOriginalWorkItem, expectedChangeFieldList, expectedChangeRelationList) })
            })
        })

        describe('GetActualWorkItemFromUrl', () => {
            it('gets workitem from a url', ()=>{
                const expectedUrl = 'https://foo.co/_api/1',
                    expectedfields = ['System.Title'],
                    expectedIncludeRelationship = false;

                ValidationVstsApiCall([Methods.GET, expectedUrl,{parameters:{fields: expectedfields[0]}}],(client:VSTSWorkItem)=>client.GetActualWorkItemFromUrl(expectedUrl,expectedfields,expectedIncludeRelationship))
            })
        })

        describe('GetResultsFromStoredQuery', () => {
            it('gets results from a stored query', ()=>{
                const expectedUrl = fakeConfig.endpoint + '/_apis/wit/wiql/${id}',
                expectedQueryId = 1;

                ValidationVstsApiCall([Methods.GET, expectedUrl,{path: { id: expectedQueryId}}],(client:VSTSWorkItem)=>{client.GetResultsFromStoredQuery(expectedQueryId)});
            })
        })

        describe('ExecuteQuery',()=>{
            it('gets results from wiql query',()=>{
                const expectedUrl=fakeConfig.endpoint+'/DefaultCollection/'+fakeConfig.project+'/_apis/wit/wiql',
                expectedQueryString='select * from foo';

                ValidationVstsApiCall([Methods.POST,expectedUrl,{data:{query:expectedQueryString}}],(client:VSTSWorkItem)=>client.ExecuteQuery(expectedQueryString));
            })
        })

        describe('GetItemFromUrl',()=>{
            it('gets item from url',()=>{
                const expectedUrl='https://foo.com/boo/1';

                ValidationVstsApiCall([Methods.GET,expectedUrl,{}],(client:VSTSWorkItem)=>client.GetItemFromUrl(expectedUrl));
            })
        })

        describe('GetWorkItems',()=>{
            it('gets single work item',()=>{
                const expectedId=1;
                const expectedUrl=fakeConfig.endpoint+'/_apis/wit/workitems';
                ValidationVstsApiCall([Methods.GET,expectedUrl,{parameters:{$expand:"all",ids:String(expectedId)}}],(client:VSTSWorkItem)=>client.GetWorkItems([expectedId]));
            })
        })
    })
})