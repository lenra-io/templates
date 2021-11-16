// Copyright (c) Alex Ellis 2021. All rights reserved.
// Copyright (c) OpenFaaS Author(s) 2021. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

"use strict"

const fs = require('fs');
const express = require('express')
const app = express()

let listenerHandlers = {};
let widgetHandlers = {};
const manifestHandler = require('../application/index');

const performance = require('perf_hooks').performance;
const { randomUUID } = require('crypto');

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
    app.use(express.raw({ type: '*/*', limit: rawLimit }))
} else {
    app.use(express.text({ type: "text/*" }));
    app.use(express.json({ limit: jsonLimit }));
    app.use(express.urlencoded({ extended: true }));
}

const middleware = async (req, res) => {
    // Checking whether middleware received a Resource or Action request
    if (req.body.resource) {
        handleAppResource(req, res);
    } else if (req.body.action) {
        handleAppAction(req, res);
    } else if (req.body.widget) {
        handleAppWidget(req, res);
    } else {
        handleAppRoot(req, res);
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

function handleAppRoot(req, res) {

    let uiStartTime = process.hrtime.bigint();

    let possibleFutureRes = manifestHandler();

    Promise.resolve(possibleFutureRes)
        .then(manifest => {
            let uiStopTime = process.hrtime.bigint();

            widgetHandlers = manifest.widgets;
            listenerHandlers = manifest.listeners;
            manifest.widgets = Object.keys(widgetHandlers).reduce((acc, widget) => ({...acc, [`${widget}-${randomUUID()}`]: widget}));
            manifest.listeners = Object.keys(listenerHandlers).reduce((acc, listener) => ({...acc, [`${listener}-${randomUUID()}`]: listener}));
            widgetHandlers = Object.entries(manifest.widgets).map(([key, value]) => [key, widgetHandlers[value]]);
            res.status(200).json({ ui: manifest, stats: { ui: Number(uiStopTime - uiStartTime) } });
        })
        .catch(err => {
            res.status(500).send(err.toString ? err.toString() : err);
        });
}

function handleAppWidget(req, res) {

    let { widget, data, props } = req.body;

    let uiStartTime = process.hrtime.bigint();

    let possibleFutureRes = widgetHandlers[widget](data, props);

    Promise.resolve(possibleFutureRes)
        .then(newUi => {
            let uiStopTime = process.hrtime.bigint();
            res.status(200).json({ ui: newUi, stats: { ui: Number(uiStopTime - uiStartTime) } });
        })
        .catch(err => {
            res.status(500).send(err.toString ? err.toString() : err);
        });
}

/**
 * This is the main entry point for the OpenFaaS function.
 *
 * This function will call the index.js file of the application
 * when the page change.
 * If an event is triggered, the matched event function provided by the app is triggered.
 * The event can be a listener or a widget update.
 */
function handleAppAction(req, res) {
    let newData = {};

    let { action, data, props, event } = req.body;

    /*
        listeners file need to exactly math with action name
    */
    let listenersHandler = require('../application/listeners/' + action);
    let listenersStartTime = process.hrtime.bigint();

    let possibleFutureRes = listenersHandler(action, data, props, event);

    Promise.resolve(possibleFutureRes)
        .then(res => {
            let listenersStopTime = process.hrtime.bigint();
            newData = res;
            res.status(200).json({ data: newData, stats: { listeners: Number(listenersStopTime - listenersStartTime) } });
        })
        .catch(err => {
            res.status(500).send(err.toString ? err.toString() : err);
        });
}

function handleWidget(req, res) {
    //query was replace by data
    let { name, data } = req.body;

    /*
        widget file need to exactly math with widget name
    */
    let widgetHandler = require('../application/widgets/' + name);
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
