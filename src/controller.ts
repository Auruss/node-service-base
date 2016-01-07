export interface RequestData {
    id: number;

    requestType: string;
    requestSize: number;

    urlVariables: any;
    postData: any;

    queryVariables: any;
}

export class ResponseData {
    private _status: number;
    private _errors: any;
    private _raws: any;
    private _models: any;

    constructor() {
        this._errors = {};
        this._raws = {};
        this._models = {};
        this._status = 200;
    }

    setStatus(val: number) { this._status = val; }
    getStatus(): number { return this._status; }
    getContentType(): string { return 'application/json'; }

    addError(type: string, message: string) {
        this._errors[type] = message;
    }
    foreachError(cb: (type: string, message: string) => void) {
        for (var errorType in this._errors) {
            cb(errorType, this._errors[errorType]);
        }
    }

    addModel(model: string, data: any) {
        if (typeof this._models[model] == 'undefined') {
            this._models[model] = data;
        } else {
            if (Array.isArray(this._models[model])) {
                this._models[model].push(data);
            } else {
                this._models[model] = [this._models[model]];
                this._models[model].push(data);
            }
        }
    }

    addRawData(keyName: string, data: any) {
        this._raws[keyName] = data;
    }

    build(): string {
        var data = {
            raw: this._raws,
            models: this._models,
            errors: this._errors
        };

        if (g.Config.http.prettyResponse) {
            return JSON.stringify(data, null, '\t');
        } else {
            return JSON.stringify(data);
        }
    }
}

class HtmlResponseData {
    private _html: string;

    constructor(html: string) {
        this._html = html;
    }

    //setStatus(val: number) { this._status = val; }
    getStatus(): number { return 200; }
    getContentType(): string { return 'text/html'; }

    build(): string {
        return this._html;
    }
}

import g = require('./global');
import metrics = require('./metrics/logstash');
import orm = require('./orm');
import views = require('./views');
import aapi = require('./helper/api');

import hapi = require('hapi');
import winston = require('winston');
import seq = require('sequelize');
import _ = require('lodash');
import q = require('q');

export interface Internal {
    name: string;
    path: string;
}

export type Reply = (res: ResponseData) => void;

var _constMasterData = {};

/**
 * Sets constant data for the master template
 * @param key
 * @param data
 */
export function setConstMasterData(key: string, data: any) {
    _constMasterData[key] = data;
}

/**
 * defines the interface for all controllers
 */
export class BaseController {
    private _internals: Internal;

    /**
     * Setup the controller
     */
    setup() {

    }

    /**
     * Internal initialization
     */
    internalInit(data: Internal) {
        this._internals = data;
    }

    /**
     * Returns internal data
     */
    getInternals(): Internal {
        return this._internals;
    }

    /**
     * Asks the controller if the user is authenticated to use it.
     */
    auth(action: string): boolean {
        return true;
    }

    /**
     * Logs a message with additional json data, used for request logging
     *
     * @param level
     * @param message
     * @param request
     * @param payload
     */
    log(level: string, message: string, request: RequestData, payload: any = {}) {
        winston.log(level, message, { requestId: request.id, payloadData: payload });
    }

    /**
     * Request an api call
     * @param url
     */
    api(url: string): aapi.APICall {
        return aapi.api(url);
    }

    /**
     * Gets a loaded model
     *
     * @param name
     */
    getModel<T, TT>(name: string): orm.SmartModel<T, TT>  {
        return orm.getModel<T, TT>(name);
    }

    /**
     * Responds with a rendered view
     *
     * @param name
     * @param data
     * @param master
     * @param reply
     */
    respondView(name: string, data: any, request: RequestData, reply: Reply, master: string = 'master') {
        // Get view contents
        var content = views.renderBlock(name, 'content', data);
        var scripts = views.renderBlock(name, 'footerJS', data);

        var renderMaster = true;
        if (!_.isUndefined(request.queryVariables.noMaster)) {
            if (request.queryVariables.noMaster == 1) {
                renderMaster = false;
            } else {
                renderMaster = true;
            }
        }

        if (renderMaster) {
            var masterData = _constMasterData;
            masterData = _.extend(masterData, {
                title: data.title,
                subtitle: data.subtitle,
                activeMenu: data.activeMenu
            });

            var full = views.renderMaster(master, masterData, {
                content: content,
                footerJS: scripts
            });

            var response:any = new HtmlResponseData(full);
        } else {
            var response:any = new ResponseData();
            response.setStatus(200);

            response.addRawData('html', content);
            response.addRawData('script', scripts);

            response.addRawData('title', data.title);
            response.addRawData('subtitle', data.subtitle);

            response.addRawData('activeMenu', data.activeMenu);
        }

        reply(response);
    }

    respondErrorView(status: number, details: string, request, response, data = {}) {
        this.respondView('error_unknown', {
            status: status,
            details: details,
            data: JSON.stringify(data, null, 2)
        }, request, response);
    }

    /**
     * Adds an dynamic action
     */
    addAction(type: string, path: string, action: string) {
        var path = path;
        if (this._internals.name != 'index') {
            path = '/' + this._internals.name + path;
        }

        g.Server.route({
            method: type,
            path: path,
            handler: (request: hapi.Request, reply: hapi.IReply) => {
                var reqSize: number = 0;
                if (typeof request.headers['Content-Length'] != 'undefined') {
                    reqSize = parseInt(request.headers['Content-Length']);
                }

                var data: RequestData = {
                    id: request.id,

                    requestType: type,
                    requestSize: reqSize,

                    urlVariables: request.params,
                    postData: request.payload,

                    queryVariables: request.query
                };


                this[action](data, (controllerResponse: ResponseData) => {
                    var rawResponseData: string = controllerResponse.build();
                    var hapiResponse = reply(rawResponseData);
                    hapiResponse.statusCode = controllerResponse.getStatus();
                    hapiResponse.header('Content-Type', controllerResponse.getContentType());

                    if (controllerResponse.getStatus() != 200) {
                        controllerResponse.foreachError((type, msg) => {
                            metrics.putErrorResponse(data.id, request.url.href, type, controllerResponse.getStatus(), msg);
                        });
                    } else {
                        metrics.putSuccessResponse(data.id, request.url.href, rawResponseData.length);
                    }
                });
            }
        });
    }

    /**
     * Adds a static folder that should be allowed to be delivered in form of static content
     *
     * @param path
     * @param folder
     */
    addFolderDelivery(path: string, folder: string) {
        var path = path;
        if (this._internals.name != 'index') {
            path = '/' + this._internals.name + path;
        }

        g.Server.route({
            method: 'GET',
            path: path + '{params*}',
            handler: {
                directory: {
                    path: folder
                }
            }
        });
    }

    /**
     * Adds static data as an action
     * @param type
     * @param path
     * @param data
     */
    addStaticAction(type: string, path: string, data: any) { }

}