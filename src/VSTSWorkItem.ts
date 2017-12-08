import * as _ from 'underscore';
import AsyncRestClient from './AsyncRestClient';
import { Methods } from './interfaces/enums';
import { IActualWorkItem, IAsyncRestClient, IAsyncRestClientFactory, IhrefLink, ILogger, INewWorkItem,
    IOperationArguments, IPerson, IVSTSConfig, IVSTSItem, IWIQLResultBase, IWorkItemFields,
    IWorkItemRelationship, Operation} from './interfaces/interfaces';

export class VSTSWorkItem {
    // VSTS REST API paths
    private readonly vstsProjectRoot: string;
    // WIT
    private readonly vstsWorkItems: string;
    private readonly vstsCreateWorkItems: string;
    // WIQL
    private readonly vstsStoredQuery: string;
    private readonly vstsExecuteWIQL: string;

    private log: ILogger;
    private restClientFactory: IAsyncRestClientFactory;
    private vstsConfig: IVSTSConfig;

    constructor(restClientFactory: IAsyncRestClientFactory, vstsConfig: IVSTSConfig) {
        this .restClientFactory = restClientFactory;
        this .vstsConfig = vstsConfig;

        this .vstsProjectRoot = this .vstsConfig.endpoint + '/DefaultCollection/' + this .vstsConfig.project;
        // WIT
        this .vstsWorkItems = this .vstsConfig.endpoint + '/_apis/wit/workitems';
        this .vstsCreateWorkItems = this .vstsProjectRoot + '/_apis/wit/workitems/${workItemType}';
        // WIQL
        this .vstsStoredQuery = this .vstsConfig.endpoint + '/_apis/wit/wiql/${id}';
        this .vstsExecuteWIQL = this .vstsProjectRoot + '/_apis/wit/wiql';
    }

    public async AddWorkItem(item: INewWorkItem) {
        const payload: Array< { 'op': string, 'path': string, 'value': any }> = [];
        for (const key in item.fields) {
            if (item.fields.hasOwnProperty(key)) {
                const value = item.fields[key];
                payload.push({ op: 'add', path: '/fields/' + key, value });
            }
        }

        if (item.relations) {
            item.relations.forEach((rel) => {
                payload.push({ op: 'add', path: '/relations/-', value: rel });
            });
        }

        const path: { [index: string]: string } = {};
        path.workItemType = '$' + item.workItemType;

        const returnItem = await this .restClientFactory.CreateClient()
            .ExecuteOperation< IActualWorkItem>(Methods.PATCH, this .vstsCreateWorkItems, { data: payload, path });
        return returnItem;
    }

    public async UpdateWorkItem(originalItem: IActualWorkItem,
                                changeFieldList?: { [fieldName: string]: string | number | null },
                                changeRelationList?: IWorkItemRelationship[]) {

        const payload: Array< { 'op': string, 'path': string, 'value'?: any }> = [];

        if (changeFieldList) {
            for (const key in changeFieldList) {
                if (changeFieldList.hasOwnProperty(key)) {
                    const value = changeFieldList[key];
                    let op: string;
                    op = !originalItem.fields.hasOwnProperty(key) ? 'add' : (value == null ? 'remove' : 'replace');
                    payload.push({ op, path: '/fields/' + key, value });
                }
            }
        }

        if (changeRelationList) {
            let origTargets = {};
            const newTargets = _.indexBy(changeRelationList, 'url');
            if (originalItem.relations) {
                origTargets = _.indexBy(originalItem.relations, 'url');
            }
            const updateKeys = _.intersection(_.keys(newTargets), _.keys(origTargets));
            const newKeys = _.difference(_.keys(newTargets), _.keys(origTargets));
            const removeKeys = _.difference(_.keys(origTargets), _.keys(newTargets));

            removeKeys.forEach((url) => {
                const index = _.findIndex< IWorkItemRelationship>(
                    originalItem.relations as _.List< IWorkItemRelationship>,
                    (rel) => rel.url === url);
                payload.push({ op: 'remove', path: '/relations/' + index.toString() });
            });

            newKeys.forEach((url) => {
                const index = _.findIndex< IWorkItemRelationship>( changeRelationList as _.List< IWorkItemRelationship>,
                    (rel) => rel.url === url);
                payload.push({ op: 'add', path: '/relations/-', value: changeRelationList[index] });
            });

            updateKeys.forEach((url) => {
                const index = _.findIndex< IWorkItemRelationship>(
                    originalItem.relations as _.List< IWorkItemRelationship>,
                    (rel) => rel.url = url);
                const value = newTargets[url];
                const updates = _.intersection(_.keys(value.attributes),
                // Using non-null assertion operator on relations. Tests need to be written to validate.
                _.keys(originalItem.relations![index].attributes));
                updates.forEach((key) => {
                    payload.push({ op: 'replace',
                    path: '/relations/' + index.toString() + '/attributes/' + key,
                    value: value.attributes[key] });
                });
            });
        }

        const returnItem = await this .restClientFactory.CreateClient()
        .ExecuteOperation< IActualWorkItem>(Methods.PATCH,
            this .vstsWorkItems + '/' + originalItem.id, { data: payload });
        return returnItem;
    }

    public async GetActualWorkItemFromUrl(url: string, fields?: string[], includeRelationships?: boolean) {
        const parameters: { [index: string]: string } = {};
        if (fields) {
            parameters.fields = fields.join();
        }
        if (includeRelationships !== undefined && includeRelationships === true) {
            parameters.$expand = 'all';
        }
        return this .restClientFactory
                   .CreateClient()
                   .ExecuteOperation< IActualWorkItem>(Methods.GET, url, { parameters });
    }

    public async GetItemFromUrl< T>(url: string) {
        return this .restClientFactory.CreateClient().ExecuteOperation< T>(Methods.GET, url, {});
    }

    public async GetWorkItems(items: IVSTSItem[], fields?: string[]): Promise< IActualWorkItem[]>;
    public async GetWorkItems(ids: number[], fields?: string[]): Promise< IActualWorkItem[]>;
    public async GetWorkItems(itemsOrIds: IVSTSItem[] | number[], fields?: string[]): Promise< IActualWorkItem[]> {
        let ids: number[];

        if (( (itemsOrIds[0]) as IVSTSItem).id) {
            const items: IVSTSItem[] =  itemsOrIds as IVSTSItem[];
            ids = _.map< IVSTSItem, number>(items, (item: IVSTSItem) => item.id);
        } else {
            ids =  itemsOrIds as number[];
        }

        if (ids.length > 200) {
            const first = await this .GetWorkItems(ids.slice(0, 200), fields);
            const second = await this .GetWorkItems(ids.slice(200, ids.length), fields);
            const x = _.union< IActualWorkItem>(first, second);
            return x;
        }

        const parameters: { [index: string]: string } = {};
        parameters.ids = ids.join();

        if (fields) {
            parameters.fields = fields.join();
        } else {
            parameters.$expand = 'all';
        }
        const value = await this .restClientFactory.CreateClient()
        .ExecuteOperation< IActualWorkItem[]>(Methods.GET, this .vstsWorkItems, { parameters });
        return value;
    }

    public async GetResultsFromStoredQuery(queryId: number): Promise< object> {
        const path: { [index: string]: number } = {};
        path.id = queryId;
        return this .restClientFactory
        .CreateClient()
        .ExecuteOperation(Methods.GET, this .vstsStoredQuery, { path });
    }

    public async ExecuteQuery< T extends IWIQLResultBase>(query: string) {
        return this .restClientFactory.CreateClient().ExecuteOperation< T>(Methods.POST, this .vstsExecuteWIQL, {
            data: {
                query,
            },
        });
    }
}
