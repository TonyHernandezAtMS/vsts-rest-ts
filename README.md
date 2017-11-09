[![Build Status](https://travis-ci.org/TonyHernandezAtMS/vsts-rest-ts.svg?branch=master)](https://travis-ci.org/TonyHernandezAtMS/vsts-rest-ts)
[![dependencies Status](https://david-dm.org/TonyHernandezAtMS/vsts-rest-ts/status.svg)](https://david-dm.org/TonyHernandezAtMS/vsts-rest-ts)
[![devDependencies Status](https://david-dm.org/TonyHernandezAtMS/vsts-rest-ts/dev-status.svg)](https://david-dm.org/TonyHernandezAtMS/vsts-rest-ts?type=dev)
[![Coverage Status](https://coveralls.io/repos/github/TonyHernandezAtMS/vsts-rest-ts/badge.svg?branch=master)](https://coveralls.io/github/TonyHernandezAtMS/vsts-rest-ts?branch=master)
[![npm version](https://badge.fury.io/js/vsts-rest-ts.svg)](https://badge.fury.io/js/vsts-rest-ts)
[![MIT license](http://img.shields.io/badge/license-MIT-brightgreen.svg)](http://opensource.org/licenses/MIT)
# vsts-rest-ts
Typescript library for working with VSTS/TFS REST API

## Installation
```
yarn add vsts-rest-ts
```

## Example
```
import VSTSRestClient from "vsts-rest-ts";

const client = new VSTSRestClient(
    {
        endpoint: 'https://company.visualstudio.com',
        password: 'personal access token',
        project: 'OurProject',
        username: 'jimbob@company.com'
    },{
        error: console.log,
        info: console.log,
        verbose: console.log,
        warn: console.log
    });
```
