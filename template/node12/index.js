// Copyright (c) Alex Ellis 2021. All rights reserved.
// Copyright (c) OpenFaaS Author(s) 2021. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

"use strict"

const fs = require('fs');
const express = require('express')
const app = express()
const listenersHandler = require('../application/listeners/index');
const uiHandler = require('../application/ui/index');
const widgetHandler = require('../application/widgets/index');
const performance = require('perf_hooks').performance;
const bodyParser = require('body-parser')

const defaultMaxSize = '100kb' // body-parser default

app.disable('x-powered-by');

const rawLimit = process.env.MAX_RAW_SIZE || defaultMaxSize
const jsonLimit = process.env.MAX_JSON_SIZE || defaultMaxSize

app.use(function addDefaultContentType(req, res, next) {
    // When no content-type is given, the body element is set to 
    // nil, and has been a source of contention for new users.

    if (!req.headers['content-type']) {
        req.headers['content-type'] = "text/plain"
    }
    next()
})

if (process.env.RAW_BODY === 'true') {
    app.use(bodyParser.raw({ type: '*/*', limit: rawLimit }))
} else {
    app.use(bodyParser.text({ type: "text/*" }));
    app.use(bodyParser.json({ limit: jsonLimit }));
    app.use(bodyParser.urlencoded({ extended: true }));
}

const middleware = async (req, res) => {
    // Checking whether middleware received a Resource or Action request
    if (req.body.resource) {
        handleAppResource(req, res);
    } else {
        handleAppAction(req, res);
    }
};

function handleAppResource(req, res) {
    const resources_path = "../application/resources/";

    // Checking file extensions according to which ones Flutter can handle
    if (req.body.resource.match(/.*(\.jpeg|\.jpg|\.png|\.gif|\.webp|\.bmp|\.wbmp)$/)) {
        res.sendFile(req.body.resource, { root: resources_path });
    } else {
        res.sendStatus(404);
    }
}

//return ui following context
function handleUi(req, res) {
    let uiStartTime = process.hrtime.bigint();
    let { context } = req.body;
    let possibleFutureRes = uiHandler(context);

    Promise.resolve(possibleFutureRes).then(
        newUi => {
            uiStopTime = process.hrtime.bigint();
            res.status(200).json({ ui: newUi, stats: { ui: Number(uiStopTime - uiStartTime) } });
        }
    ).catch(
        err => {
            res.status(500).send(err.toString ? err.toString() : err);
        }
    )
}


function handleAppAction(req, res) {
    /*let uiStartTime;
    let uiStopTime;*/
    let listenersStopTime;
    let newData = {};
    let { action, data, props, event } = req.body;
    let listenersStartTime = process.hrtime.bigint();
    let possibleFutureRes = listenersHandler(action, data, props, event);

    Promise.resolve(possibleFutureRes)
        .then(res => {
            listenersStopTime = process.hrtime.bigint();
            newData = res;
            res.status(200).json({ data: newData, stats: { listeners: Number(listenersStopTime - listenersStartTime) } })
        })
        .catch(err => {
            res.status(500).send(err.toString ? err.toString() : err);
        });
}

function handleWidget(req, res) {
    //query was replace by data
    let { name, data } = req.body;
    let possibleFutureRes = widgetHandler(name, data);

    Promise.resolve(possibleFutureRes).then(
        widget_ui => {
            res.status(200).json({ widget: widget_ui })
        }
    ).catch(err => {
        res.status(500).send(err.toString ? err.toString() : err);
    })
}

//call direclty ui
app.post('/*', handleUi);
//middleware to catch ressource
app.post('/listener', middleware);
//cal widget with data in body
app.post('/widget', handleWidget);

const port = process.env.http_port || 3000;

app.listen(port, () => {
    console.log(`node12 listening on port: ${port}`)
});