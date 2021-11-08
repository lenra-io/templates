// Copyright (c) Alex Ellis 2021. All rights reserved.
// Copyright (c) OpenFaaS Author(s) 2021. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

"use strict"

const express = require('express')
const app = express()
const manifest = require('../application/manifest');
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

const entrypoint = async (req, res) => {
    switch (req.body.call) {
        case "res":
            handleAppResource(req, res);
            break;
        case "listener":
            handleListenerCall(req, res);
            break;
        case "widget":
            handleWidgetCall(req, res);
            break;
        default:
            res.status(500).send("Body property 'call' is invalid. Must be 'res' for resources, 'listener' for a listener call or 'widget' for a widget call.");
            break;
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

/**
 * expect the body to be :
 *  {
 *      calls: [
 *          {name: "myWidget", data: {"my": "data"}, props: {"my": "props"}}
 *          ...
 *      ]
 *  }
 * 
 *  expect the manifest to have the map of all widget functions : 
 *  {
 *      "myWidget": myWidget(data, props) {...} 
 *      ...
 * }
 * 
 * Then apply all the widget call and send the result to the res with 200 status.
 */
function handleWidgetCall(req, res) {
    try {
        let uiStartTime = process.hrtime.bigint();
        let { calls } = req.body;
        let widgets = calls.map(call => manifest.widgets[call.name](call.data, call.props));
        let uiStopTime = process.hrtime.bigint();
        res.status(200).json({ widgets: widgets, stats: { ui: Number(uiStopTime - uiStartTime) } });
    } catch (err) {
        res.status(500).send(err.toString ? err.toString() : err);
    }
}


/**
 * 
 *  Expect the body to be like : 
 *  { 
 *      "action": "myAction",
 *      "data": {"my": "data"},
 *      "props": {"my": "props"},
 *      "event": {"value": "foo"},
 *  }
 * 
 *  Expect the manifest to have the map of all listeners
 *  {
 *      listeners: {
 *          "myAction": myAction(data, props, event) { ... }
 *      }
 *  }
 */
function handleListenerCall(req, res) {
    let listenersStartTime = process.hrtime.bigint();
    let listenersStopTime;
    let { action, data, props, event } = req.body;
    let asyncListenerCall = manifest.listeners[action](data, props, event);
    Promise.resolve(asyncListenerCall).then(res => {
        listenersStopTime = process.hrtime.bigint();
        res.status(200).json({ stats: { listeners: Number(listenersStopTime - listenersStartTime) } });
    }).catch(err => {
        res.status(500).send(err.toString ? err.toString() : err);
    });

}

app.post('/*', entrypoint);

const port = process.env.http_port || 3000;

app.listen(port, () => {
    console.log(`node12 listening on port: ${port}`)
});