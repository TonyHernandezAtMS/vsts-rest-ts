"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var _ = require("underscore");
var noderestclient = require("node-rest-client");
var WorkItemRelationshipConstants = (function () {
    function WorkItemRelationshipConstants() {
    }
    WorkItemRelationshipConstants.ReferencedBy = "Microsoft.VSTS.TestCase.SharedParameterReferencedBy-Forward";
    WorkItemRelationshipConstants.References = "Microsoft.VSTS.TestCase.SharedParameterReferencedBy-Reverse";
    WorkItemRelationshipConstants.TestedBy = "Microsoft.VSTS.Common.TestedBy-Forward";
    WorkItemRelationshipConstants.Tests = "Microsoft.VSTS.Common.TestedBy-Reverse";
    WorkItemRelationshipConstants.TestCase = "Microsoft.VSTS.TestCase.SharedStepReferencedBy-Forward";
    WorkItemRelationshipConstants.SharedSteps = "Microsoft.VSTS.TestCase.SharedStepReferencedBy-Reverse";
    WorkItemRelationshipConstants.Duplicate = "System.LinkTypes.Duplicate-Forward";
    WorkItemRelationshipConstants.DuplicateOf = "System.LinkTypes.Duplicate-Forward";
    WorkItemRelationshipConstants.Successor = "System.LinkTypes.Dependency-Forward";
    WorkItemRelationshipConstants.Predecessor = "System.LinkTypes.Dependency-Reverse";
    WorkItemRelationshipConstants.Child = "System.LinkTypes.Hierarchy-Forward";
    WorkItemRelationshipConstants.Parent = "System.LinkTypes.Hierarchy-Reverse";
    WorkItemRelationshipConstants.Related = "System.LinkTypes.Related";
    WorkItemRelationshipConstants.AttachedFile = "AttachedFile";
    WorkItemRelationshipConstants.Hyperlink = "Hyperlink";
    WorkItemRelationshipConstants.ArtifactLink = "ArtifactLink";
    return WorkItemRelationshipConstants;
}());
exports.WorkItemRelationshipConstants = WorkItemRelationshipConstants;
var Methods;
(function (Methods) {
    Methods[Methods["GET"] = 0] = "GET";
    Methods[Methods["POST"] = 1] = "POST";
    Methods[Methods["UPDATE"] = 2] = "UPDATE";
    Methods[Methods["DELETE"] = 3] = "DELETE";
    Methods[Methods["PATCH"] = 4] = "PATCH";
})(Methods || (Methods = {}));
var VSTSClient = (function () {
    function VSTSClient(vstsConfig, logger) {
        this.vstsConfig = vstsConfig;
        this.vstsProjectRoot = this.vstsConfig.endpoint + "/DefaultCollection/" + this.vstsConfig.project;
        this.vstsTestCases = this.vstsProjectRoot + "/_apis/test/plans/${planID}/suites/${suiteID}";
        this.vstsTestPoints = this.vstsProjectRoot + "/_apis/test/plans/${planId}/suites/${suiteId}/points";
        this.vstsTestPlans = this.vstsProjectRoot + "/_apis/test/plans";
        this.vstsTestPlanSingle = this.vstsProjectRoot + "/_apis/test/plans/${planID}";
        this.vstsTestRuns = this.vstsProjectRoot + "/_apis/test/runs";
        this.vstsTestResults = this.vstsProjectRoot + "/_apis/test/runs/${runID}/results";
        this.vstsTestSuites = this.vstsProjectRoot + "/_apis/test/plans/${planID}/suites";
        this.vstsWorkItems = this.vstsConfig.endpoint + "/_apis/wit/workitems";
        this.vstsCreateWorkItems = this.vstsProjectRoot + "/_apis/wit/workitems/${workItemType}";
        this.vstsStoredQuery = this.vstsConfig.endpoint + "/_apis/wit/wiql/${id}";
        this.vstsExecuteWIQL = this.vstsProjectRoot + "/_apis/wit/wiql";
        this.log = logger;
    }
    VSTSClient.prototype.ClientFactory = function () {
        return new VSTSOperation(this.vstsConfig.username, this.vstsConfig.password, this.log);
    };
    VSTSClient.prototype.AddWorkItem = function (item) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var payload, key, value, path, returnItem;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        payload = [];
                        for (key in item.fields) {
                            if (item.fields.hasOwnProperty(key)) {
                                value = item.fields[key];
                                payload.push({ "op": "add", "path": "/fields/" + key, "value": value });
                            }
                        }
                        if (item.relations) {
                            item.relations.forEach(function (rel) {
                                payload.push({ "op": "add", "path": "/relations/-", "value": rel });
                            });
                        }
                        path = {};
                        path["workItemType"] = "$" + item.workItemType;
                        return [4, this.ClientFactory().ExecuteOperation(4, this.vstsCreateWorkItems, { data: payload, path: path })];
                    case 1:
                        returnItem = _a.sent();
                        return [2, returnItem];
                }
            });
        });
    };
    VSTSClient.prototype.UpdateWorkItem = function (originalItem, changeFieldList, changeRelationList) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var payload, key, value, op, origTargets, newTargets, updateKeys, newKeys, removeKeys, returnItem;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        payload = [];
                        if (changeFieldList) {
                            for (key in changeFieldList) {
                                if (changeFieldList.hasOwnProperty(key)) {
                                    value = changeFieldList[key];
                                    op = void 0;
                                    op = !originalItem.fields.hasOwnProperty(key) ? "add" : (value == null ? "remove" : "replace");
                                    payload.push({ "op": op, "path": "/fields/" + key, "value": value });
                                }
                            }
                        }
                        if (changeRelationList) {
                            origTargets = {};
                            newTargets = _.indexBy(changeRelationList, 'url');
                            if (originalItem.relations) {
                                origTargets = _.indexBy(originalItem.relations, 'url');
                            }
                            updateKeys = _.intersection(_.keys(newTargets), _.keys(origTargets));
                            newKeys = _.difference(_.keys(newTargets), _.keys(origTargets));
                            removeKeys = _.difference(_.keys(origTargets), _.keys(newTargets));
                            removeKeys.forEach(function (url) {
                                var index = _.findIndex(originalItem.relations, function (rel) { return rel.url == url; });
                                payload.push({ "op": "remove", "path": "/relations/" + index.toString() });
                            });
                            newKeys.forEach(function (url) {
                                var index = _.findIndex(changeRelationList, function (rel) { return rel.url == url; });
                                payload.push({ "op": "add", "path": "/relations/-", "value": changeRelationList[index] });
                            });
                            updateKeys.forEach(function (url) {
                                var index = _.findIndex(originalItem.relations, function (rel) { return rel.url == url; });
                                var value = newTargets[url];
                                var updates = _.intersection(_.keys(value.attributes), _.keys(originalItem.relations[index].attributes));
                                updates.forEach(function (key) {
                                    payload.push({ "op": "replace", "path": "/relations/" + index.toString() + "/attributes/" + key, "value": value.attributes[key] });
                                });
                            });
                        }
                        return [4, this.ClientFactory().ExecuteOperation(4, this.vstsWorkItems + "/" + originalItem.id, { data: payload })];
                    case 1:
                        returnItem = _a.sent();
                        return [2, returnItem];
                }
            });
        });
    };
    VSTSClient.prototype.GetActualWorkItemFromUrl = function (url, fields, includeRelationships) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var parameters;
            return tslib_1.__generator(this, function (_a) {
                parameters = {};
                if (fields)
                    parameters["fields"] = fields.join();
                if (includeRelationships != undefined && includeRelationships === true)
                    parameters["$expand"] = "all";
                return [2, this.ClientFactory().ExecuteOperation(0, url, { parameters: parameters })];
            });
        });
    };
    VSTSClient.prototype.GetItemFromUrl = function (url) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            return tslib_1.__generator(this, function (_a) {
                return [2, this.ClientFactory().ExecuteOperation(0, url, {})];
            });
        });
    };
    VSTSClient.prototype.GetWorkItems = function (itemsOrIds, fields) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var ids, items, first, second, x, parameters, value;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if ((itemsOrIds[0]).id) {
                            items = itemsOrIds;
                            ids = _.map(items, function (item) { return item.id; });
                        }
                        else {
                            ids = itemsOrIds;
                        }
                        if (!(ids.length > 200)) return [3, 3];
                        return [4, this.GetWorkItems(ids.slice(0, 200), fields)];
                    case 1:
                        first = _a.sent();
                        return [4, this.GetWorkItems(ids.slice(200, ids.length), fields)];
                    case 2:
                        second = _a.sent();
                        x = _.union(first, second);
                        return [2, x];
                    case 3:
                        parameters = {};
                        parameters["ids"] = ids.join();
                        if (fields) {
                            parameters["fields"] = fields.join();
                        }
                        else {
                            parameters['$expand'] = 'all';
                        }
                        return [4, this.ClientFactory().ExecuteOperation(0, this.vstsWorkItems, { parameters: parameters })];
                    case 4:
                        value = _a.sent();
                        return [2, value];
                }
            });
        });
    };
    VSTSClient.prototype.GetTestPoints = function (planID, suiteID, testcaseID, configurationID) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var path, parameters;
            return tslib_1.__generator(this, function (_a) {
                path = {};
                path["planId"] = planID;
                path["suiteID"] = suiteID;
                parameters = {};
                parameters["includePointDetails"] = "true";
                if (testcaseID) {
                    parameters['testCaseId'] = testcaseID.toString();
                }
                if (configurationID) {
                    parameters['configurationId'] = configurationID.toString();
                }
                return [2, this.ClientFactory().ExecuteOperation(0, this.vstsTestPoints, { path: path, parameters: parameters })];
            });
        });
    };
    VSTSClient.prototype.GetTestPlans = function (owner) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var parameters;
            return tslib_1.__generator(this, function (_a) {
                parameters = {};
                parameters["includePlanDetails"] = "true";
                parameters["owner"] = owner;
                return [2, this.ClientFactory().ExecuteOperation(0, this.vstsTestPlans, { parameters: parameters })];
            });
        });
    };
    VSTSClient.prototype.GetResultsFromStoredQuery = function (queryId) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var path;
            return tslib_1.__generator(this, function (_a) {
                path = {};
                path["id"] = queryId;
                return [2, this.ClientFactory().ExecuteOperation(0, this.vstsStoredQuery, { path: path })];
            });
        });
    };
    VSTSClient.prototype.GetTestRuns = function (testPlan) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var parameters;
            return tslib_1.__generator(this, function (_a) {
                parameters = {};
                parameters["planId"] = testPlan.id.toString();
                parameters["includeRunDetails"] = "true";
                return [2, this.ClientFactory().ExecuteOperation(0, this.vstsTestRuns, { parameters: parameters })];
            });
        });
    };
    VSTSClient.prototype.GetTestResults = function (testRun) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            return tslib_1.__generator(this, function (_a) {
                return [2, this.GetTestResult(this.vstsTestResults, { path: { "runID": testRun.id } })];
            });
        });
    };
    ;
    VSTSClient.prototype.GetTestResult = function (url, args) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var parameters;
            return tslib_1.__generator(this, function (_a) {
                parameters = {};
                parameters["detailsToInclude"] = "WorkItems";
                parameters["$top"] = "100";
                args.parameters = parameters;
                return [2, this.ClientFactory().ExecuteOperation(0, url, args)];
            });
        });
    };
    VSTSClient.prototype.GetTestSuites = function (testPlan) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var path;
            return tslib_1.__generator(this, function (_a) {
                path = {};
                path["planID"] = testPlan.id;
                return [2, this.ClientFactory().ExecuteOperation(0, this.vstsTestSuites, { path: path })];
            });
        });
    };
    ;
    VSTSClient.prototype.GetTestPlan = function (id) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var path;
            return tslib_1.__generator(this, function (_a) {
                path = {};
                path["planID"] = id;
                return [2, this.ClientFactory().ExecuteOperation(0, this.vstsTestPlanSingle, { path: path })];
            });
        });
    };
    VSTSClient.prototype.GetTestCases = function (testPlan, testSuite) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var path;
            return tslib_1.__generator(this, function (_a) {
                path = {};
                path["planID"] = testPlan.id;
                path["suiteID"] = testSuite.id;
                return [2, this.ClientFactory().ExecuteOperation(0, this.vstsTestCases, { path: path })];
            });
        });
    };
    ;
    VSTSClient.prototype.ExecuteQuery = function (query) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            return tslib_1.__generator(this, function (_a) {
                return [2, this.ClientFactory().ExecuteOperation(1, this.vstsExecuteWIQL, {
                        data: {
                            query: query
                        }
                    })];
            });
        });
    };
    return VSTSClient;
}());
exports.VSTSClient = VSTSClient;
var VSTSOperation = (function () {
    function VSTSOperation(username, password, logger) {
        this.log = logger;
        var options_auth = {
            user: username,
            password: password,
            connection: {
                headers: {
                    "Accept": "application/json; api-version=3.0",
                    "Content-Type": "application/json"
                }
            },
            mimetypes: {
                json: ["application/json", "application/json;charset=utf-8", "application/json;api-version=3.0", "application/json;charset=utf-8;api-version=3.0"],
                xml: ["application/xml", "application/xml;charset=utf-8"]
            },
            requestConfig: {
                noDelay: true,
                keepAlive: true
            }
        };
        if (process.env.FIDDLER) {
            options_auth["proxy"] = {
                host: "localhost",
                port: 8888,
                tunnel: true
            };
        }
        this.client = new noderestclient.Client(options_auth);
        var JSONSerializer = this.client.serializers.find("JSON");
        JSONSerializer.isDefault = true;
        this.client.serializers.clean();
        this.client.serializers.add(JSONSerializer);
    }
    VSTSOperation.prototype.ExecuteOperation = function (method, URL, args) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var _this = this;
            var opMethod;
            return tslib_1.__generator(this, function (_a) {
                switch (method) {
                    case 3:
                        opMethod = this.client.delete;
                        break;
                    case 2:
                        opMethod = this.client.update;
                        break;
                    case 1:
                        opMethod = this.client.post;
                        break;
                    case 4:
                        opMethod = this.client.patch;
                        args.headers = args.headers || {};
                        args.headers["Content-Type"] = "application/json-patch+json";
                        break;
                    default:
                        opMethod = this.client.get;
                        break;
                }
                return [2, new Promise(function (fulfill, reject) {
                        opMethod(URL, args, function (data, response) {
                            if (response.statusCode === 200) {
                                if (data.count > 0) {
                                    fulfill(data.value);
                                }
                                else {
                                    fulfill(data);
                                }
                            }
                            else if (response.statusCode === 503) {
                                VSTSOperation.throttled = true;
                                _this.log.info("Retrying: " + response.req.path);
                                _this.ExecuteOperation(method, URL, args)
                                    .then(function (x) {
                                    _this.log.info("SUCCESS: retry");
                                    VSTSOperation.throttled = false;
                                    fulfill(x);
                                })
                                    .catch(function (reason) {
                                    _this.log.info("retry: FAILED");
                                    _this.log.info(reason.toString());
                                });
                            }
                            else {
                                _this.log.info(response.statusCode);
                                _this.log.info(response.statusMessage);
                                _this.log.info(response.req.path);
                                if (Buffer.isBuffer(data)) {
                                    _this.log.info(data.toString("utf8"));
                                }
                                else if (typeof data === "object") {
                                    Object.keys(data).map(function (e) { return _this.log.info("key=" + e + "  value=" + data[e]); });
                                }
                                else {
                                    _this.log.info(data.toString("utf8"));
                                }
                                reject(response);
                            }
                        });
                    })];
            });
        });
    };
    VSTSOperation.throttled = false;
    return VSTSOperation;
}());
