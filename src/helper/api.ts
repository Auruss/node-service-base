import g = require('../global');

import http = require('http');
import uri = require('url');
import q = require('q');
import winston = require('winston');

export interface APICall {
    get(): q.Promise<any>;
    del(): q.Promise<any>;

    post(data: any): q.Promise<any>;
    put(data: any): q.Promise<any>;
}

var _authKey: string = '';

/**
 * Sets the authentication key for api usage
 * @param key
 */
export function authenticate(key: string) {
    _authKey = key;
}

/**
 * Create a api call instance
 * @param url
 * @returns {{}}
 */
export function api(url: string): APICall {
    // global promise
    var def = q.defer<any>();

    // default options
    var uriData = uri.parse(g.Config.api.url);
    var options = {
        hostname:  uriData.hostname,
        port: uriData.port,
        path: url,
        headers: {},
        method: 'GET'
    };

    // authenticate
    options.headers[g.Config.api.authTokenHeader] = _authKey;

    // handler
    var startRequest = () => {
        var req = http.request(options, (res: http.ClientResponse) => {
            res.setEncoding('utf8');

            if (res.statusCode != 200) {
                res.on('data', (data) => {
                    winston.log('error', 'API failure response details', JSON.parse(data));
                    def.reject({ text: res.statusCode, data: data });
                });
                winston.log('error', 'Invalid api response code -> ' + res.statusCode);
                return;
            }

            res.on('data', (data) => {
                def.resolve(JSON.parse(data));
            });
        });

        req.on('error', (error) => {
            winston.log('error', 'Unknown HTTP request error:', error.message);
            def.reject({ text: error.message, data: {} });
        });
        req.end();
    };

    // return functions
    return {
        get: () => {
            options.method = 'GET';
            startRequest();
            return def.promise;
        },
        del: () => {
            options.method = 'DELETE';
            startRequest();
            return def.promise;
        },

        post: (data: any) => {
            options.method = 'POST';
            startRequest();
            return def.promise;
        },
        put: (data: any) => {
            options.method = 'PUT';
            startRequest();
            return def.promise;
        }
    };
}
